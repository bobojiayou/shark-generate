// tslint:disable:no-global-tslint-disable no-any file-header
import { logging, strings as coreStrings, tags } from '@angular-devkit/core';
const yargsParser = require('yargs-parser');
import {
    ArgumentStrategy,
    CommandConstructor,
    CommandContext,
    CommandScope,
    Option,
} from './command';
import { insideProject } from '../util/project';


export interface CommandMap {
    [key: string]: CommandConstructor;
}

// Based off https://en.wikipedia.org/wiki/Levenshtein_distance
// No optimization, really.
function levenshtein(a: string, b: string): number {
    /* base case: empty strings */
    if (a.length == 0) {
        return b.length;
    }
    if (b.length == 0) {
        return a.length;
    }

    // Test if last characters of the strings match.
    const cost = a[a.length - 1] == b[b.length - 1] ? 0 : 1;

    /* return minimum of delete char from s, delete char from t, and delete char from both */
    return Math.min(
        levenshtein(a.slice(0, -1), b) + 1,
        levenshtein(a, b.slice(0, -1)) + 1,
        levenshtein(a.slice(0, -1), b.slice(0, -1)) + cost,
    );
}

/**
 * Run a command.
 * @param commandMap Map of available commands.
 * e.g{ add: [Function: AddCommand],
  new: { [Function: NewCommand] aliases: [ 'n' ] },
  generate: { [Function: GenerateCommand] aliases: [ 'g' ] },
  update: { [Function: UpdateCommand] aliases: [] },
  build: { [Function: BuildCommand] aliases: [ 'b' ] },
  serve: { [Function: ServeCommand] aliases: [ 's' ] },
  test: { [Function: TestCommand] aliases: [ 't' ] },
  e2e: { [Function: E2eCommand] aliases: [ 'e' ] },
  lint: { [Function: LintCommand] aliases: [ 'l' ] },
  xi18n: [Function: Xi18nCommand],
  run: [Function: RunCommand],
  eject: [Function: EjectCommand],
  'make-this-awesome': [Function: AwesomeCommand],
  config: [Function: ConfigCommand],
  help: [Function: HelpCommand],
  version: { [Function: VersionCommand] aliases: [ 'v' ] },
  doc: { [Function: DocCommand] aliases: [ 'd' ] },
  get: [Function: GetSetCommand],
  set: [Function: GetSetCommand] }
 * @param args Raw unparsed arguments. 未加工的参数 // 所有参数数组 eg. [ 'g', 'pipe', 'bobo', '--skip-import' ]
 * @param logger The logger to use.
 * @param context Execution context. 执行环境：
 * eg.{ project:
   { root: '/Users/bobo/Work/test/my1', //工程目录
     configFile: 'angular.json' 配置文件
    }
     }
 */
export async function runCommand(commandMap: CommandMap,
    args: string[],
    logger: logging.Logger,
    context: CommandContext): Promise<number | void> {

    // if not args supplied, just run the help command.
    if (!args || args.length === 0) {
        args = ['help'];
    }
    /*   console.log('--run commands--')
      console.log('--commandMap--', commandMap)
      console.log('--args--', args)
      console.log('--logger--', logger)
      console.log('--context--', context) */

    // 获取未处理的options ==> 把args处理成 对象
    /*eg {
      _: ['g', 'pipe', 'bobo'],
      help: false,
      h: false,
      'skip-import': true,
      skipImport: true
    } */
    const rawOptions = yargsParser(args, { alias: { help: ['h'] }, boolean: ['help'] });
    console.log('--rawOptions--', rawOptions)
    // 获取 命令名称 或 命令名称简写 eg : 'g'
    let commandName = rawOptions._[0];

    // remove the command name 移除已经获取的命令名称
    rawOptions._ = rawOptions._.slice(1); /* _: [ 'pipe', 'bobo'], */
    // 判断执行作用域，eg: 1 --> 代表in project
    const executionScope = insideProject()
        ? CommandScope.inProject
        : CommandScope.outsideProject;
    console.log('--executionScope--', executionScope);
    // 找到执行命令实现类 Cmd eg:[Function: GenerateCommand]
    let Cmd: CommandConstructor | null;
    Cmd = findCommand(commandMap, commandName);
    /*  console.log('--cmd--', Cmd); */
    // 如果命令实现类与命令名称均不存在，但 options中包含v 或 version.则将Cmd置为 获取版本号的实现类
    if (!Cmd && !commandName && (rawOptions.v || rawOptions.version)) {
        commandName = 'version';
        Cmd = findCommand(commandMap, commandName);
    }

    // 既不满足以上条件，但存在help参数选项，则将 Cmd置为 获取帮助的实现类
    if (!Cmd && rawOptions.help) {
        commandName = 'help';
        Cmd = findCommand(commandMap, commandName);
    }

    // 以上条件均不满足，则报错，则提示与用户输入的字符最相近的那个命令
    if (!Cmd) {
        // 将所有命令依据用户输入的 commandName 进行排序 ，最接近的排前面
        const commandsDistance = {} as { [name: string]: number };
        const allCommands = listAllCommandNames(commandMap).sort((a, b) => {
            if (!(a in commandsDistance)) {
                commandsDistance[a] = levenshtein(a, commandName);
            }
            if (!(b in commandsDistance)) {
                commandsDistance[b] = levenshtein(b, commandName);
            }

            return commandsDistance[a] - commandsDistance[b];
        });

        // 打印错误信息，并提示最接近的正确commands
        logger.error(tags.stripIndent`
        The specified command ("${commandName}") is invalid. For a list of available options,
        run "sgx g help".

        Did you mean "${allCommands[0]}"?
    `);

        return 1;
    }

    /* 传入实例化执行类,
    参数：
      1、context对象 :
      { project:
        { root: '/Users/bobo/Work/test/my1', //工程目录
          configFile: 'angular.json' 配置文件
        }
       }
      2、日志实例：
        logger
    */
    const command = new Cmd(context, logger);

    args = await command.initializeRaw(args);
    let options = parseOptions(args, command.options, command.arguments, command.argStrategy);
    await command.initialize(options);
    options = parseOptions(args, command.options, command.arguments, command.argStrategy);
    if (commandName === 'help') {
        options.commandMap = commandMap;
    }

    if (options.help) {
        command.printHelp(options);

        return;
    } else {
        if (command.scope !== undefined && command.scope !== CommandScope.everywhere) {
            if (command.scope !== executionScope) {
                let errorMessage;
                if (command.scope === CommandScope.inProject) {
                    errorMessage = `This command can only be run inside of a CLI project.`;
                } else {
                    errorMessage = `This command can not be run inside of a CLI project.`;
                }
                logger.fatal(errorMessage);

                return 1;
            }

            if (command.scope === CommandScope.inProject) {
                if (!context.project.configFile) {
                    logger.fatal('Invalid project: missing workspace file.');

                    return 1;
                }
            }
        }

        delete options.h;
        delete options.help;

        // 校验出除h , help之后的 参数对象合法性
        const isValid = await command.validate(options);
        if (!isValid) {
            logger.fatal(`Validation error. Invalid command`);

            return 1;
        }

        // 参数对象合法 则 执行命令
        // options:
        /*    {
             _: ['pipe', 'bobo1'],
             dryRun: false,
             force: false,
             skipImport: true
           } */
        console.log('-执行命令-', options)
        return await command.run(options);
    }
}

export function parseOptions<T = any>(
    args: string[],
    cmdOpts: Option[],
    commandArguments: string[],
    argStrategy: ArgumentStrategy,
): T {
    const parser = yargsParser;

    const aliases = cmdOpts.concat()
        .filter(o => o.aliases && o.aliases.length > 0)
        .reduce((aliases: any, opt: Option) => {
            aliases[opt.name] = (opt.aliases || [])
                .filter(a => a.length === 1);

            return aliases;
        }, {});

    const booleans = cmdOpts
        .filter(o => o.type && o.type === Boolean)
        .map(o => o.name);

    const defaults = cmdOpts
        .filter(o => o.default !== undefined || booleans.indexOf(o.name) !== -1)
        .reduce((defaults: any, opt: Option) => {
            defaults[opt.name] = opt.default;

            return defaults;
        }, {});

    const strings = cmdOpts
        .filter(o => o.type === String)
        .map(o => o.name);

    const numbers = cmdOpts
        .filter(o => o.type === Number)
        .map(o => o.name);


    aliases.help = ['h'];
    booleans.push('help');

    const yargsOptions = {
        alias: aliases,
        boolean: booleans,
        default: defaults,
        string: strings,
        number: numbers,
    };

    const parsedOptions = parser(args, yargsOptions);

    // Remove aliases.
    cmdOpts
        .filter(o => o.aliases && o.aliases.length > 0)
        .map(o => o.aliases)
        .reduce((allAliases: any, aliases: string[]) => {
            return allAliases.concat([...aliases]);
        }, [])
        .forEach((alias: string) => {
            delete parsedOptions[alias];
        });

    // Remove undefined booleans
    booleans
        .filter(b => parsedOptions[b] === undefined)
        .map(b => coreStrings.camelize(b))
        .forEach(b => delete parsedOptions[b]);

    // remove options with dashes.
    Object.keys(parsedOptions)
        .filter(key => key.indexOf('-') !== -1)
        .forEach(key => delete parsedOptions[key]);

    // remove the command name
    parsedOptions._ = parsedOptions._.slice(1);

    switch (argStrategy) {
        case ArgumentStrategy.MapToOptions:
            parsedOptions._.forEach((value: string, index: number) => {
                const arg = commandArguments[index];
                if (arg) {
                    parsedOptions[arg] = value;
                }
            });

            delete parsedOptions._;
            break;
    }

    return parsedOptions as any;
}

// Find a command.
function findCommand(map: CommandMap, name: string): CommandConstructor | null {
    let Cmd: CommandConstructor = map[name];

    if (!Cmd) {
        // find command via aliases
        Cmd = Object.keys(map)
            .filter(key => {
                if (!map[key].aliases) {
                    return false;
                }
                const foundAlias = map[key].aliases
                    .filter((alias: string) => alias === name);

                return foundAlias.length > 0;
            })
            .map((key) => {
                return map[key];
            })[0];
    }

    if (!Cmd) {
        return null;
    }

    return Cmd;
}

function listAllCommandNames(map: CommandMap): string[] {
    return Object.keys(map).concat(
        Object.keys(map)
            .reduce((acc, key) => {
                if (!map[key].aliases) {
                    return acc;
                }

                return acc.concat(map[key].aliases);
            }, [] as string[]),
    );
}
