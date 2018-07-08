"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:no-global-tslint-disable no-any file-header
const core_1 = require("@angular-devkit/core");
const yargsParser = require('yargs-parser');
const command_1 = require("./command");
const project_1 = require("../util/project");
// Based off https://en.wikipedia.org/wiki/Levenshtein_distance
// No optimization, really.
function levenshtein(a, b) {
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
    return Math.min(levenshtein(a.slice(0, -1), b) + 1, levenshtein(a, b.slice(0, -1)) + 1, levenshtein(a.slice(0, -1), b.slice(0, -1)) + cost);
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
function runCommand(commandMap, args, logger, context) {
    return __awaiter(this, void 0, void 0, function* () {
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
        console.log('--rawOptions--', rawOptions);
        // 获取 命令名称 或 命令名称简写 eg : 'g'
        let commandName = rawOptions._[0];
        // remove the command name 移除已经获取的命令名称
        rawOptions._ = rawOptions._.slice(1); /* _: [ 'pipe', 'bobo'], */
        // 判断执行作用域，eg: 1 --> 代表in project
        const executionScope = project_1.insideProject()
            ? command_1.CommandScope.inProject
            : command_1.CommandScope.outsideProject;
        console.log('--executionScope--', executionScope);
        // 找到执行命令实现类 Cmd eg:[Function: GenerateCommand]
        let Cmd;
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
            const commandsDistance = {};
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
            logger.error(core_1.tags.stripIndent `
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
        args = yield command.initializeRaw(args);
        let options = parseOptions(args, command.options, command.arguments, command.argStrategy);
        yield command.initialize(options);
        options = parseOptions(args, command.options, command.arguments, command.argStrategy);
        if (commandName === 'help') {
            options.commandMap = commandMap;
        }
        if (options.help) {
            command.printHelp(options);
            return;
        }
        else {
            if (command.scope !== undefined && command.scope !== command_1.CommandScope.everywhere) {
                if (command.scope !== executionScope) {
                    let errorMessage;
                    if (command.scope === command_1.CommandScope.inProject) {
                        errorMessage = `This command can only be run inside of a CLI project.`;
                    }
                    else {
                        errorMessage = `This command can not be run inside of a CLI project.`;
                    }
                    logger.fatal(errorMessage);
                    return 1;
                }
                if (command.scope === command_1.CommandScope.inProject) {
                    if (!context.project.configFile) {
                        logger.fatal('Invalid project: missing workspace file.');
                        return 1;
                    }
                }
            }
            delete options.h;
            delete options.help;
            // 校验出除h , help之后的 参数对象合法性
            const isValid = yield command.validate(options);
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
            console.log('-执行命令-', options);
            return yield command.run(options);
        }
    });
}
exports.runCommand = runCommand;
function parseOptions(args, cmdOpts, commandArguments, argStrategy) {
    const parser = yargsParser;
    const aliases = cmdOpts.concat()
        .filter(o => o.aliases && o.aliases.length > 0)
        .reduce((aliases, opt) => {
        aliases[opt.name] = (opt.aliases || [])
            .filter(a => a.length === 1);
        return aliases;
    }, {});
    const booleans = cmdOpts
        .filter(o => o.type && o.type === Boolean)
        .map(o => o.name);
    const defaults = cmdOpts
        .filter(o => o.default !== undefined || booleans.indexOf(o.name) !== -1)
        .reduce((defaults, opt) => {
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
        .reduce((allAliases, aliases) => {
        return allAliases.concat([...aliases]);
    }, [])
        .forEach((alias) => {
        delete parsedOptions[alias];
    });
    // Remove undefined booleans
    booleans
        .filter(b => parsedOptions[b] === undefined)
        .map(b => core_1.strings.camelize(b))
        .forEach(b => delete parsedOptions[b]);
    // remove options with dashes.
    Object.keys(parsedOptions)
        .filter(key => key.indexOf('-') !== -1)
        .forEach(key => delete parsedOptions[key]);
    // remove the command name
    parsedOptions._ = parsedOptions._.slice(1);
    switch (argStrategy) {
        case command_1.ArgumentStrategy.MapToOptions:
            parsedOptions._.forEach((value, index) => {
                const arg = commandArguments[index];
                if (arg) {
                    parsedOptions[arg] = value;
                }
            });
            delete parsedOptions._;
            break;
    }
    return parsedOptions;
}
exports.parseOptions = parseOptions;
// Find a command.
function findCommand(map, name) {
    let Cmd = map[name];
    if (!Cmd) {
        // find command via aliases
        Cmd = Object.keys(map)
            .filter(key => {
            if (!map[key].aliases) {
                return false;
            }
            const foundAlias = map[key].aliases
                .filter((alias) => alias === name);
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
function listAllCommandNames(map) {
    return Object.keys(map).concat(Object.keys(map)
        .reduce((acc, key) => {
        if (!map[key].aliases) {
            return acc;
        }
        return acc.concat(map[key].aliases);
    }, []));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZC1ydW5uZXIuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbImNvbW1hbmRzL2NvbW1hbmQtcnVubmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSw2REFBNkQ7QUFDN0QsK0NBQTZFO0FBQzdFLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUM1Qyx1Q0FNbUI7QUFDbkIsNkNBQWdEO0FBT2hELCtEQUErRDtBQUMvRCwyQkFBMkI7QUFDM0IscUJBQXFCLENBQVMsRUFBRSxDQUFTO0lBQ3JDLDhCQUE4QjtJQUM5QixJQUFJLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO1FBQ2YsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDO0tBQ25CO0lBQ0QsSUFBSSxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtRQUNmLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQztLQUNuQjtJQUVELGdEQUFnRDtJQUNoRCxNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFeEQseUZBQXlGO0lBQ3pGLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FDWCxXQUFXLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQ2xDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFDbEMsV0FBVyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtB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Ii8vIHRzbGludDpkaXNhYmxlOm5vLWdsb2JhbC10c2xpbnQtZGlzYWJsZSBuby1hbnkgZmlsZS1oZWFkZXJcbmltcG9ydCB7IGxvZ2dpbmcsIHN0cmluZ3MgYXMgY29yZVN0cmluZ3MsIHRhZ3MgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5jb25zdCB5YXJnc1BhcnNlciA9IHJlcXVpcmUoJ3lhcmdzLXBhcnNlcicpO1xuaW1wb3J0IHtcbiAgICBBcmd1bWVudFN0cmF0ZWd5LFxuICAgIENvbW1hbmRDb25zdHJ1Y3RvcixcbiAgICBDb21tYW5kQ29udGV4dCxcbiAgICBDb21tYW5kU2NvcGUsXG4gICAgT3B0aW9uLFxufSBmcm9tICcuL2NvbW1hbmQnO1xuaW1wb3J0IHsgaW5zaWRlUHJvamVjdCB9IGZyb20gJy4uL3V0aWwvcHJvamVjdCc7XG5cblxuZXhwb3J0IGludGVyZmFjZSBDb21tYW5kTWFwIHtcbiAgICBba2V5OiBzdHJpbmddOiBDb21tYW5kQ29uc3RydWN0b3I7XG59XG5cbi8vIEJhc2VkIG9mZiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9MZXZlbnNodGVpbl9kaXN0YW5jZVxuLy8gTm8gb3B0aW1pemF0aW9uLCByZWFsbHkuXG5mdW5jdGlvbiBsZXZlbnNodGVpbihhOiBzdHJpbmcsIGI6IHN0cmluZyk6IG51bWJlciB7XG4gICAgLyogYmFzZSBjYXNlOiBlbXB0eSBzdHJpbmdzICovXG4gICAgaWYgKGEubGVuZ3RoID09IDApIHtcbiAgICAgICAgcmV0dXJuIGIubGVuZ3RoO1xuICAgIH1cbiAgICBpZiAoYi5sZW5ndGggPT0gMCkge1xuICAgICAgICByZXR1cm4gYS5sZW5ndGg7XG4gICAgfVxuXG4gICAgLy8gVGVzdCBpZiBsYXN0IGNoYXJhY3RlcnMgb2YgdGhlIHN0cmluZ3MgbWF0Y2guXG4gICAgY29uc3QgY29zdCA9IGFbYS5sZW5ndGggLSAxXSA9PSBiW2IubGVuZ3RoIC0gMV0gPyAwIDogMTtcblxuICAgIC8qIHJldHVybiBtaW5pbXVtIG9mIGRlbGV0ZSBjaGFyIGZyb20gcywgZGVsZXRlIGNoYXIgZnJvbSB0LCBhbmQgZGVsZXRlIGNoYXIgZnJvbSBib3RoICovXG4gICAgcmV0dXJuIE1hdGgubWluKFxuICAgICAgICBsZXZlbnNodGVpbihhLnNsaWNlKDAsIC0xKSwgYikgKyAxLFxuICAgICAgICBsZXZlbnNodGVpbihhLCBiLnNsaWNlKDAsIC0xKSkgKyAxLFxuICAgICAgICBsZXZlbnNodGVpbihhLnNsaWNlKDAsIC0xKSwgYi5zbGljZSgwLCAtMSkpICsgY29zdCxcbiAgICApO1xufVxuXG4vKipcbiAqIFJ1biBhIGNvbW1hbmQuXG4gKiBAcGFyYW0gY29tbWFuZE1hcCBNYXAgb2YgYXZhaWxhYmxlIGNvbW1hbmRzLlxuICogZS5neyBhZGQ6IFtGdW5jdGlvbjogQWRkQ29tbWFuZF0sXG4gIG5ldzogeyBbRnVuY3Rpb246IE5ld0NvbW1hbmRdIGFsaWFzZXM6IFsgJ24nIF0gfSxcbiAgZ2VuZXJhdGU6IHsgW0Z1bmN0aW9uOiBHZW5lcmF0ZUNvbW1hbmRdIGFsaWFzZXM6IFsgJ2cnIF0gfSxcbiAgdXBkYXRlOiB7IFtGdW5jdGlvbjogVXBkYXRlQ29tbWFuZF0gYWxpYXNlczogW10gfSxcbiAgYnVpbGQ6IHsgW0Z1bmN0aW9uOiBCdWlsZENvbW1hbmRdIGFsaWFzZXM6IFsgJ2InIF0gfSxcbiAgc2VydmU6IHsgW0Z1bmN0aW9uOiBTZXJ2ZUNvbW1hbmRdIGFsaWFzZXM6IFsgJ3MnIF0gfSxcbiAgdGVzdDogeyBbRnVuY3Rpb246IFRlc3RDb21tYW5kXSBhbGlhc2VzOiBbICd0JyBdIH0sXG4gIGUyZTogeyBbRnVuY3Rpb246IEUyZUNvbW1hbmRdIGFsaWFzZXM6IFsgJ2UnIF0gfSxcbiAgbGludDogeyBbRnVuY3Rpb246IExpbnRDb21tYW5kXSBhbGlhc2VzOiBbICdsJyBdIH0sXG4gIHhpMThuOiBbRnVuY3Rpb246IFhpMThuQ29tbWFuZF0sXG4gIHJ1bjogW0Z1bmN0aW9uOiBSdW5Db21tYW5kXSxcbiAgZWplY3Q6IFtGdW5jdGlvbjogRWplY3RDb21tYW5kXSxcbiAgJ21ha2UtdGhpcy1hd2Vzb21lJzogW0Z1bmN0aW9uOiBBd2Vzb21lQ29tbWFuZF0sXG4gIGNvbmZpZzogW0Z1bmN0aW9uOiBDb25maWdDb21tYW5kXSxcbiAgaGVscDogW0Z1bmN0aW9uOiBIZWxwQ29tbWFuZF0sXG4gIHZlcnNpb246IHsgW0Z1bmN0aW9uOiBWZXJzaW9uQ29tbWFuZF0gYWxpYXNlczogWyAndicgXSB9LFxuICBkb2M6IHsgW0Z1bmN0aW9uOiBEb2NDb21tYW5kXSBhbGlhc2VzOiBbICdkJyBdIH0sXG4gIGdldDogW0Z1bmN0aW9uOiBHZXRTZXRDb21tYW5kXSxcbiAgc2V0OiBbRnVuY3Rpb246IEdldFNldENvbW1hbmRdIH1cbiAqIEBwYXJhbSBhcmdzIFJhdyB1bnBhcnNlZCBhcmd1bWVudHMuIOacquWKoOW3peeahOWPguaVsCAvLyDmiYDmnInlj4LmlbDmlbDnu4QgZWcuIFsgJ2cnLCAncGlwZScsICdib2JvJywgJy0tc2tpcC1pbXBvcnQnIF1cbiAqIEBwYXJhbSBsb2dnZXIgVGhlIGxvZ2dlciB0byB1c2UuXG4gKiBAcGFyYW0gY29udGV4dCBFeGVjdXRpb24gY29udGV4dC4g5omn6KGM546v5aKD77yaXG4gKiBlZy57IHByb2plY3Q6XG4gICB7IHJvb3Q6ICcvVXNlcnMvYm9iby9Xb3JrL3Rlc3QvbXkxJywgLy/lt6XnqIvnm67lvZVcbiAgICAgY29uZmlnRmlsZTogJ2FuZ3VsYXIuanNvbicg6YWN572u5paH5Lu2XG4gICAgfVxuICAgICB9XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5Db21tYW5kKGNvbW1hbmRNYXA6IENvbW1hbmRNYXAsXG4gICAgYXJnczogc3RyaW5nW10sXG4gICAgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlcixcbiAgICBjb250ZXh0OiBDb21tYW5kQ29udGV4dCk6IFByb21pc2U8bnVtYmVyIHwgdm9pZD4ge1xuXG4gICAgLy8gaWYgbm90IGFyZ3Mgc3VwcGxpZWQsIGp1c3QgcnVuIHRoZSBoZWxwIGNvbW1hbmQuXG4gICAgaWYgKCFhcmdzIHx8IGFyZ3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGFyZ3MgPSBbJ2hlbHAnXTtcbiAgICB9XG4gICAgLyogICBjb25zb2xlLmxvZygnLS1ydW4gY29tbWFuZHMtLScpXG4gICAgICBjb25zb2xlLmxvZygnLS1jb21tYW5kTWFwLS0nLCBjb21tYW5kTWFwKVxuICAgICAgY29uc29sZS5sb2coJy0tYXJncy0tJywgYXJncylcbiAgICAgIGNvbnNvbGUubG9nKCctLWxvZ2dlci0tJywgbG9nZ2VyKVxuICAgICAgY29uc29sZS5sb2coJy0tY29udGV4dC0tJywgY29udGV4dCkgKi9cblxuICAgIC8vIOiOt+WPluacquWkhOeQhueahG9wdGlvbnMgPT0+IOaKimFyZ3PlpITnkIbmiJAg5a+56LGhXG4gICAgLyplZyB7XG4gICAgICBfOiBbJ2cnLCAncGlwZScsICdib2JvJ10sXG4gICAgICBoZWxwOiBmYWxzZSxcbiAgICAgIGg6IGZhbHNlLFxuICAgICAgJ3NraXAtaW1wb3J0JzogdHJ1ZSxcbiAgICAgIHNraXBJbXBvcnQ6IHRydWVcbiAgICB9ICovXG4gICAgY29uc3QgcmF3T3B0aW9ucyA9IHlhcmdzUGFyc2VyKGFyZ3MsIHsgYWxpYXM6IHsgaGVscDogWydoJ10gfSwgYm9vbGVhbjogWydoZWxwJ10gfSk7XG4gICAgY29uc29sZS5sb2coJy0tcmF3T3B0aW9ucy0tJywgcmF3T3B0aW9ucylcbiAgICAvLyDojrflj5Yg5ZG95Luk5ZCN56ewIOaIliDlkb3ku6TlkI3np7DnroDlhpkgZWcgOiAnZydcbiAgICBsZXQgY29tbWFuZE5hbWUgPSByYXdPcHRpb25zLl9bMF07XG5cbiAgICAvLyByZW1vdmUgdGhlIGNvbW1hbmQgbmFtZSDnp7vpmaTlt7Lnu4/ojrflj5bnmoTlkb3ku6TlkI3np7BcbiAgICByYXdPcHRpb25zLl8gPSByYXdPcHRpb25zLl8uc2xpY2UoMSk7IC8qIF86IFsgJ3BpcGUnLCAnYm9ibyddLCAqL1xuICAgIC8vIOWIpOaWreaJp+ihjOS9nOeUqOWfn++8jGVnOiAxIC0tPiDku6PooahpbiBwcm9qZWN0XG4gICAgY29uc3QgZXhlY3V0aW9uU2NvcGUgPSBpbnNpZGVQcm9qZWN0KClcbiAgICAgICAgPyBDb21tYW5kU2NvcGUuaW5Qcm9qZWN0XG4gICAgICAgIDogQ29tbWFuZFNjb3BlLm91dHNpZGVQcm9qZWN0O1xuICAgIGNvbnNvbGUubG9nKCctLWV4ZWN1dGlvblNjb3BlLS0nLCBleGVjdXRpb25TY29wZSk7XG4gICAgLy8g5om+5Yiw5omn6KGM5ZG95Luk5a6e546w57G7IENtZCBlZzpbRnVuY3Rpb246IEdlbmVyYXRlQ29tbWFuZF1cbiAgICBsZXQgQ21kOiBDb21tYW5kQ29uc3RydWN0b3IgfCBudWxsO1xuICAgIENtZCA9IGZpbmRDb21tYW5kKGNvbW1hbmRNYXAsIGNvbW1hbmROYW1lKTtcbiAgICAvKiAgY29uc29sZS5sb2coJy0tY21kLS0nLCBDbWQpOyAqL1xuICAgIC8vIOWmguaenOWRveS7pOWunueOsOexu+S4juWRveS7pOWQjeensOWdh+S4jeWtmOWcqO+8jOS9hiBvcHRpb25z5Lit5YyF5ZCrdiDmiJYgdmVyc2lvbi7liJnlsIZDbWTnva7kuLog6I635Y+W54mI5pys5Y+355qE5a6e546w57G7XG4gICAgaWYgKCFDbWQgJiYgIWNvbW1hbmROYW1lICYmIChyYXdPcHRpb25zLnYgfHwgcmF3T3B0aW9ucy52ZXJzaW9uKSkge1xuICAgICAgICBjb21tYW5kTmFtZSA9ICd2ZXJzaW9uJztcbiAgICAgICAgQ21kID0gZmluZENvbW1hbmQoY29tbWFuZE1hcCwgY29tbWFuZE5hbWUpO1xuICAgIH1cblxuICAgIC8vIOaXouS4jea7oei2s+S7peS4iuadoeS7tu+8jOS9huWtmOWcqGhlbHDlj4LmlbDpgInpobnvvIzliJnlsIYgQ21k572u5Li6IOiOt+WPluW4ruWKqeeahOWunueOsOexu1xuICAgIGlmICghQ21kICYmIHJhd09wdGlvbnMuaGVscCkge1xuICAgICAgICBjb21tYW5kTmFtZSA9ICdoZWxwJztcbiAgICAgICAgQ21kID0gZmluZENvbW1hbmQoY29tbWFuZE1hcCwgY29tbWFuZE5hbWUpO1xuICAgIH1cblxuICAgIC8vIOS7peS4iuadoeS7tuWdh+S4jea7oei2s++8jOWImeaKpemUme+8jOWImeaPkOekuuS4jueUqOaIt+i+k+WFpeeahOWtl+espuacgOebuOi/keeahOmCo+S4quWRveS7pFxuICAgIGlmICghQ21kKSB7XG4gICAgICAgIC8vIOWwhuaJgOacieWRveS7pOS+neaNrueUqOaIt+i+k+WFpeeahCBjb21tYW5kTmFtZSDov5vooYzmjpLluo8g77yM5pyA5o6l6L+R55qE5o6S5YmN6Z2iXG4gICAgICAgIGNvbnN0IGNvbW1hbmRzRGlzdGFuY2UgPSB7fSBhcyB7IFtuYW1lOiBzdHJpbmddOiBudW1iZXIgfTtcbiAgICAgICAgY29uc3QgYWxsQ29tbWFuZHMgPSBsaXN0QWxsQ29tbWFuZE5hbWVzKGNvbW1hbmRNYXApLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgIGlmICghKGEgaW4gY29tbWFuZHNEaXN0YW5jZSkpIHtcbiAgICAgICAgICAgICAgICBjb21tYW5kc0Rpc3RhbmNlW2FdID0gbGV2ZW5zaHRlaW4oYSwgY29tbWFuZE5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCEoYiBpbiBjb21tYW5kc0Rpc3RhbmNlKSkge1xuICAgICAgICAgICAgICAgIGNvbW1hbmRzRGlzdGFuY2VbYl0gPSBsZXZlbnNodGVpbihiLCBjb21tYW5kTmFtZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjb21tYW5kc0Rpc3RhbmNlW2FdIC0gY29tbWFuZHNEaXN0YW5jZVtiXTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5omT5Y2w6ZSZ6K+v5L+h5oGv77yM5bm25o+Q56S65pyA5o6l6L+R55qE5q2j56GuY29tbWFuZHNcbiAgICAgICAgbG9nZ2VyLmVycm9yKHRhZ3Muc3RyaXBJbmRlbnRgXG4gICAgICAgIFRoZSBzcGVjaWZpZWQgY29tbWFuZCAoXCIke2NvbW1hbmROYW1lfVwiKSBpcyBpbnZhbGlkLiBGb3IgYSBsaXN0IG9mIGF2YWlsYWJsZSBvcHRpb25zLFxuICAgICAgICBydW4gXCJzZ3ggZyBoZWxwXCIuXG5cbiAgICAgICAgRGlkIHlvdSBtZWFuIFwiJHthbGxDb21tYW5kc1swXX1cIj9cbiAgICBgKTtcblxuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG5cbiAgICAvKiDkvKDlhaXlrp7kvovljJbmiafooYznsbssXG4gICAg5Y+C5pWw77yaXG4gICAgICAx44CBY29udGV4dOWvueixoSA6XG4gICAgICB7IHByb2plY3Q6XG4gICAgICAgIHsgcm9vdDogJy9Vc2Vycy9ib2JvL1dvcmsvdGVzdC9teTEnLCAvL+W3peeoi+ebruW9lVxuICAgICAgICAgIGNvbmZpZ0ZpbGU6ICdhbmd1bGFyLmpzb24nIOmFjee9ruaWh+S7tlxuICAgICAgICB9XG4gICAgICAgfVxuICAgICAgMuOAgeaXpeW/l+WunuS+i++8mlxuICAgICAgICBsb2dnZXJcbiAgICAqL1xuICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgQ21kKGNvbnRleHQsIGxvZ2dlcik7XG5cbiAgICBhcmdzID0gYXdhaXQgY29tbWFuZC5pbml0aWFsaXplUmF3KGFyZ3MpO1xuICAgIGxldCBvcHRpb25zID0gcGFyc2VPcHRpb25zKGFyZ3MsIGNvbW1hbmQub3B0aW9ucywgY29tbWFuZC5hcmd1bWVudHMsIGNvbW1hbmQuYXJnU3RyYXRlZ3kpO1xuICAgIGF3YWl0IGNvbW1hbmQuaW5pdGlhbGl6ZShvcHRpb25zKTtcbiAgICBvcHRpb25zID0gcGFyc2VPcHRpb25zKGFyZ3MsIGNvbW1hbmQub3B0aW9ucywgY29tbWFuZC5hcmd1bWVudHMsIGNvbW1hbmQuYXJnU3RyYXRlZ3kpO1xuICAgIGlmIChjb21tYW5kTmFtZSA9PT0gJ2hlbHAnKSB7XG4gICAgICAgIG9wdGlvbnMuY29tbWFuZE1hcCA9IGNvbW1hbmRNYXA7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuaGVscCkge1xuICAgICAgICBjb21tYW5kLnByaW50SGVscChvcHRpb25zKTtcblxuICAgICAgICByZXR1cm47XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGNvbW1hbmQuc2NvcGUgIT09IHVuZGVmaW5lZCAmJiBjb21tYW5kLnNjb3BlICE9PSBDb21tYW5kU2NvcGUuZXZlcnl3aGVyZSkge1xuICAgICAgICAgICAgaWYgKGNvbW1hbmQuc2NvcGUgIT09IGV4ZWN1dGlvblNjb3BlKSB7XG4gICAgICAgICAgICAgICAgbGV0IGVycm9yTWVzc2FnZTtcbiAgICAgICAgICAgICAgICBpZiAoY29tbWFuZC5zY29wZSA9PT0gQ29tbWFuZFNjb3BlLmluUHJvamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBlcnJvck1lc3NhZ2UgPSBgVGhpcyBjb21tYW5kIGNhbiBvbmx5IGJlIHJ1biBpbnNpZGUgb2YgYSBDTEkgcHJvamVjdC5gO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZSA9IGBUaGlzIGNvbW1hbmQgY2FuIG5vdCBiZSBydW4gaW5zaWRlIG9mIGEgQ0xJIHByb2plY3QuYDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmZhdGFsKGVycm9yTWVzc2FnZSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGNvbW1hbmQuc2NvcGUgPT09IENvbW1hbmRTY29wZS5pblByb2plY3QpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWNvbnRleHQucHJvamVjdC5jb25maWdGaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlci5mYXRhbCgnSW52YWxpZCBwcm9qZWN0OiBtaXNzaW5nIHdvcmtzcGFjZSBmaWxlLicpO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGRlbGV0ZSBvcHRpb25zLmg7XG4gICAgICAgIGRlbGV0ZSBvcHRpb25zLmhlbHA7XG5cbiAgICAgICAgLy8g5qCh6aqM5Ye66ZmkaCAsIGhlbHDkuYvlkI7nmoQg5Y+C5pWw5a+56LGh5ZCI5rOV5oCnXG4gICAgICAgIGNvbnN0IGlzVmFsaWQgPSBhd2FpdCBjb21tYW5kLnZhbGlkYXRlKG9wdGlvbnMpO1xuICAgICAgICBpZiAoIWlzVmFsaWQpIHtcbiAgICAgICAgICAgIGxvZ2dlci5mYXRhbChgVmFsaWRhdGlvbiBlcnJvci4gSW52YWxpZCBjb21tYW5kYCk7XG5cbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5Y+C5pWw5a+56LGh5ZCI5rOVIOWImSDmiafooYzlkb3ku6RcbiAgICAgICAgLy8gb3B0aW9uczpcbiAgICAgICAgLyogICAge1xuICAgICAgICAgICAgIF86IFsncGlwZScsICdib2JvMSddLFxuICAgICAgICAgICAgIGRyeVJ1bjogZmFsc2UsXG4gICAgICAgICAgICAgZm9yY2U6IGZhbHNlLFxuICAgICAgICAgICAgIHNraXBJbXBvcnQ6IHRydWVcbiAgICAgICAgICAgfSAqL1xuICAgICAgICBjb25zb2xlLmxvZygnLeaJp+ihjOWRveS7pC0nLCBvcHRpb25zKVxuICAgICAgICByZXR1cm4gYXdhaXQgY29tbWFuZC5ydW4ob3B0aW9ucyk7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VPcHRpb25zPFQgPSBhbnk+KFxuICAgIGFyZ3M6IHN0cmluZ1tdLFxuICAgIGNtZE9wdHM6IE9wdGlvbltdLFxuICAgIGNvbW1hbmRBcmd1bWVudHM6IHN0cmluZ1tdLFxuICAgIGFyZ1N0cmF0ZWd5OiBBcmd1bWVudFN0cmF0ZWd5LFxuKTogVCB7XG4gICAgY29uc3QgcGFyc2VyID0geWFyZ3NQYXJzZXI7XG5cbiAgICBjb25zdCBhbGlhc2VzID0gY21kT3B0cy5jb25jYXQoKVxuICAgICAgICAuZmlsdGVyKG8gPT4gby5hbGlhc2VzICYmIG8uYWxpYXNlcy5sZW5ndGggPiAwKVxuICAgICAgICAucmVkdWNlKChhbGlhc2VzOiBhbnksIG9wdDogT3B0aW9uKSA9PiB7XG4gICAgICAgICAgICBhbGlhc2VzW29wdC5uYW1lXSA9IChvcHQuYWxpYXNlcyB8fCBbXSlcbiAgICAgICAgICAgICAgICAuZmlsdGVyKGEgPT4gYS5sZW5ndGggPT09IDEpO1xuXG4gICAgICAgICAgICByZXR1cm4gYWxpYXNlcztcbiAgICAgICAgfSwge30pO1xuXG4gICAgY29uc3QgYm9vbGVhbnMgPSBjbWRPcHRzXG4gICAgICAgIC5maWx0ZXIobyA9PiBvLnR5cGUgJiYgby50eXBlID09PSBCb29sZWFuKVxuICAgICAgICAubWFwKG8gPT4gby5uYW1lKTtcblxuICAgIGNvbnN0IGRlZmF1bHRzID0gY21kT3B0c1xuICAgICAgICAuZmlsdGVyKG8gPT4gby5kZWZhdWx0ICE9PSB1bmRlZmluZWQgfHwgYm9vbGVhbnMuaW5kZXhPZihvLm5hbWUpICE9PSAtMSlcbiAgICAgICAgLnJlZHVjZSgoZGVmYXVsdHM6IGFueSwgb3B0OiBPcHRpb24pID0+IHtcbiAgICAgICAgICAgIGRlZmF1bHRzW29wdC5uYW1lXSA9IG9wdC5kZWZhdWx0O1xuXG4gICAgICAgICAgICByZXR1cm4gZGVmYXVsdHM7XG4gICAgICAgIH0sIHt9KTtcblxuICAgIGNvbnN0IHN0cmluZ3MgPSBjbWRPcHRzXG4gICAgICAgIC5maWx0ZXIobyA9PiBvLnR5cGUgPT09IFN0cmluZylcbiAgICAgICAgLm1hcChvID0+IG8ubmFtZSk7XG5cbiAgICBjb25zdCBudW1iZXJzID0gY21kT3B0c1xuICAgICAgICAuZmlsdGVyKG8gPT4gby50eXBlID09PSBOdW1iZXIpXG4gICAgICAgIC5tYXAobyA9PiBvLm5hbWUpO1xuXG5cbiAgICBhbGlhc2VzLmhlbHAgPSBbJ2gnXTtcbiAgICBib29sZWFucy5wdXNoKCdoZWxwJyk7XG5cbiAgICBjb25zdCB5YXJnc09wdGlvbnMgPSB7XG4gICAgICAgIGFsaWFzOiBhbGlhc2VzLFxuICAgICAgICBib29sZWFuOiBib29sZWFucyxcbiAgICAgICAgZGVmYXVsdDogZGVmYXVsdHMsXG4gICAgICAgIHN0cmluZzogc3RyaW5ncyxcbiAgICAgICAgbnVtYmVyOiBudW1iZXJzLFxuICAgIH07XG5cbiAgICBjb25zdCBwYXJzZWRPcHRpb25zID0gcGFyc2VyKGFyZ3MsIHlhcmdzT3B0aW9ucyk7XG5cbiAgICAvLyBSZW1vdmUgYWxpYXNlcy5cbiAgICBjbWRPcHRzXG4gICAgICAgIC5maWx0ZXIobyA9PiBvLmFsaWFzZXMgJiYgby5hbGlhc2VzLmxlbmd0aCA+IDApXG4gICAgICAgIC5tYXAobyA9PiBvLmFsaWFzZXMpXG4gICAgICAgIC5yZWR1Y2UoKGFsbEFsaWFzZXM6IGFueSwgYWxpYXNlczogc3RyaW5nW10pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBhbGxBbGlhc2VzLmNvbmNhdChbLi4uYWxpYXNlc10pO1xuICAgICAgICB9LCBbXSlcbiAgICAgICAgLmZvckVhY2goKGFsaWFzOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGRlbGV0ZSBwYXJzZWRPcHRpb25zW2FsaWFzXTtcbiAgICAgICAgfSk7XG5cbiAgICAvLyBSZW1vdmUgdW5kZWZpbmVkIGJvb2xlYW5zXG4gICAgYm9vbGVhbnNcbiAgICAgICAgLmZpbHRlcihiID0+IHBhcnNlZE9wdGlvbnNbYl0gPT09IHVuZGVmaW5lZClcbiAgICAgICAgLm1hcChiID0+IGNvcmVTdHJpbmdzLmNhbWVsaXplKGIpKVxuICAgICAgICAuZm9yRWFjaChiID0+IGRlbGV0ZSBwYXJzZWRPcHRpb25zW2JdKTtcblxuICAgIC8vIHJlbW92ZSBvcHRpb25zIHdpdGggZGFzaGVzLlxuICAgIE9iamVjdC5rZXlzKHBhcnNlZE9wdGlvbnMpXG4gICAgICAgIC5maWx0ZXIoa2V5ID0+IGtleS5pbmRleE9mKCctJykgIT09IC0xKVxuICAgICAgICAuZm9yRWFjaChrZXkgPT4gZGVsZXRlIHBhcnNlZE9wdGlvbnNba2V5XSk7XG5cbiAgICAvLyByZW1vdmUgdGhlIGNvbW1hbmQgbmFtZVxuICAgIHBhcnNlZE9wdGlvbnMuXyA9IHBhcnNlZE9wdGlvbnMuXy5zbGljZSgxKTtcblxuICAgIHN3aXRjaCAoYXJnU3RyYXRlZ3kpIHtcbiAgICAgICAgY2FzZSBBcmd1bWVudFN0cmF0ZWd5Lk1hcFRvT3B0aW9uczpcbiAgICAgICAgICAgIHBhcnNlZE9wdGlvbnMuXy5mb3JFYWNoKCh2YWx1ZTogc3RyaW5nLCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXJnID0gY29tbWFuZEFyZ3VtZW50c1tpbmRleF07XG4gICAgICAgICAgICAgICAgaWYgKGFyZykge1xuICAgICAgICAgICAgICAgICAgICBwYXJzZWRPcHRpb25zW2FyZ10gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZGVsZXRlIHBhcnNlZE9wdGlvbnMuXztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHJldHVybiBwYXJzZWRPcHRpb25zIGFzIGFueTtcbn1cblxuLy8gRmluZCBhIGNvbW1hbmQuXG5mdW5jdGlvbiBmaW5kQ29tbWFuZChtYXA6IENvbW1hbmRNYXAsIG5hbWU6IHN0cmluZyk6IENvbW1hbmRDb25zdHJ1Y3RvciB8IG51bGwge1xuICAgIGxldCBDbWQ6IENvbW1hbmRDb25zdHJ1Y3RvciA9IG1hcFtuYW1lXTtcblxuICAgIGlmICghQ21kKSB7XG4gICAgICAgIC8vIGZpbmQgY29tbWFuZCB2aWEgYWxpYXNlc1xuICAgICAgICBDbWQgPSBPYmplY3Qua2V5cyhtYXApXG4gICAgICAgICAgICAuZmlsdGVyKGtleSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFtYXBba2V5XS5hbGlhc2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgZm91bmRBbGlhcyA9IG1hcFtrZXldLmFsaWFzZXNcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcigoYWxpYXM6IHN0cmluZykgPT4gYWxpYXMgPT09IG5hbWUpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kQWxpYXMubGVuZ3RoID4gMDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAubWFwKChrZXkpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWFwW2tleV07XG4gICAgICAgICAgICB9KVswXTtcbiAgICB9XG5cbiAgICBpZiAoIUNtZCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gQ21kO1xufVxuXG5mdW5jdGlvbiBsaXN0QWxsQ29tbWFuZE5hbWVzKG1hcDogQ29tbWFuZE1hcCk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMobWFwKS5jb25jYXQoXG4gICAgICAgIE9iamVjdC5rZXlzKG1hcClcbiAgICAgICAgICAgIC5yZWR1Y2UoKGFjYywga2V5KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFtYXBba2V5XS5hbGlhc2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjYy5jb25jYXQobWFwW2tleV0uYWxpYXNlcyk7XG4gICAgICAgICAgICB9LCBbXSBhcyBzdHJpbmdbXSksXG4gICAgKTtcbn1cbiJdfQ==