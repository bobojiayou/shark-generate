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
const core_1 = require("@angular-devkit/core");
const node_1 = require("@angular-devkit/core/node");
const schematics_1 = require("@angular-devkit/schematics");
const tools_1 = require("@angular-devkit/schematics/tools");
const operators_1 = require("rxjs/operators");
const workspace_loader_1 = require("../lib/workspace-loader");
const config_1 = require("../util/config");
const config_2 = require("../util/config");
const schematics_2 = require("../lib/schematics");
const command_1 = require("./command");
class SchematicCommand extends command_1.Command {
    constructor() {
        super(...arguments);
        this.options = [];
        this.allowPrivateSchematics = false;
        this._host = new node_1.NodeJsSyncHost();
        this.argStrategy = command_1.ArgumentStrategy.Nothing;
        this.coreOptions = [
            {
                name: 'dryRun',
                type: Boolean,
                default: false,
                aliases: ['d'],
                description: 'Run through without making any changes.',
            },
            {
                name: 'force',
                type: Boolean,
                default: false,
                aliases: ['f'],
                description: 'Forces overwriting of files.',
            }
        ];
        this.arguments = ['project'];
    }
    initialize(_options) {
        return __awaiter(this, void 0, void 0, function* () {
            this._loadWorkspace();
        });
    }
    // params: { _: [ 'bobo1' ], skipImport: true }, '/src'
    setPathOptions(options, workingDir) {
        if (workingDir === '') {
            return {};
        }
        return this.options
            .filter(o => o.format === 'path')
            .map(o => o.name)
            .filter(name => options[name] === undefined)
            .reduce((acc, curr) => {
            acc[curr] = workingDir;
            return acc;
        }, {});
    }
    runSchematic(options) {
        /**
         * 从传入的配置项 options
         * options = { _: [ 'bobo3' ], dryRun: false, force: false, skipImport: true }
             ---runSchematic options-- { collectionName: '@schematics/angular',
            schematicName: 'pipe',
            schematicOptions: { _: [ 'bobo3' ], dryRun: false, force: false, skipImport: true },
            debug: undefined,
            dryRun: false,
            force: false }
         */
        /*     console.log('---runSchematic options--', options);
         */
        const { collectionName, schematicName, debug, force, dryRun } = options;
        /**
         * 移除schematicOptions中 的原始options里面的参数
         * ==>schematicOptions:{ _: [ 'bobo1' ], skipImport: true }
         *  console.log('--schematicOptions--', schematicOptions)
        */
        let schematicOptions = this.removeCoreOptions(options.schematicOptions);
        let nothingDone = true;
        let loggingQueue = [];
        let error = false;
        const fsHost = new core_1.virtualFs.ScopedHost(new node_1.NodeJsSyncHost(), core_1.normalize(this.project.root));
        /**
         *  实例化一个工作流
         */
        const workflow = new tools_1.NodeWorkflow(fsHost, {
            force,
            dryRun,
            packageManager: config_1.getPackageManager(),
            root: this.project.root
        });
        // 获取当前工作目录的绝对路径  eg. /src   process.cwd() ==> node.js进程当前工作的目录
        const workingDir = process.cwd().replace(this.project.root, '').replace(/\\/g, '/');
        // { path: '/src' } this.setPathOptions({ _: [ 'bobo1' ], skipImport: true }, '/src')
        const pathOptions = this.setPathOptions(schematicOptions, workingDir);
        // schematicOptions = { _: [ 'bobo4'], skipImport: true, path: '/src' }
        schematicOptions = Object.assign({}, schematicOptions, pathOptions);
        const defaultOptions = this.readDefaults(collectionName, schematicName, schematicOptions);
        schematicOptions = Object.assign({}, schematicOptions, defaultOptions);
        // Pass the rest of the arguments as the smart default "argv". Then delete it.
        // Removing the first item which is the schematic name.
        // eg. rawArgs = [ 'bobo4']
        const rawArgs = schematicOptions._;
        workflow.registry.addSmartDefaultProvider('argv', (schema) => {
            // schema = { '$source': 'argv', index: 0 }
            if ('index' in schema) {
                return rawArgs[Number(schema['index'])]; // 'bobo4' --
            }
            else {
                return rawArgs;
            }
        });
        delete schematicOptions._;
        workflow.registry.addSmartDefaultProvider('projectName', (_schema) => {
            //  _schema = { '$source': 'projectName' }
            /*   this._workspace =  { '$schema': './node_modules/@angular/cli/lib/config/schema.json',
                      version: 1,
                      newProjectRoot: 'projects',
                      projects: { my1: [Object], 'my1-e2e': [Object] },
                      defaultProject: 'my1',
                      cli: { },
                      schematics: { },
                      architect: { }
                  } }
            */
            /*  console.log('--this._workspace.projects--', (this._workspace as any).projects) */
            if (this._workspace) {
                return this._workspace.getProjectByPath(core_1.normalize(process.cwd()))
                    || this._workspace.getDefaultProjectName();
            }
            return undefined;
        });
        workflow.reporter.subscribe((event) => {
            nothingDone = false;
            // Strip leading slash to prevent confusion.
            const eventPath = event.path.startsWith('/') ? event.path.substr(1) : event.path; // src/bobo10.pipe.ts
            switch (event.kind) {
                case 'error':
                    error = true;
                    const desc = event.description == 'alreadyExist' ? 'already exists' : 'does not exist.';
                    this.logger.warn(`ERROR! ${eventPath} ${desc}.`);
                    break;
                case 'update':
                    loggingQueue.push(core_1.tags.oneLine `
            ${core_1.terminal.white('UPDATE')} ${eventPath} (${event.content.length} bytes)
          `);
                    break;
                case 'create':
                    loggingQueue.push(core_1.tags.oneLine `
            ${core_1.terminal.green('CREATE')} ${eventPath} (${event.content.length} bytes)
          `);
                    break;
                case 'delete':
                    loggingQueue.push(`${core_1.terminal.yellow('DELETE')} ${eventPath}`);
                    break;
                case 'rename':
                    loggingQueue.push(`${core_1.terminal.blue('RENAME')} ${eventPath} => ${event.to}`);
                    break;
            }
        });
        workflow.lifeCycle.subscribe(event => {
            if (event.kind == 'end' || event.kind == 'post-tasks-start') {
                if (!error) {
                    // Output the logging queue, no error happened.
                    loggingQueue.forEach(log => this.logger.info(log));
                }
                loggingQueue = [];
                error = false;
            }
        });
        return new Promise((resolve) => {
            const obj = {
                collection: collectionName,
                schematic: schematicName,
                options: schematicOptions,
                debug: debug,
                logger: this.logger,
                allowPrivate: this.allowPrivateSchematics,
            };
            workflow.execute({
                collection: collectionName,
                schematic: schematicName,
                options: schematicOptions,
                debug: debug,
                logger: this.logger,
                allowPrivate: this.allowPrivateSchematics,
            })
                .subscribe({
                error: (err) => {
                    // In case the workflow was not successful, show an appropriate error message.
                    if (err instanceof schematics_1.UnsuccessfulWorkflowExecution) {
                        // "See above" because we already printed the error.
                        this.logger.fatal('The Schematic workflow failed. See above.');
                    }
                    else if (debug) {
                        this.logger.fatal(`An error occured:\n${err.message}\n${err.stack}`);
                    }
                    else {
                        this.logger.fatal(err.message);
                    }
                    resolve(1);
                },
                complete: () => {
                    const showNothingDone = !(options.showNothingDone === false);
                    if (nothingDone && showNothingDone) {
                        this.logger.info('Nothing to be done.');
                    }
                    if (dryRun) {
                        this.logger.warn(`\nNOTE: Run with "dry run" no changes were made.`);
                    }
                    resolve();
                },
            });
        });
    }
    removeCoreOptions(options) {
        const opts = Object.assign({}, options);
        /**  __originalOptions
         *  [ { name: 'dryRun',
                type: [Function: Boolean],
                default: false,
                aliases: [ 'd' ],
                description: 'Run through without making any changes.'
              },
              { name: 'force',
                type: [Function: Boolean],
                default: false,
                aliases: [ 'f' ],
                description: 'Forces overwriting of files.'
              } ]
        */
        /*   console.log('--this.__originalOptions--', this._originalOptions) */
        if (this._originalOptions.find(option => option.name == 'dryRun')) {
            delete opts.dryRun;
        }
        if (this._originalOptions.find(option => option.name == 'force')) {
            delete opts.force;
        }
        if (this._originalOptions.find(option => option.name == 'debug')) {
            delete opts.debug;
        }
        return opts;
    }
    getOptions(options) {
        // Make a copy.
        this._originalOptions = [...this.options];
        const collectionName = options.collectionName || config_1.getDefaultSchematicCollection();
        const collection = schematics_2.getCollection(collectionName);
        const schematic = schematics_2.getSchematic(collection, options.schematicName, this.allowPrivateSchematics);
        this._deAliasedName = schematic.description.name;
        if (!schematic.description.schemaJson) {
            return Promise.resolve({
                options: [],
                arguments: [],
            });
        }
        const properties = schematic.description.schemaJson.properties;
        const keys = Object.keys(properties);
        const availableOptions = keys
            .map(key => (Object.assign({}, properties[key], { name: core_1.strings.dasherize(key) })))
            .map(opt => {
            let type;
            const schematicType = opt.type;
            switch (opt.type) {
                case 'string':
                    type = String;
                    break;
                case 'boolean':
                    type = Boolean;
                    break;
                case 'integer':
                case 'number':
                    type = Number;
                    break;
                // Ignore arrays / objects.
                default:
                    return null;
            }
            let aliases = [];
            if (opt.alias) {
                aliases = [...aliases, opt.alias];
            }
            if (opt.aliases) {
                aliases = [...aliases, ...opt.aliases];
            }
            const schematicDefault = opt.default;
            return Object.assign({}, opt, { aliases,
                type,
                schematicType, default: undefined, // do not carry over schematics defaults
                schematicDefault, hidden: opt.visible === false });
        })
            .filter(x => x);
        const schematicOptions = availableOptions
            .filter(opt => opt.$default === undefined || opt.$default.$source !== 'argv');
        const schematicArguments = availableOptions
            .filter(opt => opt.$default !== undefined && opt.$default.$source === 'argv')
            .sort((a, b) => {
            if (a.$default.index === undefined) {
                return 1;
            }
            if (b.$default.index === undefined) {
                return -1;
            }
            if (a.$default.index == b.$default.index) {
                return 0;
            }
            else if (a.$default.index > b.$default.index) {
                return 1;
            }
            else {
                return -1;
            }
        });
        return Promise.resolve({
            options: schematicOptions,
            arguments: schematicArguments,
        });
    }
    _loadWorkspace() {
        if (this._workspace) {
            return;
        }
        const workspaceLoader = new workspace_loader_1.WorkspaceLoader(this._host);
        try {
            workspaceLoader.loadWorkspace(this.project.root).pipe(operators_1.take(1))
                .subscribe((workspace) => this._workspace = workspace, (err) => {
                if (!this.allowMissingWorkspace) {
                    // Ignore missing workspace
                    throw err;
                }
            });
        }
        catch (err) {
            if (!this.allowMissingWorkspace) {
                // Ignore missing workspace
                throw err;
            }
        }
    }
    _cleanDefaults(defaults, undefinedOptions) {
        Object.keys(defaults)
            .filter(key => !undefinedOptions.map(core_1.strings.camelize).includes(key))
            .forEach(key => {
            delete defaults[key];
        });
        return defaults;
    }
    readDefaults(collectionName, schematicName, options) {
        if (this._deAliasedName) {
            schematicName = this._deAliasedName;
        }
        const projectName = options.project;
        const defaults = config_2.getSchematicDefaults(collectionName, schematicName, projectName);
        // Get list of all undefined options.
        const undefinedOptions = this.options
            .filter(o => options[o.name] === undefined)
            .map(o => o.name);
        // Delete any default that is not undefined.
        this._cleanDefaults(defaults, undefinedOptions);
        return defaults;
    }
}
exports.SchematicCommand = SchematicCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hdGljLWNvbW1hbmQuanMiLCJzb3VyY2VSb290IjoiL1VzZXJzL2JvYm8vV29yay9zaGFyay1nZW5lcmF0ZS8iLCJzb3VyY2VzIjpbImNvbW1hbmRzL3NjaGVtYXRpYy1jb21tYW5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFFQSwrQ0FBcUY7QUFDckYsb0RBQTJEO0FBQzNELDJEQUF3RjtBQUN4Riw0REFBZ0U7QUFDaEUsOENBQXNDO0FBQ3RDLDhEQUEwRDtBQUMxRCwyQ0FBa0Y7QUFDbEYsMkNBQXNEO0FBQ3RELGtEQUFnRTtBQUNoRSx1Q0FBOEQ7QUEyQjlELHNCQUF1QyxTQUFRLGlCQUFPO0lBQXREOztRQUNhLFlBQU8sR0FBYSxFQUFFLENBQUM7UUFDdkIsMkJBQXNCLEdBQVksS0FBSyxDQUFDO1FBQ3pDLFVBQUssR0FBRyxJQUFJLHFCQUFjLEVBQUUsQ0FBQztRQUlyQyxnQkFBVyxHQUFHLDBCQUFnQixDQUFDLE9BQU8sQ0FBQztRQUVwQixnQkFBVyxHQUFhO1lBQ3ZDO2dCQUNJLElBQUksRUFBRSxRQUFRO2dCQUNkLElBQUksRUFBRSxPQUFPO2dCQUNiLE9BQU8sRUFBRSxLQUFLO2dCQUNkLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQztnQkFDZCxXQUFXLEVBQUUseUNBQXlDO2FBQ3pEO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLE9BQU87Z0JBQ2IsSUFBSSxFQUFFLE9BQU87Z0JBQ2IsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDO2dCQUNkLFdBQVcsRUFBRSw4QkFBOEI7YUFDOUM7U0FBQyxDQUFDO1FBRUUsY0FBUyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7SUF1V3JDLENBQUM7SUFyV2dCLFVBQVUsQ0FBQyxRQUFhOztZQUNqQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDMUIsQ0FBQztLQUFBO0lBRUQsdURBQXVEO0lBQzdDLGNBQWMsQ0FBQyxPQUFZLEVBQUUsVUFB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LENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBRWhELE9BQU8sUUFBUSxDQUFDO0lBQ3BCLENBQUM7Q0FDSjtBQWhZRCw0Q0FnWUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0c2xpbnQ6ZGlzYWJsZTpuby1nbG9iYWwtdHNsaW50LWRpc2FibGUgbm8tYW55IGZpbGUtaGVhZGVyXG5pbXBvcnQgeyBKc29uT2JqZWN0LCBleHBlcmltZW50YWwgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBub3JtYWxpemUsIHN0cmluZ3MsIHRhZ3MsIHRlcm1pbmFsLCB2aXJ0dWFsRnMgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBOb2RlSnNTeW5jSG9zdCB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlL25vZGUnO1xuaW1wb3J0IHsgRHJ5UnVuRXZlbnQsIFVuc3VjY2Vzc2Z1bFdvcmtmbG93RXhlY3V0aW9uIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHsgTm9kZVdvcmtmbG93IH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MvdG9vbHMnO1xuaW1wb3J0IHsgdGFrZSB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7IFdvcmtzcGFjZUxvYWRlciB9IGZyb20gJy4uL2xpYi93b3Jrc3BhY2UtbG9hZGVyJztcbmltcG9ydCB7IGdldERlZmF1bHRTY2hlbWF0aWNDb2xsZWN0aW9uLCBnZXRQYWNrYWdlTWFuYWdlciB9IGZyb20gJy4uL3V0aWwvY29uZmlnJztcbmltcG9ydCB7IGdldFNjaGVtYXRpY0RlZmF1bHRzIH0gZnJvbSAnLi4vdXRpbC9jb25maWcnO1xuaW1wb3J0IHsgZ2V0Q29sbGVjdGlvbiwgZ2V0U2NoZW1hdGljIH0gZnJvbSAnLi4vbGliL3NjaGVtYXRpY3MnO1xuaW1wb3J0IHsgQXJndW1lbnRTdHJhdGVneSwgQ29tbWFuZCwgT3B0aW9uIH0gZnJvbSAnLi9jb21tYW5kJztcblxuZXhwb3J0IGludGVyZmFjZSBDb3JlU2NoZW1hdGljT3B0aW9ucyB7XG4gICAgZHJ5UnVuOiBib29sZWFuO1xuICAgIGZvcmNlOiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJ1blNjaGVtYXRpY09wdGlvbnMge1xuICAgIGNvbGxlY3Rpb25OYW1lOiBzdHJpbmc7XG4gICAgc2NoZW1hdGljTmFtZTogc3RyaW5nO1xuICAgIHNjaGVtYXRpY09wdGlvbnM6IGFueTtcbiAgICBkZWJ1Zz86IGJvb2xlYW47XG4gICAgZHJ5UnVuOiBib29sZWFuO1xuICAgIGZvcmNlOiBib29sZWFuO1xuICAgIHNob3dOb3RoaW5nRG9uZT86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgR2V0T3B0aW9uc09wdGlvbnMge1xuICAgIGNvbGxlY3Rpb25OYW1lOiBzdHJpbmc7XG4gICAgc2NoZW1hdGljTmFtZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEdldE9wdGlvbnNSZXN1bHQge1xuICAgIG9wdGlvbnM6IE9wdGlvbltdO1xuICAgIGFyZ3VtZW50czogT3B0aW9uW107XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTY2hlbWF0aWNDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gICAgcmVhZG9ubHkgb3B0aW9uczogT3B0aW9uW10gPSBbXTtcbiAgICByZWFkb25seSBhbGxvd1ByaXZhdGVTY2hlbWF0aWNzOiBib29sZWFuID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBfaG9zdCA9IG5ldyBOb2RlSnNTeW5jSG9zdCgpO1xuICAgIHByaXZhdGUgX3dvcmtzcGFjZTogZXhwZXJpbWVudGFsLndvcmtzcGFjZS5Xb3Jrc3BhY2U7XG4gICAgcHJpdmF0ZSBfZGVBbGlhc2VkTmFtZTogc3RyaW5nO1xuICAgIHByaXZhdGUgX29yaWdpbmFsT3B0aW9uczogT3B0aW9uW107XG4gICAgYXJnU3RyYXRlZ3kgPSBBcmd1bWVudFN0cmF0ZWd5Lk5vdGhpbmc7XG5cbiAgICBwcm90ZWN0ZWQgcmVhZG9ubHkgY29yZU9wdGlvbnM6IE9wdGlvbltdID0gW1xuICAgICAgICB7XG4gICAgICAgICAgICBuYW1lOiAnZHJ5UnVuJyxcbiAgICAgICAgICAgIHR5cGU6IEJvb2xlYW4sXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgICAgIGFsaWFzZXM6IFsnZCddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdSdW4gdGhyb3VnaCB3aXRob3V0IG1ha2luZyBhbnkgY2hhbmdlcy4nLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBuYW1lOiAnZm9yY2UnLFxuICAgICAgICAgICAgdHlwZTogQm9vbGVhbixcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgICAgICAgYWxpYXNlczogWydmJ10sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0ZvcmNlcyBvdmVyd3JpdGluZyBvZiBmaWxlcy4nLFxuICAgICAgICB9XTtcblxuICAgIHJlYWRvbmx5IGFyZ3VtZW50cyA9IFsncHJvamVjdCddO1xuXG4gICAgcHVibGljIGFzeW5jIGluaXRpYWxpemUoX29wdGlvbnM6IGFueSkge1xuICAgICAgICB0aGlzLl9sb2FkV29ya3NwYWNlKCk7XG4gICAgfVxuXG4gICAgLy8gcGFyYW1zOiB7IF86IFsgJ2JvYm8xJyBdLCBza2lwSW1wb3J0OiB0cnVlIH0sICcvc3JjJ1xuICAgIHByb3RlY3RlZCBzZXRQYXRoT3B0aW9ucyhvcHRpb25zOiBhbnksIHdvcmtpbmdEaXI6IHN0cmluZyk6IGFueSB7XG4gICAgICAgIGlmICh3b3JraW5nRGlyID09PSAnJykge1xuICAgICAgICAgICAgcmV0dXJuIHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9uc1xuICAgICAgICAgICAgLmZpbHRlcihvID0+IG8uZm9ybWF0ID09PSAncGF0aCcpXG4gICAgICAgICAgICAubWFwKG8gPT4gby5uYW1lKVxuICAgICAgICAgICAgLmZpbHRlcihuYW1lID0+IG9wdGlvbnNbbmFtZV0gPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIC5yZWR1Y2UoKGFjYzogYW55LCBjdXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgYWNjW2N1cnJdID0gd29ya2luZ0RpcjtcblxuICAgICAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgICB9LCB7fSk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHJ1blNjaGVtYXRpYyhvcHRpb25zOiBSdW5TY2hlbWF0aWNPcHRpb25zKSB7XG4gICAgICAgIC8qKiAgICBcbiAgICAgICAgICog5LuO5Lyg5YWl55qE6YWN572u6aG5IG9wdGlvbnNcbiAgICAgICAgICogb3B0aW9ucyA9IHsgXzogWyAnYm9ibzMnIF0sIGRyeVJ1bjogZmFsc2UsIGZvcmNlOiBmYWxzZSwgc2tpcEltcG9ydDogdHJ1ZSB9XG4gICAgICAgICAgICAgLS0tcnVuU2NoZW1hdGljIG9wdGlvbnMtLSB7IGNvbGxlY3Rpb25OYW1lOiAnQHNjaGVtYXRpY3MvYW5ndWxhcicsXG4gICAgICAgICAgICBzY2hlbWF0aWNOYW1lOiAncGlwZScsXG4gICAgICAgICAgICBzY2hlbWF0aWNPcHRpb25zOiB7IF86IFsgJ2JvYm8zJyBdLCBkcnlSdW46IGZhbHNlLCBmb3JjZTogZmFsc2UsIHNraXBJbXBvcnQ6IHRydWUgfSxcbiAgICAgICAgICAgIGRlYnVnOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBkcnlSdW46IGZhbHNlLFxuICAgICAgICAgICAgZm9yY2U6IGZhbHNlIH1cbiAgICAgICAgICovXG4gICAgICAgIC8qICAgICBjb25zb2xlLmxvZygnLS0tcnVuU2NoZW1hdGljIG9wdGlvbnMtLScsIG9wdGlvbnMpO1xuICAgICAgICAgKi9cbiAgICAgICAgY29uc3QgeyBjb2xsZWN0aW9uTmFtZSwgc2NoZW1hdGljTmFtZSwgZGVidWcsIGZvcmNlLCBkcnlSdW4gfSA9IG9wdGlvbnM7XG4gICAgICAgIC8qKiAgXG4gICAgICAgICAqIOenu+mZpHNjaGVtYXRpY09wdGlvbnPkuK0g55qE5Y6f5aeLb3B0aW9uc+mHjOmdoueahOWPguaVsFxuICAgICAgICAgKiA9PT5zY2hlbWF0aWNPcHRpb25zOnsgXzogWyAnYm9ibzEnIF0sIHNraXBJbXBvcnQ6IHRydWUgfVxuICAgICAgICAgKiAgY29uc29sZS5sb2coJy0tc2NoZW1hdGljT3B0aW9ucy0tJywgc2NoZW1hdGljT3B0aW9ucylcbiAgICAgICAgKi9cbiAgICAgICAgbGV0IHNjaGVtYXRpY09wdGlvbnMgPSB0aGlzLnJlbW92ZUNvcmVPcHRpb25zKG9wdGlvbnMuc2NoZW1hdGljT3B0aW9ucyk7XG4gICAgICAgIGxldCBub3RoaW5nRG9uZSA9IHRydWU7XG4gICAgICAgIGxldCBsb2dnaW5nUXVldWU6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGxldCBlcnJvciA9IGZhbHNlO1xuICAgICAgICBjb25zdCBmc0hvc3QgPSBuZXcgdmlydHVhbEZzLlNjb3BlZEhvc3QobmV3IE5vZGVKc1N5bmNIb3N0KCksIG5vcm1hbGl6ZSh0aGlzLnByb2plY3Qucm9vdCkpO1xuICAgICAgICAvKipcbiAgICAgICAgICogIOWunuS+i+WMluS4gOS4quW3peS9nOa1gVxuICAgICAgICAgKi9cbiAgICAgICAgY29uc3Qgd29ya2Zsb3cgPSBuZXcgTm9kZVdvcmtmbG93KFxuICAgICAgICAgICAgZnNIb3N0IGFzIGFueSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmb3JjZSxcbiAgICAgICAgICAgICAgICBkcnlSdW4sXG4gICAgICAgICAgICAgICAgcGFja2FnZU1hbmFnZXI6IGdldFBhY2thZ2VNYW5hZ2VyKCksIC8vIOWMheeuoeeQhuW3peWFtyBucG18fCBjbnBtIHx8IHlhcm5cbiAgICAgICAgICAgICAgICByb290OiB0aGlzLnByb2plY3Qucm9vdFxuICAgICAgICAgICAgfSxcbiAgICAgICAgKTtcbiAgICAgICAgLy8g6I635Y+W5b2T5YmN5bel5L2c55uu5b2V55qE57ud5a+56Lev5b6EICBlZy4gL3NyYyAgIHByb2Nlc3MuY3dkKCkgPT0+IG5vZGUuanPov5vnqIvlvZPliY3lt6XkvZznmoTnm67lvZVcbiAgICAgICAgY29uc3Qgd29ya2luZ0RpciA9IHByb2Nlc3MuY3dkKCkucmVwbGFjZSh0aGlzLnByb2plY3Qucm9vdCwgJycpLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcbiAgICAgICAgLy8geyBwYXRoOiAnL3NyYycgfSB0aGlzLnNldFBhdGhPcHRpb25zKHsgXzogWyAnYm9ibzEnIF0sIHNraXBJbXBvcnQ6IHRydWUgfSwgJy9zcmMnKVxuICAgICAgICBjb25zdCBwYXRoT3B0aW9ucyA9IHRoaXMuc2V0UGF0aE9wdGlvbnMoc2NoZW1hdGljT3B0aW9ucywgd29ya2luZ0Rpcik7XG5cbiAgICAgICAgLy8gc2NoZW1hdGljT3B0aW9ucyA9IHsgXzogWyAnYm9ibzQnXSwgc2tpcEltcG9ydDogdHJ1ZSwgcGF0aDogJy9zcmMnIH1cbiAgICAgICAgc2NoZW1hdGljT3B0aW9ucyA9IHsgLi4uc2NoZW1hdGljT3B0aW9ucywgLi4ucGF0aE9wdGlvbnMgfTtcbiAgICAgICAgY29uc3QgZGVmYXVsdE9wdGlvbnMgPSB0aGlzLnJlYWREZWZhdWx0cyhjb2xsZWN0aW9uTmFtZSwgc2NoZW1hdGljTmFtZSwgc2NoZW1hdGljT3B0aW9ucyk7XG4gICAgICAgIHNjaGVtYXRpY09wdGlvbnMgPSB7IC4uLnNjaGVtYXRpY09wdGlvbnMsIC4uLmRlZmF1bHRPcHRpb25zIH07XG5cbiAgICAgICAgLy8gUGFzcyB0aGUgcmVzdCBvZiB0aGUgYXJndW1lbnRzIGFzIHRoZSBzbWFydCBkZWZhdWx0IFwiYXJndlwiLiBUaGVuIGRlbGV0ZSBpdC5cbiAgICAgICAgLy8gUmVtb3ZpbmcgdGhlIGZpcnN0IGl0ZW0gd2hpY2ggaXMgdGhlIHNjaGVtYXRpYyBuYW1lLlxuICAgICAgICAvLyBlZy4gcmF3QXJncyA9IFsgJ2JvYm80J11cbiAgICAgICAgY29uc3QgcmF3QXJncyA9IHNjaGVtYXRpY09wdGlvbnMuXztcbiAgICAgICAgd29ya2Zsb3cucmVnaXN0cnkuYWRkU21hcnREZWZhdWx0UHJvdmlkZXIoJ2FyZ3YnLCAoc2NoZW1hOiBKc29uT2JqZWN0KSA9PiB7XG4gICAgICAgICAgICAvLyBzY2hlbWEgPSB7ICckc291cmNlJzogJ2FyZ3YnLCBpbmRleDogMCB9XG4gICAgICAgICAgICBpZiAoJ2luZGV4JyBpbiBzY2hlbWEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmF3QXJnc1tOdW1iZXIoc2NoZW1hWydpbmRleCddKV07IC8vICdib2JvNCcgLS1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJhd0FyZ3M7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBkZWxldGUgc2NoZW1hdGljT3B0aW9ucy5fO1xuXG4gICAgICAgIHdvcmtmbG93LnJlZ2lzdHJ5LmFkZFNtYXJ0RGVmYXVsdFByb3ZpZGVyKCdwcm9qZWN0TmFtZScsIChfc2NoZW1hOiBKc29uT2JqZWN0KSA9PiB7XG4gICAgICAgICAgICAvLyAgX3NjaGVtYSA9IHsgJyRzb3VyY2UnOiAncHJvamVjdE5hbWUnIH1cbiAgICAgICAgICAgIC8qICAgdGhpcy5fd29ya3NwYWNlID0gIHsgJyRzY2hlbWEnOiAnLi9ub2RlX21vZHVsZXMvQGFuZ3VsYXIvY2xpL2xpYi9jb25maWcvc2NoZW1hLmpzb24nLFxuICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb246IDEsXG4gICAgICAgICAgICAgICAgICAgICAgbmV3UHJvamVjdFJvb3Q6ICdwcm9qZWN0cycsXG4gICAgICAgICAgICAgICAgICAgICAgcHJvamVjdHM6IHsgbXkxOiBbT2JqZWN0XSwgJ215MS1lMmUnOiBbT2JqZWN0XSB9LFxuICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRQcm9qZWN0OiAnbXkxJyxcbiAgICAgICAgICAgICAgICAgICAgICBjbGk6IHsgfSxcbiAgICAgICAgICAgICAgICAgICAgICBzY2hlbWF0aWNzOiB7IH0sXG4gICAgICAgICAgICAgICAgICAgICAgYXJjaGl0ZWN0OiB7IH1cbiAgICAgICAgICAgICAgICAgIH0gfSBcbiAgICAgICAgICAgICovXG4gICAgICAgICAgICAvKiAgY29uc29sZS5sb2coJy0tdGhpcy5fd29ya3NwYWNlLnByb2plY3RzLS0nLCAodGhpcy5fd29ya3NwYWNlIGFzIGFueSkucHJvamVjdHMpICovXG4gICAgICAgICAgICBpZiAodGhpcy5fd29ya3NwYWNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dvcmtzcGFjZS5nZXRQcm9qZWN0QnlQYXRoKG5vcm1hbGl6ZShwcm9jZXNzLmN3ZCgpKSlcbiAgICAgICAgICAgICAgICAgICAgfHwgdGhpcy5fd29ya3NwYWNlLmdldERlZmF1bHRQcm9qZWN0TmFtZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfSk7XG4gICAgICAgIHdvcmtmbG93LnJlcG9ydGVyLnN1YnNjcmliZSgoZXZlbnQ6IERyeVJ1bkV2ZW50KSA9PiB7XG4gICAgICAgICAgICBub3RoaW5nRG9uZSA9IGZhbHNlO1xuICAgICAgICAgICAgLy8gU3RyaXAgbGVhZGluZyBzbGFzaCB0byBwcmV2ZW50IGNvbmZ1c2lvbi5cbiAgICAgICAgICAgIGNvbnN0IGV2ZW50UGF0aCA9IGV2ZW50LnBhdGguc3RhcnRzV2l0aCgnLycpID8gZXZlbnQucGF0aC5zdWJzdHIoMSkgOiBldmVudC5wYXRoOyAvLyBzcmMvYm9ibzEwLnBpcGUudHNcbiAgICAgICAgICAgIHN3aXRjaCAoZXZlbnQua2luZCkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ2Vycm9yJzpcbiAgICAgICAgICAgICAgICAgICAgZXJyb3IgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkZXNjID0gZXZlbnQuZGVzY3JpcHRpb24gPT0gJ2FscmVhZHlFeGlzdCcgPyAnYWxyZWFkeSBleGlzdHMnIDogJ2RvZXMgbm90IGV4aXN0Lic7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLndhcm4oYEVSUk9SISAke2V2ZW50UGF0aH0gJHtkZXNjfS5gKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAndXBkYXRlJzpcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2luZ1F1ZXVlLnB1c2godGFncy5vbmVMaW5lYFxuICAgICAgICAgICAgJHt0ZXJtaW5hbC53aGl0ZSgnVVBEQVRFJyl9ICR7ZXZlbnRQYXRofSAoJHtldmVudC5jb250ZW50Lmxlbmd0aH0gYnl0ZXMpXG4gICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2NyZWF0ZSc6XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dpbmdRdWV1ZS5wdXNoKHRhZ3Mub25lTGluZWBcbiAgICAgICAgICAgICR7dGVybWluYWwuZ3JlZW4oJ0NSRUFURScpfSAke2V2ZW50UGF0aH0gKCR7ZXZlbnQuY29udGVudC5sZW5ndGh9IGJ5dGVzKVxuICAgICAgICAgIGApO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdkZWxldGUnOlxuICAgICAgICAgICAgICAgICAgICBsb2dnaW5nUXVldWUucHVzaChgJHt0ZXJtaW5hbC55ZWxsb3coJ0RFTEVURScpfSAke2V2ZW50UGF0aH1gKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAncmVuYW1lJzpcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2luZ1F1ZXVlLnB1c2goYCR7dGVybWluYWwuYmx1ZSgnUkVOQU1FJyl9ICR7ZXZlbnRQYXRofSA9PiAke2V2ZW50LnRvfWApO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgd29ya2Zsb3cubGlmZUN5Y2xlLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICAgICAgICBpZiAoZXZlbnQua2luZCA9PSAnZW5kJyB8fCBldmVudC5raW5kID09ICdwb3N0LXRhc2tzLXN0YXJ0Jykge1xuICAgICAgICAgICAgICAgIGlmICghZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gT3V0cHV0IHRoZSBsb2dnaW5nIHF1ZXVlLCBubyBlcnJvciBoYXBwZW5lZC5cbiAgICAgICAgICAgICAgICAgICAgbG9nZ2luZ1F1ZXVlLmZvckVhY2gobG9nID0+IHRoaXMubG9nZ2VyLmluZm8obG9nKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbG9nZ2luZ1F1ZXVlID0gW107XG4gICAgICAgICAgICAgICAgZXJyb3IgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPG51bWJlciB8IHZvaWQ+KChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBvYmogPSB7XG4gICAgICAgICAgICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbk5hbWUsXG4gICAgICAgICAgICAgICAgc2NoZW1hdGljOiBzY2hlbWF0aWNOYW1lLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHNjaGVtYXRpY09wdGlvbnMsXG4gICAgICAgICAgICAgICAgZGVidWc6IGRlYnVnLFxuICAgICAgICAgICAgICAgIGxvZ2dlcjogdGhpcy5sb2dnZXIgYXMgYW55LFxuICAgICAgICAgICAgICAgIGFsbG93UHJpdmF0ZTogdGhpcy5hbGxvd1ByaXZhdGVTY2hlbWF0aWNzLFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgd29ya2Zsb3cuZXhlY3V0ZSh7XG4gICAgICAgICAgICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbk5hbWUsXG4gICAgICAgICAgICAgICAgc2NoZW1hdGljOiBzY2hlbWF0aWNOYW1lLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHNjaGVtYXRpY09wdGlvbnMsXG4gICAgICAgICAgICAgICAgZGVidWc6IGRlYnVnLFxuICAgICAgICAgICAgICAgIGxvZ2dlcjogdGhpcy5sb2dnZXIgYXMgYW55LFxuICAgICAgICAgICAgICAgIGFsbG93UHJpdmF0ZTogdGhpcy5hbGxvd1ByaXZhdGVTY2hlbWF0aWNzLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJbiBjYXNlIHRoZSB3b3JrZmxvdyB3YXMgbm90IHN1Y2Nlc3NmdWwsIHNob3cgYW4gYXBwcm9wcmlhdGUgZXJyb3IgbWVzc2FnZS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBVbnN1Y2Nlc3NmdWxXb3JrZmxvd0V4ZWN1dGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFwiU2VlIGFib3ZlXCIgYmVjYXVzZSB3ZSBhbHJlYWR5IHByaW50ZWQgdGhlIGVycm9yLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmZhdGFsKCdUaGUgU2NoZW1hdGljIHdvcmtmbG93IGZhaWxlZC4gU2VlIGFib3ZlLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkZWJ1Zykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmZhdGFsKGBBbiBlcnJvciBvY2N1cmVkOlxcbiR7ZXJyLm1lc3NhZ2V9XFxuJHtlcnIuc3RhY2t9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmZhdGFsKGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgxKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgY29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNob3dOb3RoaW5nRG9uZSA9ICEob3B0aW9ucy5zaG93Tm90aGluZ0RvbmUgPT09IGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub3RoaW5nRG9uZSAmJiBzaG93Tm90aGluZ0RvbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKCdOb3RoaW5nIHRvIGJlIGRvbmUuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZHJ5UnVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dnZXIud2FybihgXFxuTk9URTogUnVuIHdpdGggXCJkcnkgcnVuXCIgbm8gY2hhbmdlcyB3ZXJlIG1hZGUuYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCByZW1vdmVDb3JlT3B0aW9ucyhvcHRpb25zOiBhbnkpOiBhbnkge1xuICAgICAgICBjb25zdCBvcHRzID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucyk7XG4gICAgICAgIC8qKiAgX19vcmlnaW5hbE9wdGlvbnMgXG4gICAgICAgICAqICBbIHsgbmFtZTogJ2RyeVJ1bicsXG4gICAgICAgICAgICAgICAgdHlwZTogW0Z1bmN0aW9uOiBCb29sZWFuXSxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgICAgICAgICBhbGlhc2VzOiBbICdkJyBdLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUnVuIHRocm91Z2ggd2l0aG91dCBtYWtpbmcgYW55IGNoYW5nZXMuJyBcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgeyBuYW1lOiAnZm9yY2UnLFxuICAgICAgICAgICAgICAgIHR5cGU6IFtGdW5jdGlvbjogQm9vbGVhbl0sXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICAgICAgICAgICAgYWxpYXNlczogWyAnZicgXSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0ZvcmNlcyBvdmVyd3JpdGluZyBvZiBmaWxlcy4nIFxuICAgICAgICAgICAgICB9IF1cbiAgICAgICAgKi9cbiAgICAgICAgLyogICBjb25zb2xlLmxvZygnLS10aGlzLl9fb3JpZ2luYWxPcHRpb25zLS0nLCB0aGlzLl9vcmlnaW5hbE9wdGlvbnMpICovXG4gICAgICAgIGlmICh0aGlzLl9vcmlnaW5hbE9wdGlvbnMuZmluZChvcHRpb24gPT4gb3B0aW9uLm5hbWUgPT0gJ2RyeVJ1bicpKSB7XG4gICAgICAgICAgICBkZWxldGUgb3B0cy5kcnlSdW47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX29yaWdpbmFsT3B0aW9ucy5maW5kKG9wdGlvbiA9PiBvcHRpb24ubmFtZSA9PSAnZm9yY2UnKSkge1xuICAgICAgICAgICAgZGVsZXRlIG9wdHMuZm9yY2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX29yaWdpbmFsT3B0aW9ucy5maW5kKG9wdGlvbiA9PiBvcHRpb24ubmFtZSA9PSAnZGVidWcnKSkge1xuICAgICAgICAgICAgZGVsZXRlIG9wdHMuZGVidWc7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb3B0cztcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgZ2V0T3B0aW9ucyhvcHRpb25zOiBHZXRPcHRpb25zT3B0aW9ucyk6IFByb21pc2U8R2V0T3B0aW9uc1Jlc3VsdD4ge1xuICAgICAgICAvLyBNYWtlIGEgY29weS5cbiAgICAgICAgdGhpcy5fb3JpZ2luYWxPcHRpb25zID0gWy4uLnRoaXMub3B0aW9uc107XG5cbiAgICAgICAgY29uc3QgY29sbGVjdGlvbk5hbWUgPSBvcHRpb25zLmNvbGxlY3Rpb25OYW1lIHx8IGdldERlZmF1bHRTY2hlbWF0aWNDb2xsZWN0aW9uKCk7XG5cbiAgICAgICAgY29uc3QgY29sbGVjdGlvbiA9IGdldENvbGxlY3Rpb24oY29sbGVjdGlvbk5hbWUpO1xuICAgICAgICBjb25zdCBzY2hlbWF0aWMgPSBnZXRTY2hlbWF0aWMoY29sbGVjdGlvbiwgb3B0aW9ucy5zY2hlbWF0aWNOYW1lLCB0aGlzLmFsbG93UHJpdmF0ZVNjaGVtYXRpY3MpO1xuICAgICAgICB0aGlzLl9kZUFsaWFzZWROYW1lID0gc2NoZW1hdGljLmRlc2NyaXB0aW9uLm5hbWU7XG5cbiAgICAgICAgaWYgKCFzY2hlbWF0aWMuZGVzY3JpcHRpb24uc2NoZW1hSnNvbikge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgb3B0aW9uczogW10sXG4gICAgICAgICAgICAgICAgYXJndW1lbnRzOiBbXSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcHJvcGVydGllcyA9IHNjaGVtYXRpYy5kZXNjcmlwdGlvbi5zY2hlbWFKc29uLnByb3BlcnRpZXM7XG4gICAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhwcm9wZXJ0aWVzKTtcbiAgICAgICAgY29uc3QgYXZhaWxhYmxlT3B0aW9ucyA9IGtleXNcbiAgICAgICAgICAgIC5tYXAoa2V5ID0+ICh7IC4uLnByb3BlcnRpZXNba2V5XSwgLi4ueyBuYW1lOiBzdHJpbmdzLmRhc2hlcml6ZShrZXkpIH0gfSkpXG4gICAgICAgICAgICAubWFwKG9wdCA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHR5cGU7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2NoZW1hdGljVHlwZSA9IG9wdC50eXBlO1xuICAgICAgICAgICAgICAgIHN3aXRjaCAob3B0LnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBTdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gQm9vbGVhbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdpbnRlZ2VyJzpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBOdW1iZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAvLyBJZ25vcmUgYXJyYXlzIC8gb2JqZWN0cy5cbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXQgYWxpYXNlczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgICAgICAgICBpZiAob3B0LmFsaWFzKSB7XG4gICAgICAgICAgICAgICAgICAgIGFsaWFzZXMgPSBbLi4uYWxpYXNlcywgb3B0LmFsaWFzXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG9wdC5hbGlhc2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIGFsaWFzZXMgPSBbLi4uYWxpYXNlcywgLi4ub3B0LmFsaWFzZXNdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBzY2hlbWF0aWNEZWZhdWx0ID0gb3B0LmRlZmF1bHQ7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAuLi5vcHQsXG4gICAgICAgICAgICAgICAgICAgIGFsaWFzZXMsXG4gICAgICAgICAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICAgICAgICAgIHNjaGVtYXRpY1R5cGUsXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHVuZGVmaW5lZCwgLy8gZG8gbm90IGNhcnJ5IG92ZXIgc2NoZW1hdGljcyBkZWZhdWx0c1xuICAgICAgICAgICAgICAgICAgICBzY2hlbWF0aWNEZWZhdWx0LFxuICAgICAgICAgICAgICAgICAgICBoaWRkZW46IG9wdC52aXNpYmxlID09PSBmYWxzZSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiB4KTtcblxuICAgICAgICBjb25zdCBzY2hlbWF0aWNPcHRpb25zID0gYXZhaWxhYmxlT3B0aW9uc1xuICAgICAgICAgICAgLmZpbHRlcihvcHQgPT4gb3B0LiRkZWZhdWx0ID09PSB1bmRlZmluZWQgfHwgb3B0LiRkZWZhdWx0LiRzb3VyY2UgIT09ICdhcmd2Jyk7XG5cbiAgICAgICAgY29uc3Qgc2NoZW1hdGljQXJndW1lbnRzID0gYXZhaWxhYmxlT3B0aW9uc1xuICAgICAgICAgICAgLmZpbHRlcihvcHQgPT4gb3B0LiRkZWZhdWx0ICE9PSB1bmRlZmluZWQgJiYgb3B0LiRkZWZhdWx0LiRzb3VyY2UgPT09ICdhcmd2JylcbiAgICAgICAgICAgIC5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGEuJGRlZmF1bHQuaW5kZXggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGIuJGRlZmF1bHQuaW5kZXggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhLiRkZWZhdWx0LmluZGV4ID09IGIuJGRlZmF1bHQuaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhLiRkZWZhdWx0LmluZGV4ID4gYi4kZGVmYXVsdC5pbmRleCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgICAgICBvcHRpb25zOiBzY2hlbWF0aWNPcHRpb25zLFxuICAgICAgICAgICAgYXJndW1lbnRzOiBzY2hlbWF0aWNBcmd1bWVudHMsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2xvYWRXb3Jrc3BhY2UoKSB7XG4gICAgICAgIGlmICh0aGlzLl93b3Jrc3BhY2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB3b3Jrc3BhY2VMb2FkZXIgPSBuZXcgV29ya3NwYWNlTG9hZGVyKHRoaXMuX2hvc3QpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB3b3Jrc3BhY2VMb2FkZXIubG9hZFdvcmtzcGFjZSh0aGlzLnByb2plY3Qucm9vdCkucGlwZSh0YWtlKDEpKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoXG4gICAgICAgICAgICAgICAgICAgICh3b3Jrc3BhY2U6IGV4cGVyaW1lbnRhbC53b3Jrc3BhY2UuV29ya3NwYWNlKSA9PiB0aGlzLl93b3Jrc3BhY2UgPSB3b3Jrc3BhY2UsXG4gICAgICAgICAgICAgICAgICAgIChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuYWxsb3dNaXNzaW5nV29ya3NwYWNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWdub3JlIG1pc3Npbmcgd29ya3NwYWNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuYWxsb3dNaXNzaW5nV29ya3NwYWNlKSB7XG4gICAgICAgICAgICAgICAgLy8gSWdub3JlIG1pc3Npbmcgd29ya3NwYWNlXG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfY2xlYW5EZWZhdWx0czxULCBLIGV4dGVuZHMga2V5b2YgVD4oZGVmYXVsdHM6IFQsIHVuZGVmaW5lZE9wdGlvbnM6IHN0cmluZ1tdKTogVCB7XG4gICAgICAgIChPYmplY3Qua2V5cyhkZWZhdWx0cykgYXMgS1tdKVxuICAgICAgICAgICAgLmZpbHRlcihrZXkgPT4gIXVuZGVmaW5lZE9wdGlvbnMubWFwKHN0cmluZ3MuY2FtZWxpemUpLmluY2x1ZGVzKGtleSBhcyBhbnkpKVxuICAgICAgICAgICAgLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgICAgICAgICBkZWxldGUgZGVmYXVsdHNba2V5XTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBkZWZhdWx0cztcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlYWREZWZhdWx0cyhjb2xsZWN0aW9uTmFtZTogc3RyaW5nLCBzY2hlbWF0aWNOYW1lOiBzdHJpbmcsIG9wdGlvbnM6IGFueSk6IHt9IHtcbiAgICAgICAgaWYgKHRoaXMuX2RlQWxpYXNlZE5hbWUpIHtcbiAgICAgICAgICAgIHNjaGVtYXRpY05hbWUgPSB0aGlzLl9kZUFsaWFzZWROYW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcHJvamVjdE5hbWUgPSBvcHRpb25zLnByb2plY3Q7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRzID0gZ2V0U2NoZW1hdGljRGVmYXVsdHMoY29sbGVjdGlvbk5hbWUsIHNjaGVtYXRpY05hbWUsIHByb2plY3ROYW1lKTtcblxuICAgICAgICAvLyBHZXQgbGlzdCBvZiBhbGwgdW5kZWZpbmVkIG9wdGlvbnMuXG4gICAgICAgIGNvbnN0IHVuZGVmaW5lZE9wdGlvbnMgPSB0aGlzLm9wdGlvbnNcbiAgICAgICAgICAgIC5maWx0ZXIobyA9PiBvcHRpb25zW28ubmFtZV0gPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIC5tYXAobyA9PiBvLm5hbWUpO1xuXG4gICAgICAgIC8vIERlbGV0ZSBhbnkgZGVmYXVsdCB0aGF0IGlzIG5vdCB1bmRlZmluZWQuXG4gICAgICAgIHRoaXMuX2NsZWFuRGVmYXVsdHMoZGVmYXVsdHMsIHVuZGVmaW5lZE9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiBkZWZhdWx0cztcbiAgICB9XG59XG4iXX0=