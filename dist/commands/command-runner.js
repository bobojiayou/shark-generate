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
        const rawOptions = yargsParser(args, { alias: { help: ['h'] }, boolean: ['help'] });
        // 获取 命令名称 或 命令名称简写 eg : 'g'
        let commandName = rawOptions._[0];
        // remove the command name 移除已经获取的命令名称
        rawOptions._ = rawOptions._.slice(1); /* _: [ 'pipe', 'bobo'], */
        // 判断执行作用域，eg: 1 --> 代表in project
        const executionScope = project_1.insideProject()
            ? command_1.CommandScope.inProject
            : command_1.CommandScope.outsideProject;
        // 找到执行命令实现类 Cmd eg:[Function: GenerateCommand]
        let Cmd;
        Cmd = findCommand(commandMap, commandName);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZC1ydW5uZXIuanMiLCJzb3VyY2VSb290IjoiL1VzZXJzL2JvYm8vV29yay9zaGFyay1nZW5lcmF0ZS8iLCJzb3VyY2VzIjpbImNvbW1hbmRzL2NvbW1hbmQtcnVubmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSw2REFBNkQ7QUFDN0QsK0NBQTZFO0FBQzdFLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUM1Qyx1Q0FNbUI7QUFDbkIsNkNBQWdEO0FBT2hELCtEQUErRDtBQUMvRCwyQkFBMkI7QUFDM0IscUJBQXFCLENBQVMsRUFBRSxDQUFTO0lBQ3JDLDhCQUE4QjtJQUM5QixJQUFJLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO1FBQ2YsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDO0tBQ25CO0lBQ0QsSUFBSSxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtRQUNmLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQztLQUNuQjtJQUVELGdEQUFnRDtJQUNoRCxNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFeEQseUZBQXlGO0lBQ3pGLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FDWCxXQUFXLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQ2xDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFDbEMsV0FBVyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENB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QUFVLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU87aUJBQzlCLE1BQU0sQ0FBQyxDQUFDLEtBQWEsRUFBRSxFQUFFLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxDQUFDO1lBRS9DLE9BQU8sVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDakMsQ0FBQyxDQUFDO2FBQ0QsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDVCxPQUFPLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNwQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNiO0lBRUQsSUFBSSxDQUFDLEdBQUcsRUFBRTtRQUNOLE9BQU8sSUFBSSxDQUFDO0tBQ2Y7SUFFRCxPQUFPLEdBQUcsQ0FBQztBQUNmLENBQUM7QUFFRCw2QkFBNkIsR0FBZTtJQUN4QyxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUMxQixNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztTQUNYLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRTtRQUNqQixJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRTtZQUNuQixPQUFPLEdBQUcsQ0FBQztTQUNkO1FBRUQsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN4QyxDQUFDLEVBQUUsRUFBYyxDQUFDLENBQ3pCLENBQUM7QUFDTixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gdHNsaW50OmRpc2FibGU6bm8tZ2xvYmFsLXRzbGludC1kaXNhYmxlIG5vLWFueSBmaWxlLWhlYWRlclxuaW1wb3J0IHsgbG9nZ2luZywgc3RyaW5ncyBhcyBjb3JlU3RyaW5ncywgdGFncyB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmNvbnN0IHlhcmdzUGFyc2VyID0gcmVxdWlyZSgneWFyZ3MtcGFyc2VyJyk7XG5pbXBvcnQge1xuICAgIEFyZ3VtZW50U3RyYXRlZ3ksXG4gICAgQ29tbWFuZENvbnN0cnVjdG9yLFxuICAgIENvbW1hbmRDb250ZXh0LFxuICAgIENvbW1hbmRTY29wZSxcbiAgICBPcHRpb24sXG59IGZyb20gJy4vY29tbWFuZCc7XG5pbXBvcnQgeyBpbnNpZGVQcm9qZWN0IH0gZnJvbSAnLi4vdXRpbC9wcm9qZWN0JztcblxuXG5leHBvcnQgaW50ZXJmYWNlIENvbW1hbmRNYXAge1xuICAgIFtrZXk6IHN0cmluZ106IENvbW1hbmRDb25zdHJ1Y3Rvcjtcbn1cblxuLy8gQmFzZWQgb2ZmIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0xldmVuc2h0ZWluX2Rpc3RhbmNlXG4vLyBObyBvcHRpbWl6YXRpb24sIHJlYWxseS5cbmZ1bmN0aW9uIGxldmVuc2h0ZWluKGE6IHN0cmluZywgYjogc3RyaW5nKTogbnVtYmVyIHtcbiAgICAvKiBiYXNlIGNhc2U6IGVtcHR5IHN0cmluZ3MgKi9cbiAgICBpZiAoYS5sZW5ndGggPT0gMCkge1xuICAgICAgICByZXR1cm4gYi5sZW5ndGg7XG4gICAgfVxuICAgIGlmIChiLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIHJldHVybiBhLmxlbmd0aDtcbiAgICB9XG5cbiAgICAvLyBUZXN0IGlmIGxhc3QgY2hhcmFjdGVycyBvZiB0aGUgc3RyaW5ncyBtYXRjaC5cbiAgICBjb25zdCBjb3N0ID0gYVthLmxlbmd0aCAtIDFdID09IGJbYi5sZW5ndGggLSAxXSA/IDAgOiAxO1xuXG4gICAgLyogcmV0dXJuIG1pbmltdW0gb2YgZGVsZXRlIGNoYXIgZnJvbSBzLCBkZWxldGUgY2hhciBmcm9tIHQsIGFuZCBkZWxldGUgY2hhciBmcm9tIGJvdGggKi9cbiAgICByZXR1cm4gTWF0aC5taW4oXG4gICAgICAgIGxldmVuc2h0ZWluKGEuc2xpY2UoMCwgLTEpLCBiKSArIDEsXG4gICAgICAgIGxldmVuc2h0ZWluKGEsIGIuc2xpY2UoMCwgLTEpKSArIDEsXG4gICAgICAgIGxldmVuc2h0ZWluKGEuc2xpY2UoMCwgLTEpLCBiLnNsaWNlKDAsIC0xKSkgKyBjb3N0LFxuICAgICk7XG59XG5cbi8qKlxuICogUnVuIGEgY29tbWFuZC5cbiAqIEBwYXJhbSBjb21tYW5kTWFwIE1hcCBvZiBhdmFpbGFibGUgY29tbWFuZHMuXG4gKiBlLmd7IGFkZDogW0Z1bmN0aW9uOiBBZGRDb21tYW5kXSxcbiAgbmV3OiB7IFtGdW5jdGlvbjogTmV3Q29tbWFuZF0gYWxpYXNlczogWyAnbicgXSB9LFxuICBnZW5lcmF0ZTogeyBbRnVuY3Rpb246IEdlbmVyYXRlQ29tbWFuZF0gYWxpYXNlczogWyAnZycgXSB9LFxuICB1cGRhdGU6IHsgW0Z1bmN0aW9uOiBVcGRhdGVDb21tYW5kXSBhbGlhc2VzOiBbXSB9LFxuICBidWlsZDogeyBbRnVuY3Rpb246IEJ1aWxkQ29tbWFuZF0gYWxpYXNlczogWyAnYicgXSB9LFxuICBzZXJ2ZTogeyBbRnVuY3Rpb246IFNlcnZlQ29tbWFuZF0gYWxpYXNlczogWyAncycgXSB9LFxuICB0ZXN0OiB7IFtGdW5jdGlvbjogVGVzdENvbW1hbmRdIGFsaWFzZXM6IFsgJ3QnIF0gfSxcbiAgZTJlOiB7IFtGdW5jdGlvbjogRTJlQ29tbWFuZF0gYWxpYXNlczogWyAnZScgXSB9LFxuICBsaW50OiB7IFtGdW5jdGlvbjogTGludENvbW1hbmRdIGFsaWFzZXM6IFsgJ2wnIF0gfSxcbiAgeGkxOG46IFtGdW5jdGlvbjogWGkxOG5Db21tYW5kXSxcbiAgcnVuOiBbRnVuY3Rpb246IFJ1bkNvbW1hbmRdLFxuICBlamVjdDogW0Z1bmN0aW9uOiBFamVjdENvbW1hbmRdLFxuICAnbWFrZS10aGlzLWF3ZXNvbWUnOiBbRnVuY3Rpb246IEF3ZXNvbWVDb21tYW5kXSxcbiAgY29uZmlnOiBbRnVuY3Rpb246IENvbmZpZ0NvbW1hbmRdLFxuICBoZWxwOiBbRnVuY3Rpb246IEhlbHBDb21tYW5kXSxcbiAgdmVyc2lvbjogeyBbRnVuY3Rpb246IFZlcnNpb25Db21tYW5kXSBhbGlhc2VzOiBbICd2JyBdIH0sXG4gIGRvYzogeyBbRnVuY3Rpb246IERvY0NvbW1hbmRdIGFsaWFzZXM6IFsgJ2QnIF0gfSxcbiAgZ2V0OiBbRnVuY3Rpb246IEdldFNldENvbW1hbmRdLFxuICBzZXQ6IFtGdW5jdGlvbjogR2V0U2V0Q29tbWFuZF0gfVxuICogQHBhcmFtIGFyZ3MgUmF3IHVucGFyc2VkIGFyZ3VtZW50cy4g5pyq5Yqg5bel55qE5Y+C5pWwIC8vIOaJgOacieWPguaVsOaVsOe7hCBlZy4gWyAnZycsICdwaXBlJywgJ2JvYm8nLCAnLS1za2lwLWltcG9ydCcgXVxuICogQHBhcmFtIGxvZ2dlciBUaGUgbG9nZ2VyIHRvIHVzZS5cbiAqIEBwYXJhbSBjb250ZXh0IEV4ZWN1dGlvbiBjb250ZXh0LiDmiafooYznjq/looPvvJpcbiAqIGVnLnsgcHJvamVjdDpcbiAgIHsgcm9vdDogJy9Vc2Vycy9ib2JvL1dvcmsvdGVzdC9teTEnLCAvL+W3peeoi+ebruW9lVxuICAgICBjb25maWdGaWxlOiAnYW5ndWxhci5qc29uJyDphY3nva7mlofku7ZcbiAgICB9XG4gICAgIH1cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1bkNvbW1hbmQoY29tbWFuZE1hcDogQ29tbWFuZE1hcCxcbiAgICBhcmdzOiBzdHJpbmdbXSxcbiAgICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyLFxuICAgIGNvbnRleHQ6IENvbW1hbmRDb250ZXh0KTogUHJvbWlzZTxudW1iZXIgfCB2b2lkPiB7XG5cbiAgICAvLyBpZiBub3QgYXJncyBzdXBwbGllZCwganVzdCBydW4gdGhlIGhlbHAgY29tbWFuZC5cbiAgICBpZiAoIWFyZ3MgfHwgYXJncy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgYXJncyA9IFsnaGVscCddO1xuICAgIH1cbiAgICBjb25zdCByYXdPcHRpb25zID0geWFyZ3NQYXJzZXIoYXJncywgeyBhbGlhczogeyBoZWxwOiBbJ2gnXSB9LCBib29sZWFuOiBbJ2hlbHAnXSB9KTtcbiAgICAvLyDojrflj5Yg5ZG95Luk5ZCN56ewIOaIliDlkb3ku6TlkI3np7DnroDlhpkgZWcgOiAnZydcbiAgICBsZXQgY29tbWFuZE5hbWUgPSByYXdPcHRpb25zLl9bMF07XG5cbiAgICAvLyByZW1vdmUgdGhlIGNvbW1hbmQgbmFtZSDnp7vpmaTlt7Lnu4/ojrflj5bnmoTlkb3ku6TlkI3np7BcbiAgICByYXdPcHRpb25zLl8gPSByYXdPcHRpb25zLl8uc2xpY2UoMSk7IC8qIF86IFsgJ3BpcGUnLCAnYm9ibyddLCAqL1xuICAgIC8vIOWIpOaWreaJp+ihjOS9nOeUqOWfn++8jGVnOiAxIC0tPiDku6PooahpbiBwcm9qZWN0XG4gICAgY29uc3QgZXhlY3V0aW9uU2NvcGUgPSBpbnNpZGVQcm9qZWN0KClcbiAgICAgICAgPyBDb21tYW5kU2NvcGUuaW5Qcm9qZWN0XG4gICAgICAgIDogQ29tbWFuZFNjb3BlLm91dHNpZGVQcm9qZWN0O1xuICAgIC8vIOaJvuWIsOaJp+ihjOWRveS7pOWunueOsOexuyBDbWQgZWc6W0Z1bmN0aW9uOiBHZW5lcmF0ZUNvbW1hbmRdXG4gICAgbGV0IENtZDogQ29tbWFuZENvbnN0cnVjdG9yIHwgbnVsbDtcbiAgICBDbWQgPSBmaW5kQ29tbWFuZChjb21tYW5kTWFwLCBjb21tYW5kTmFtZSk7XG4gICAgLy8g5aaC5p6c5ZG95Luk5a6e546w57G75LiO5ZG95Luk5ZCN56ew5Z2H5LiN5a2Y5Zyo77yM5L2GIG9wdGlvbnPkuK3ljIXlkKt2IOaIliB2ZXJzaW9uLuWImeWwhkNtZOe9ruS4uiDojrflj5bniYjmnKzlj7fnmoTlrp7njrDnsbtcbiAgICBpZiAoIUNtZCAmJiAhY29tbWFuZE5hbWUgJiYgKHJhd09wdGlvbnMudiB8fCByYXdPcHRpb25zLnZlcnNpb24pKSB7XG4gICAgICAgIGNvbW1hbmROYW1lID0gJ3ZlcnNpb24nO1xuICAgICAgICBDbWQgPSBmaW5kQ29tbWFuZChjb21tYW5kTWFwLCBjb21tYW5kTmFtZSk7XG4gICAgfVxuXG4gICAgLy8g5pei5LiN5ruh6Laz5Lul5LiK5p2h5Lu277yM5L2G5a2Y5ZyoaGVscOWPguaVsOmAiemhue+8jOWImeWwhiBDbWTnva7kuLog6I635Y+W5biu5Yqp55qE5a6e546w57G7XG4gICAgaWYgKCFDbWQgJiYgcmF3T3B0aW9ucy5oZWxwKSB7XG4gICAgICAgIGNvbW1hbmROYW1lID0gJ2hlbHAnO1xuICAgICAgICBDbWQgPSBmaW5kQ29tbWFuZChjb21tYW5kTWFwLCBjb21tYW5kTmFtZSk7XG4gICAgfVxuXG4gICAgLy8g5Lul5LiK5p2h5Lu25Z2H5LiN5ruh6Laz77yM5YiZ5oql6ZSZ77yM5YiZ5o+Q56S65LiO55So5oi36L6T5YWl55qE5a2X56ym5pyA55u46L+R55qE6YKj5Liq5ZG95LukXG4gICAgaWYgKCFDbWQpIHtcbiAgICAgICAgLy8g5bCG5omA5pyJ5ZG95Luk5L6d5o2u55So5oi36L6T5YWl55qEIGNvbW1hbmROYW1lIOi/m+ihjOaOkuW6jyDvvIzmnIDmjqXov5HnmoTmjpLliY3pnaJcbiAgICAgICAgY29uc3QgY29tbWFuZHNEaXN0YW5jZSA9IHt9IGFzIHsgW25hbWU6IHN0cmluZ106IG51bWJlciB9O1xuICAgICAgICBjb25zdCBhbGxDb21tYW5kcyA9IGxpc3RBbGxDb21tYW5kTmFtZXMoY29tbWFuZE1hcCkuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgaWYgKCEoYSBpbiBjb21tYW5kc0Rpc3RhbmNlKSkge1xuICAgICAgICAgICAgICAgIGNvbW1hbmRzRGlzdGFuY2VbYV0gPSBsZXZlbnNodGVpbihhLCBjb21tYW5kTmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIShiIGluIGNvbW1hbmRzRGlzdGFuY2UpKSB7XG4gICAgICAgICAgICAgICAgY29tbWFuZHNEaXN0YW5jZVtiXSA9IGxldmVuc2h0ZWluKGIsIGNvbW1hbmROYW1lKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGNvbW1hbmRzRGlzdGFuY2VbYV0gLSBjb21tYW5kc0Rpc3RhbmNlW2JdO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyDmiZPljbDplJnor6/kv6Hmga/vvIzlubbmj5DnpLrmnIDmjqXov5HnmoTmraPnoa5jb21tYW5kc1xuICAgICAgICBsb2dnZXIuZXJyb3IodGFncy5zdHJpcEluZGVudGBcbiAgICAgICAgVGhlIHNwZWNpZmllZCBjb21tYW5kIChcIiR7Y29tbWFuZE5hbWV9XCIpIGlzIGludmFsaWQuIEZvciBhIGxpc3Qgb2YgYXZhaWxhYmxlIG9wdGlvbnMsXG4gICAgICAgIHJ1biBcInNneCBnIGhlbHBcIi5cblxuICAgICAgICBEaWQgeW91IG1lYW4gXCIke2FsbENvbW1hbmRzWzBdfVwiP1xuICAgIGApO1xuXG4gICAgICAgIHJldHVybiAxO1xuICAgIH1cblxuICAgIC8qIOS8oOWFpeWunuS+i+WMluaJp+ihjOexuyxcbiAgICDlj4LmlbDvvJpcbiAgICAgIDHjgIFjb250ZXh05a+56LGhIDpcbiAgICAgIHsgcHJvamVjdDpcbiAgICAgICAgeyByb290OiAnL1VzZXJzL2JvYm8vV29yay90ZXN0L215MScsIC8v5bel56iL55uu5b2VXG4gICAgICAgICAgY29uZmlnRmlsZTogJ2FuZ3VsYXIuanNvbicg6YWN572u5paH5Lu2XG4gICAgICAgIH1cbiAgICAgICB9XG4gICAgICAy44CB5pel5b+X5a6e5L6L77yaXG4gICAgICAgIGxvZ2dlclxuICAgICovXG4gICAgY29uc3QgY29tbWFuZCA9IG5ldyBDbWQoY29udGV4dCwgbG9nZ2VyKTtcblxuICAgIGFyZ3MgPSBhd2FpdCBjb21tYW5kLmluaXRpYWxpemVSYXcoYXJncyk7XG4gICAgbGV0IG9wdGlvbnMgPSBwYXJzZU9wdGlvbnMoYXJncywgY29tbWFuZC5vcHRpb25zLCBjb21tYW5kLmFyZ3VtZW50cywgY29tbWFuZC5hcmdTdHJhdGVneSk7XG4gICAgYXdhaXQgY29tbWFuZC5pbml0aWFsaXplKG9wdGlvbnMpO1xuICAgIG9wdGlvbnMgPSBwYXJzZU9wdGlvbnMoYXJncywgY29tbWFuZC5vcHRpb25zLCBjb21tYW5kLmFyZ3VtZW50cywgY29tbWFuZC5hcmdTdHJhdGVneSk7XG4gICAgaWYgKGNvbW1hbmROYW1lID09PSAnaGVscCcpIHtcbiAgICAgICAgb3B0aW9ucy5jb21tYW5kTWFwID0gY29tbWFuZE1hcDtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5oZWxwKSB7XG4gICAgICAgIGNvbW1hbmQucHJpbnRIZWxwKG9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybjtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoY29tbWFuZC5zY29wZSAhPT0gdW5kZWZpbmVkICYmIGNvbW1hbmQuc2NvcGUgIT09IENvbW1hbmRTY29wZS5ldmVyeXdoZXJlKSB7XG4gICAgICAgICAgICBpZiAoY29tbWFuZC5zY29wZSAhPT0gZXhlY3V0aW9uU2NvcGUpIHtcbiAgICAgICAgICAgICAgICBsZXQgZXJyb3JNZXNzYWdlO1xuICAgICAgICAgICAgICAgIGlmIChjb21tYW5kLnNjb3BlID09PSBDb21tYW5kU2NvcGUuaW5Qcm9qZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZSA9IGBUaGlzIGNvbW1hbmQgY2FuIG9ubHkgYmUgcnVuIGluc2lkZSBvZiBhIENMSSBwcm9qZWN0LmA7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JNZXNzYWdlID0gYFRoaXMgY29tbWFuZCBjYW4gbm90IGJlIHJ1biBpbnNpZGUgb2YgYSBDTEkgcHJvamVjdC5gO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsb2dnZXIuZmF0YWwoZXJyb3JNZXNzYWdlKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoY29tbWFuZC5zY29wZSA9PT0gQ29tbWFuZFNjb3BlLmluUHJvamVjdCkge1xuICAgICAgICAgICAgICAgIGlmICghY29udGV4dC5wcm9qZWN0LmNvbmZpZ0ZpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmZhdGFsKCdJbnZhbGlkIHByb2plY3Q6IG1pc3Npbmcgd29ya3NwYWNlIGZpbGUuJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZGVsZXRlIG9wdGlvbnMuaDtcbiAgICAgICAgZGVsZXRlIG9wdGlvbnMuaGVscDtcblxuICAgICAgICAvLyDmoKHpqozlh7rpmaRoICwgaGVscOS5i+WQjueahCDlj4LmlbDlr7nosaHlkIjms5XmgKdcbiAgICAgICAgY29uc3QgaXNWYWxpZCA9IGF3YWl0IGNvbW1hbmQudmFsaWRhdGUob3B0aW9ucyk7XG4gICAgICAgIGlmICghaXNWYWxpZCkge1xuICAgICAgICAgICAgbG9nZ2VyLmZhdGFsKGBWYWxpZGF0aW9uIGVycm9yLiBJbnZhbGlkIGNvbW1hbmRgKTtcblxuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlj4LmlbDlr7nosaHlkIjms5Ug5YiZIOaJp+ihjOWRveS7pFxuICAgICAgICAvLyBvcHRpb25zOlxuICAgICAgICAvKiAgICB7XG4gICAgICAgICAgICAgXzogWydwaXBlJywgJ2JvYm8xJ10sXG4gICAgICAgICAgICAgZHJ5UnVuOiBmYWxzZSxcbiAgICAgICAgICAgICBmb3JjZTogZmFsc2UsXG4gICAgICAgICAgICAgc2tpcEltcG9ydDogdHJ1ZVxuICAgICAgICAgICB9ICovXG4gICAgICAgIHJldHVybiBhd2FpdCBjb21tYW5kLnJ1bihvcHRpb25zKTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZU9wdGlvbnM8VCA9IGFueT4oXG4gICAgYXJnczogc3RyaW5nW10sXG4gICAgY21kT3B0czogT3B0aW9uW10sXG4gICAgY29tbWFuZEFyZ3VtZW50czogc3RyaW5nW10sXG4gICAgYXJnU3RyYXRlZ3k6IEFyZ3VtZW50U3RyYXRlZ3ksXG4pOiBUIHtcbiAgICBjb25zdCBwYXJzZXIgPSB5YXJnc1BhcnNlcjtcblxuICAgIGNvbnN0IGFsaWFzZXMgPSBjbWRPcHRzLmNvbmNhdCgpXG4gICAgICAgIC5maWx0ZXIobyA9PiBvLmFsaWFzZXMgJiYgby5hbGlhc2VzLmxlbmd0aCA+IDApXG4gICAgICAgIC5yZWR1Y2UoKGFsaWFzZXM6IGFueSwgb3B0OiBPcHRpb24pID0+IHtcbiAgICAgICAgICAgIGFsaWFzZXNbb3B0Lm5hbWVdID0gKG9wdC5hbGlhc2VzIHx8IFtdKVxuICAgICAgICAgICAgICAgIC5maWx0ZXIoYSA9PiBhLmxlbmd0aCA9PT0gMSk7XG5cbiAgICAgICAgICAgIHJldHVybiBhbGlhc2VzO1xuICAgICAgICB9LCB7fSk7XG5cbiAgICBjb25zdCBib29sZWFucyA9IGNtZE9wdHNcbiAgICAgICAgLmZpbHRlcihvID0+IG8udHlwZSAmJiBvLnR5cGUgPT09IEJvb2xlYW4pXG4gICAgICAgIC5tYXAobyA9PiBvLm5hbWUpO1xuXG4gICAgY29uc3QgZGVmYXVsdHMgPSBjbWRPcHRzXG4gICAgICAgIC5maWx0ZXIobyA9PiBvLmRlZmF1bHQgIT09IHVuZGVmaW5lZCB8fCBib29sZWFucy5pbmRleE9mKG8ubmFtZSkgIT09IC0xKVxuICAgICAgICAucmVkdWNlKChkZWZhdWx0czogYW55LCBvcHQ6IE9wdGlvbikgPT4ge1xuICAgICAgICAgICAgZGVmYXVsdHNbb3B0Lm5hbWVdID0gb3B0LmRlZmF1bHQ7XG5cbiAgICAgICAgICAgIHJldHVybiBkZWZhdWx0cztcbiAgICAgICAgfSwge30pO1xuXG4gICAgY29uc3Qgc3RyaW5ncyA9IGNtZE9wdHNcbiAgICAgICAgLmZpbHRlcihvID0+IG8udHlwZSA9PT0gU3RyaW5nKVxuICAgICAgICAubWFwKG8gPT4gby5uYW1lKTtcblxuICAgIGNvbnN0IG51bWJlcnMgPSBjbWRPcHRzXG4gICAgICAgIC5maWx0ZXIobyA9PiBvLnR5cGUgPT09IE51bWJlcilcbiAgICAgICAgLm1hcChvID0+IG8ubmFtZSk7XG5cblxuICAgIGFsaWFzZXMuaGVscCA9IFsnaCddO1xuICAgIGJvb2xlYW5zLnB1c2goJ2hlbHAnKTtcblxuICAgIGNvbnN0IHlhcmdzT3B0aW9ucyA9IHtcbiAgICAgICAgYWxpYXM6IGFsaWFzZXMsXG4gICAgICAgIGJvb2xlYW46IGJvb2xlYW5zLFxuICAgICAgICBkZWZhdWx0OiBkZWZhdWx0cyxcbiAgICAgICAgc3RyaW5nOiBzdHJpbmdzLFxuICAgICAgICBudW1iZXI6IG51bWJlcnMsXG4gICAgfTtcblxuICAgIGNvbnN0IHBhcnNlZE9wdGlvbnMgPSBwYXJzZXIoYXJncywgeWFyZ3NPcHRpb25zKTtcblxuICAgIC8vIFJlbW92ZSBhbGlhc2VzLlxuICAgIGNtZE9wdHNcbiAgICAgICAgLmZpbHRlcihvID0+IG8uYWxpYXNlcyAmJiBvLmFsaWFzZXMubGVuZ3RoID4gMClcbiAgICAgICAgLm1hcChvID0+IG8uYWxpYXNlcylcbiAgICAgICAgLnJlZHVjZSgoYWxsQWxpYXNlczogYW55LCBhbGlhc2VzOiBzdHJpbmdbXSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGFsbEFsaWFzZXMuY29uY2F0KFsuLi5hbGlhc2VzXSk7XG4gICAgICAgIH0sIFtdKVxuICAgICAgICAuZm9yRWFjaCgoYWxpYXM6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgZGVsZXRlIHBhcnNlZE9wdGlvbnNbYWxpYXNdO1xuICAgICAgICB9KTtcblxuICAgIC8vIFJlbW92ZSB1bmRlZmluZWQgYm9vbGVhbnNcbiAgICBib29sZWFuc1xuICAgICAgICAuZmlsdGVyKGIgPT4gcGFyc2VkT3B0aW9uc1tiXSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAubWFwKGIgPT4gY29yZVN0cmluZ3MuY2FtZWxpemUoYikpXG4gICAgICAgIC5mb3JFYWNoKGIgPT4gZGVsZXRlIHBhcnNlZE9wdGlvbnNbYl0pO1xuXG4gICAgLy8gcmVtb3ZlIG9wdGlvbnMgd2l0aCBkYXNoZXMuXG4gICAgT2JqZWN0LmtleXMocGFyc2VkT3B0aW9ucylcbiAgICAgICAgLmZpbHRlcihrZXkgPT4ga2V5LmluZGV4T2YoJy0nKSAhPT0gLTEpXG4gICAgICAgIC5mb3JFYWNoKGtleSA9PiBkZWxldGUgcGFyc2VkT3B0aW9uc1trZXldKTtcblxuICAgIC8vIHJlbW92ZSB0aGUgY29tbWFuZCBuYW1lXG4gICAgcGFyc2VkT3B0aW9ucy5fID0gcGFyc2VkT3B0aW9ucy5fLnNsaWNlKDEpO1xuXG4gICAgc3dpdGNoIChhcmdTdHJhdGVneSkge1xuICAgICAgICBjYXNlIEFyZ3VtZW50U3RyYXRlZ3kuTWFwVG9PcHRpb25zOlxuICAgICAgICAgICAgcGFyc2VkT3B0aW9ucy5fLmZvckVhY2goKHZhbHVlOiBzdHJpbmcsIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhcmcgPSBjb21tYW5kQXJndW1lbnRzW2luZGV4XTtcbiAgICAgICAgICAgICAgICBpZiAoYXJnKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcnNlZE9wdGlvbnNbYXJnXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBkZWxldGUgcGFyc2VkT3B0aW9ucy5fO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhcnNlZE9wdGlvbnMgYXMgYW55O1xufVxuXG4vLyBGaW5kIGEgY29tbWFuZC5cbmZ1bmN0aW9uIGZpbmRDb21tYW5kKG1hcDogQ29tbWFuZE1hcCwgbmFtZTogc3RyaW5nKTogQ29tbWFuZENvbnN0cnVjdG9yIHwgbnVsbCB7XG4gICAgbGV0IENtZDogQ29tbWFuZENvbnN0cnVjdG9yID0gbWFwW25hbWVdO1xuXG4gICAgaWYgKCFDbWQpIHtcbiAgICAgICAgLy8gZmluZCBjb21tYW5kIHZpYSBhbGlhc2VzXG4gICAgICAgIENtZCA9IE9iamVjdC5rZXlzKG1hcClcbiAgICAgICAgICAgIC5maWx0ZXIoa2V5ID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIW1hcFtrZXldLmFsaWFzZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBmb3VuZEFsaWFzID0gbWFwW2tleV0uYWxpYXNlc1xuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKChhbGlhczogc3RyaW5nKSA9PiBhbGlhcyA9PT0gbmFtZSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZm91bmRBbGlhcy5sZW5ndGggPiAwO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5tYXAoKGtleSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBtYXBba2V5XTtcbiAgICAgICAgICAgIH0pWzBdO1xuICAgIH1cblxuICAgIGlmICghQ21kKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBDbWQ7XG59XG5cbmZ1bmN0aW9uIGxpc3RBbGxDb21tYW5kTmFtZXMobWFwOiBDb21tYW5kTWFwKTogc3RyaW5nW10ge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhtYXApLmNvbmNhdChcbiAgICAgICAgT2JqZWN0LmtleXMobWFwKVxuICAgICAgICAgICAgLnJlZHVjZSgoYWNjLCBrZXkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIW1hcFtrZXldLmFsaWFzZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gYWNjLmNvbmNhdChtYXBba2V5XS5hbGlhc2VzKTtcbiAgICAgICAgICAgIH0sIFtdIGFzIHN0cmluZ1tdKSxcbiAgICApO1xufVxuIl19