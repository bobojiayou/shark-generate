import { logging } from '@angular-devkit/core';
import { ArgumentStrategy, CommandConstructor, CommandContext, Option } from './command';
export interface CommandMap {
    [key: string]: CommandConstructor;
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
export declare function runCommand(commandMap: CommandMap, args: string[], logger: logging.Logger, context: CommandContext): Promise<number | void>;
export declare function parseOptions<T = any>(args: string[], cmdOpts: Option[], commandArguments: string[], argStrategy: ArgumentStrategy): T;
