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
        console.log('--schematicOptions--', schematicOptions);
        let nothingDone = true;
        let loggingQueue = [];
        let error = false;
        /**  fsHost =
         *  {
           _delegate: NodeJsSyncHost {},
          _root: '/Users/bobo/Work/test/my1' }
          console.log('--fsHost--', fsHost)
         */
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
        console.log('--pathOptions--', pathOptions);
        // schematicOptions = { _: [ 'bobo4'], skipImport: true, path: '/src' }
        schematicOptions = Object.assign({}, schematicOptions, pathOptions);
        const defaultOptions = this.readDefaults(collectionName, schematicName, schematicOptions);
        console.log('--defaultOptions--', defaultOptions);
        schematicOptions = Object.assign({}, schematicOptions, defaultOptions);
        console.log('--schematicOptions--', schematicOptions);
        // Pass the rest of the arguments as the smart default "argv". Then delete it.
        // Removing the first item which is the schematic name.
        // eg. rawArgs = [ 'bobo4']
        const rawArgs = schematicOptions._;
        workflow.registry.addSmartDefaultProvider('argv', (schema) => {
            // schema = { '$source': 'argv', index: 0 }
            console.log('--schema--', schema);
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
            console.log('--_schema--', _schema);
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
                console.log('--this._workspace.getProjectByPath(normalize(process.cwd()))--', this._workspace.getProjectByPath(core_1.normalize(process.cwd())));
                console.log('--this._workspace.getDefaultProjectName()--', this._workspace.getDefaultProjectName());
                return this._workspace.getProjectByPath(core_1.normalize(process.cwd()))
                    || this._workspace.getDefaultProjectName();
            }
            return undefined;
        });
        console.log('-----------++--------------workflow-----++++++++++++++++++++--');
        workflow.reporter.subscribe((event) => {
            nothingDone = false;
            console.log('---------in reporter----');
            // Strip leading slash to prevent confusion.
            const eventPath = event.path.startsWith('/') ? event.path.substr(1) : event.path; // src/bobo10.pipe.ts
            console.log('--eventPath--', eventPath);
            console.log('--event--', event); // { kind: 'create',path: '/src/bobo10.pipe.ts',content: Buffer……}
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
            console.log('---------in lifeCycle----');
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
            console.log('--exec--', obj);
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
                    console.log('++++exec+ error++++', err);
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
                    console.log('++++exec+ complete++++');
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
        console.log('--+++-collection------', collection);
        const schematic = schematics_2.getSchematic(collection, options.schematicName, this.allowPrivateSchematics);
        console.log('--+++-schematic------', schematic);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hdGljLWNvbW1hbmQuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbImNvbW1hbmRzL3NjaGVtYXRpYy1jb21tYW5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFFQSwrQ0FBcUY7QUFDckYsb0RBQTJEO0FBQzNELDJEQUF3RjtBQUN4Riw0REFBZ0U7QUFDaEUsOENBQXNDO0FBQ3RDLDhEQUEwRDtBQUMxRCwyQ0FBa0Y7QUFDbEYsMkNBQXNEO0FBQ3RELGtEQUFnRTtBQUNoRSx1Q0FBOEQ7QUEyQjlELHNCQUF1QyxTQUFRLGlCQUFPO0lBQXREOztRQUNhLFlBQU8sR0FBYSxFQUFFLENBQUM7UUFDdkIsMkJBQXNCLEdBQVksS0FBSyxDQUFDO1FBQ3pDLFVBQUssR0FBRyxJQUFJLHFCQUFjLEVBQUUsQ0FBQztRQUlyQyxnQkFBVyxHQUFHLDBCQUFnQixDQUFDLE9BQU8sQ0FBQztRQUVwQixnQkFBVyxHQUFhO1lBQ3ZDO2dCQUNJLElBQUksRUFBRSxRQUFRO2dCQUNkLElBQUksRUFBRSxPQUFPO2dCQUNiLE9BQU8sRUFBRSxLQUFLO2dCQUNkLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQztnQkFDZCxXQUFXLEVBQUUseUNBQXlDO2FBQ3pEO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLE9BQU87Z0JBQ2IsSUFBSSxFQUFFLE9BQU87Z0JBQ2IsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDO2dCQUNkLFdBQVcsRUFBRSw4QkFBOEI7YUFDOUM7U0FBQyxDQUFDO1FBRUUsY0FBUyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7SUFtWXJDLENBQUM7SUFqWWdCLFVBQVUsQ0FBQyxRQUFhOztZQUNqQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDMUIsQ0FBQztLQUFBO0lBRUQsdURBQXVEO0lBQzdDLGNBQWMsQ0FBQyxPQUFZLEVBQUUsVUFBa0I7UUFDckQsSUFBSSxVQUFVLEtBQUssRUFBRSxF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QUFDLEtBQUssU0FBUyxDQUFDO2FBQzFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV0Qiw0Q0FBNEM7UUFDNUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUVoRCxPQUFPLFFBQVEsQ0FBQztJQUNwQixDQUFDO0NBQ0o7QUE1WkQsNENBNFpDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gdHNsaW50OmRpc2FibGU6bm8tZ2xvYmFsLXRzbGludC1kaXNhYmxlIG5vLWFueSBmaWxlLWhlYWRlclxuaW1wb3J0IHsgSnNvbk9iamVjdCwgZXhwZXJpbWVudGFsIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgbm9ybWFsaXplLCBzdHJpbmdzLCB0YWdzLCB0ZXJtaW5hbCwgdmlydHVhbEZzIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgTm9kZUpzU3luY0hvc3QgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZS9ub2RlJztcbmltcG9ydCB7IERyeVJ1bkV2ZW50LCBVbnN1Y2Nlc3NmdWxXb3JrZmxvd0V4ZWN1dGlvbiB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7IE5vZGVXb3JrZmxvdyB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzL3Rvb2xzJztcbmltcG9ydCB7IHRha2UgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBXb3Jrc3BhY2VMb2FkZXIgfSBmcm9tICcuLi9saWIvd29ya3NwYWNlLWxvYWRlcic7XG5pbXBvcnQgeyBnZXREZWZhdWx0U2NoZW1hdGljQ29sbGVjdGlvbiwgZ2V0UGFja2FnZU1hbmFnZXIgfSBmcm9tICcuLi91dGlsL2NvbmZpZyc7XG5pbXBvcnQgeyBnZXRTY2hlbWF0aWNEZWZhdWx0cyB9IGZyb20gJy4uL3V0aWwvY29uZmlnJztcbmltcG9ydCB7IGdldENvbGxlY3Rpb24sIGdldFNjaGVtYXRpYyB9IGZyb20gJy4uL2xpYi9zY2hlbWF0aWNzJztcbmltcG9ydCB7IEFyZ3VtZW50U3RyYXRlZ3ksIENvbW1hbmQsIE9wdGlvbiB9IGZyb20gJy4vY29tbWFuZCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29yZVNjaGVtYXRpY09wdGlvbnMge1xuICAgIGRyeVJ1bjogYm9vbGVhbjtcbiAgICBmb3JjZTogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSdW5TY2hlbWF0aWNPcHRpb25zIHtcbiAgICBjb2xsZWN0aW9uTmFtZTogc3RyaW5nO1xuICAgIHNjaGVtYXRpY05hbWU6IHN0cmluZztcbiAgICBzY2hlbWF0aWNPcHRpb25zOiBhbnk7XG4gICAgZGVidWc/OiBib29sZWFuO1xuICAgIGRyeVJ1bjogYm9vbGVhbjtcbiAgICBmb3JjZTogYm9vbGVhbjtcbiAgICBzaG93Tm90aGluZ0RvbmU/OiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEdldE9wdGlvbnNPcHRpb25zIHtcbiAgICBjb2xsZWN0aW9uTmFtZTogc3RyaW5nO1xuICAgIHNjaGVtYXRpY05hbWU6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBHZXRPcHRpb25zUmVzdWx0IHtcbiAgICBvcHRpb25zOiBPcHRpb25bXTtcbiAgICBhcmd1bWVudHM6IE9wdGlvbltdO1xufVxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgU2NoZW1hdGljQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICAgIHJlYWRvbmx5IG9wdGlvbnM6IE9wdGlvbltdID0gW107XG4gICAgcmVhZG9ubHkgYWxsb3dQcml2YXRlU2NoZW1hdGljczogYm9vbGVhbiA9IGZhbHNlO1xuICAgIHByaXZhdGUgX2hvc3QgPSBuZXcgTm9kZUpzU3luY0hvc3QoKTtcbiAgICBwcml2YXRlIF93b3Jrc3BhY2U6IGV4cGVyaW1lbnRhbC53b3Jrc3BhY2UuV29ya3NwYWNlO1xuICAgIHByaXZhdGUgX2RlQWxpYXNlZE5hbWU6IHN0cmluZztcbiAgICBwcml2YXRlIF9vcmlnaW5hbE9wdGlvbnM6IE9wdGlvbltdO1xuICAgIGFyZ1N0cmF0ZWd5ID0gQXJndW1lbnRTdHJhdGVneS5Ob3RoaW5nO1xuXG4gICAgcHJvdGVjdGVkIHJlYWRvbmx5IGNvcmVPcHRpb25zOiBPcHRpb25bXSA9IFtcbiAgICAgICAge1xuICAgICAgICAgICAgbmFtZTogJ2RyeVJ1bicsXG4gICAgICAgICAgICB0eXBlOiBCb29sZWFuLFxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICAgICAgICBhbGlhc2VzOiBbJ2QnXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUnVuIHRocm91Z2ggd2l0aG91dCBtYWtpbmcgYW55IGNoYW5nZXMuJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbmFtZTogJ2ZvcmNlJyxcbiAgICAgICAgICAgIHR5cGU6IEJvb2xlYW4sXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgICAgIGFsaWFzZXM6IFsnZiddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdGb3JjZXMgb3ZlcndyaXRpbmcgb2YgZmlsZXMuJyxcbiAgICAgICAgfV07XG5cbiAgICByZWFkb25seSBhcmd1bWVudHMgPSBbJ3Byb2plY3QnXTtcblxuICAgIHB1YmxpYyBhc3luYyBpbml0aWFsaXplKF9vcHRpb25zOiBhbnkpIHtcbiAgICAgICAgdGhpcy5fbG9hZFdvcmtzcGFjZSgpO1xuICAgIH1cblxuICAgIC8vIHBhcmFtczogeyBfOiBbICdib2JvMScgXSwgc2tpcEltcG9ydDogdHJ1ZSB9LCAnL3NyYydcbiAgICBwcm90ZWN0ZWQgc2V0UGF0aE9wdGlvbnMob3B0aW9uczogYW55LCB3b3JraW5nRGlyOiBzdHJpbmcpOiBhbnkge1xuICAgICAgICBpZiAod29ya2luZ0RpciA9PT0gJycpIHtcbiAgICAgICAgICAgIHJldHVybiB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnNcbiAgICAgICAgICAgIC5maWx0ZXIobyA9PiBvLmZvcm1hdCA9PT0gJ3BhdGgnKVxuICAgICAgICAgICAgLm1hcChvID0+IG8ubmFtZSlcbiAgICAgICAgICAgIC5maWx0ZXIobmFtZSA9PiBvcHRpb25zW25hbWVdID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICAucmVkdWNlKChhY2M6IGFueSwgY3VycikgPT4ge1xuICAgICAgICAgICAgICAgIGFjY1tjdXJyXSA9IHdvcmtpbmdEaXI7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICAgICAgfSwge30pO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBydW5TY2hlbWF0aWMob3B0aW9uczogUnVuU2NoZW1hdGljT3B0aW9ucykge1xuICAgICAgICAvKiogICAgXG4gICAgICAgICAqIOS7juS8oOWFpeeahOmFjee9rumhuSBvcHRpb25zXG4gICAgICAgICAqIG9wdGlvbnMgPSB7IF86IFsgJ2JvYm8zJyBdLCBkcnlSdW46IGZhbHNlLCBmb3JjZTogZmFsc2UsIHNraXBJbXBvcnQ6IHRydWUgfVxuICAgICAgICAgICAgIC0tLXJ1blNjaGVtYXRpYyBvcHRpb25zLS0geyBjb2xsZWN0aW9uTmFtZTogJ0BzY2hlbWF0aWNzL2FuZ3VsYXInLFxuICAgICAgICAgICAgc2NoZW1hdGljTmFtZTogJ3BpcGUnLFxuICAgICAgICAgICAgc2NoZW1hdGljT3B0aW9uczogeyBfOiBbICdib2JvMycgXSwgZHJ5UnVuOiBmYWxzZSwgZm9yY2U6IGZhbHNlLCBza2lwSW1wb3J0OiB0cnVlIH0sXG4gICAgICAgICAgICBkZWJ1ZzogdW5kZWZpbmVkLFxuICAgICAgICAgICAgZHJ5UnVuOiBmYWxzZSxcbiAgICAgICAgICAgIGZvcmNlOiBmYWxzZSB9XG4gICAgICAgICAqL1xuICAgICAgICAvKiAgICAgY29uc29sZS5sb2coJy0tLXJ1blNjaGVtYXRpYyBvcHRpb25zLS0nLCBvcHRpb25zKTtcbiAgICAgICAgICovXG4gICAgICAgIGNvbnN0IHsgY29sbGVjdGlvbk5hbWUsIHNjaGVtYXRpY05hbWUsIGRlYnVnLCBmb3JjZSwgZHJ5UnVuIH0gPSBvcHRpb25zO1xuICAgICAgICAvKiogIFxuICAgICAgICAgKiDnp7vpmaRzY2hlbWF0aWNPcHRpb25z5LitIOeahOWOn+Wni29wdGlvbnPph4zpnaLnmoTlj4LmlbBcbiAgICAgICAgICogPT0+c2NoZW1hdGljT3B0aW9uczp7IF86IFsgJ2JvYm8xJyBdLCBza2lwSW1wb3J0OiB0cnVlIH1cbiAgICAgICAgICogIGNvbnNvbGUubG9nKCctLXNjaGVtYXRpY09wdGlvbnMtLScsIHNjaGVtYXRpY09wdGlvbnMpXG4gICAgICAgICovXG4gICAgICAgIGxldCBzY2hlbWF0aWNPcHRpb25zID0gdGhpcy5yZW1vdmVDb3JlT3B0aW9ucyhvcHRpb25zLnNjaGVtYXRpY09wdGlvbnMpO1xuICAgICAgICBjb25zb2xlLmxvZygnLS1zY2hlbWF0aWNPcHRpb25zLS0nLCBzY2hlbWF0aWNPcHRpb25zKVxuICAgICAgICBsZXQgbm90aGluZ0RvbmUgPSB0cnVlO1xuICAgICAgICBsZXQgbG9nZ2luZ1F1ZXVlOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBsZXQgZXJyb3IgPSBmYWxzZTtcbiAgICAgICAgLyoqICBmc0hvc3QgPSBcbiAgICAgICAgICogIHtcbiAgICAgICAgICAgX2RlbGVnYXRlOiBOb2RlSnNTeW5jSG9zdCB7fSxcbiAgICAgICAgICBfcm9vdDogJy9Vc2Vycy9ib2JvL1dvcmsvdGVzdC9teTEnIH1cbiAgICAgICAgICBjb25zb2xlLmxvZygnLS1mc0hvc3QtLScsIGZzSG9zdClcbiAgICAgICAgICovXG4gICAgICAgIGNvbnN0IGZzSG9zdCA9IG5ldyB2aXJ0dWFsRnMuU2NvcGVkSG9zdChuZXcgTm9kZUpzU3luY0hvc3QoKSwgbm9ybWFsaXplKHRoaXMucHJvamVjdC5yb290KSk7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiAg5a6e5L6L5YyW5LiA5Liq5bel5L2c5rWBXG4gICAgICAgICAqL1xuICAgICAgICBjb25zdCB3b3JrZmxvdyA9IG5ldyBOb2RlV29ya2Zsb3coXG4gICAgICAgICAgICBmc0hvc3QgYXMgYW55LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGZvcmNlLFxuICAgICAgICAgICAgICAgIGRyeVJ1bixcbiAgICAgICAgICAgICAgICBwYWNrYWdlTWFuYWdlcjogZ2V0UGFja2FnZU1hbmFnZXIoKSwgLy8g5YyF566h55CG5bel5YW3IG5wbXx8IGNucG0gfHwgeWFyblxuICAgICAgICAgICAgICAgIHJvb3Q6IHRoaXMucHJvamVjdC5yb290XG4gICAgICAgICAgICB9LFxuICAgICAgICApO1xuICAgICAgICAvLyDojrflj5blvZPliY3lt6XkvZznm67lvZXnmoTnu53lr7not6/lvoQgIGVnLiAvc3JjICAgcHJvY2Vzcy5jd2QoKSA9PT4gbm9kZS5qc+i/m+eoi+W9k+WJjeW3peS9nOeahOebruW9lVxuICAgICAgICBjb25zdCB3b3JraW5nRGlyID0gcHJvY2Vzcy5jd2QoKS5yZXBsYWNlKHRoaXMucHJvamVjdC5yb290LCAnJykucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuICAgICAgICAvLyB7IHBhdGg6ICcvc3JjJyB9IHRoaXMuc2V0UGF0aE9wdGlvbnMoeyBfOiBbICdib2JvMScgXSwgc2tpcEltcG9ydDogdHJ1ZSB9LCAnL3NyYycpXG4gICAgICAgIGNvbnN0IHBhdGhPcHRpb25zID0gdGhpcy5zZXRQYXRoT3B0aW9ucyhzY2hlbWF0aWNPcHRpb25zLCB3b3JraW5nRGlyKTtcbiAgICAgICAgY29uc29sZS5sb2coJy0tcGF0aE9wdGlvbnMtLScsIHBhdGhPcHRpb25zKTtcblxuICAgICAgICAvLyBzY2hlbWF0aWNPcHRpb25zID0geyBfOiBbICdib2JvNCddLCBza2lwSW1wb3J0OiB0cnVlLCBwYXRoOiAnL3NyYycgfVxuICAgICAgICBzY2hlbWF0aWNPcHRpb25zID0geyAuLi5zY2hlbWF0aWNPcHRpb25zLCAuLi5wYXRoT3B0aW9ucyB9O1xuICAgICAgICBjb25zdCBkZWZhdWx0T3B0aW9ucyA9IHRoaXMucmVhZERlZmF1bHRzKGNvbGxlY3Rpb25OYW1lLCBzY2hlbWF0aWNOYW1lLCBzY2hlbWF0aWNPcHRpb25zKTtcbiAgICAgICAgY29uc29sZS5sb2coJy0tZGVmYXVsdE9wdGlvbnMtLScsIGRlZmF1bHRPcHRpb25zKVxuICAgICAgICBzY2hlbWF0aWNPcHRpb25zID0geyAuLi5zY2hlbWF0aWNPcHRpb25zLCAuLi5kZWZhdWx0T3B0aW9ucyB9O1xuXG4gICAgICAgIGNvbnNvbGUubG9nKCctLXNjaGVtYXRpY09wdGlvbnMtLScsIHNjaGVtYXRpY09wdGlvbnMpXG4gICAgICAgIC8vIFBhc3MgdGhlIHJlc3Qgb2YgdGhlIGFyZ3VtZW50cyBhcyB0aGUgc21hcnQgZGVmYXVsdCBcImFyZ3ZcIi4gVGhlbiBkZWxldGUgaXQuXG4gICAgICAgIC8vIFJlbW92aW5nIHRoZSBmaXJzdCBpdGVtIHdoaWNoIGlzIHRoZSBzY2hlbWF0aWMgbmFtZS5cbiAgICAgICAgLy8gZWcuIHJhd0FyZ3MgPSBbICdib2JvNCddXG4gICAgICAgIGNvbnN0IHJhd0FyZ3MgPSBzY2hlbWF0aWNPcHRpb25zLl87XG4gICAgICAgIHdvcmtmbG93LnJlZ2lzdHJ5LmFkZFNtYXJ0RGVmYXVsdFByb3ZpZGVyKCdhcmd2JywgKHNjaGVtYTogSnNvbk9iamVjdCkgPT4ge1xuICAgICAgICAgICAgLy8gc2NoZW1hID0geyAnJHNvdXJjZSc6ICdhcmd2JywgaW5kZXg6IDAgfVxuICAgICAgICAgICAgY29uc29sZS5sb2coJy0tc2NoZW1hLS0nLCBzY2hlbWEpXG4gICAgICAgICAgICBpZiAoJ2luZGV4JyBpbiBzY2hlbWEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmF3QXJnc1tOdW1iZXIoc2NoZW1hWydpbmRleCddKV07IC8vICdib2JvNCcgLS1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJhd0FyZ3M7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBkZWxldGUgc2NoZW1hdGljT3B0aW9ucy5fO1xuXG4gICAgICAgIHdvcmtmbG93LnJlZ2lzdHJ5LmFkZFNtYXJ0RGVmYXVsdFByb3ZpZGVyKCdwcm9qZWN0TmFtZScsIChfc2NoZW1hOiBKc29uT2JqZWN0KSA9PiB7XG4gICAgICAgICAgICAvLyAgX3NjaGVtYSA9IHsgJyRzb3VyY2UnOiAncHJvamVjdE5hbWUnIH1cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCctLV9zY2hlbWEtLScsIF9zY2hlbWEpXG4gICAgICAgICAgICAvKiAgIHRoaXMuX3dvcmtzcGFjZSA9ICB7ICckc2NoZW1hJzogJy4vbm9kZV9tb2R1bGVzL0Bhbmd1bGFyL2NsaS9saWIvY29uZmlnL3NjaGVtYS5qc29uJyxcbiAgICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiAxLFxuICAgICAgICAgICAgICAgICAgICAgIG5ld1Byb2plY3RSb290OiAncHJvamVjdHMnLFxuICAgICAgICAgICAgICAgICAgICAgIHByb2plY3RzOiB7IG15MTogW09iamVjdF0sICdteTEtZTJlJzogW09iamVjdF0gfSxcbiAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0UHJvamVjdDogJ215MScsXG4gICAgICAgICAgICAgICAgICAgICAgY2xpOiB7IH0sXG4gICAgICAgICAgICAgICAgICAgICAgc2NoZW1hdGljczogeyB9LFxuICAgICAgICAgICAgICAgICAgICAgIGFyY2hpdGVjdDogeyB9XG4gICAgICAgICAgICAgICAgICB9IH0gXG4gICAgICAgICAgICAqL1xuICAgICAgICAgICAgLyogIGNvbnNvbGUubG9nKCctLXRoaXMuX3dvcmtzcGFjZS5wcm9qZWN0cy0tJywgKHRoaXMuX3dvcmtzcGFjZSBhcyBhbnkpLnByb2plY3RzKSAqL1xuICAgICAgICAgICAgaWYgKHRoaXMuX3dvcmtzcGFjZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCctLXRoaXMuX3dvcmtzcGFjZS5nZXRQcm9qZWN0QnlQYXRoKG5vcm1hbGl6ZShwcm9jZXNzLmN3ZCgpKSktLScsIHRoaXMuX3dvcmtzcGFjZS5nZXRQcm9qZWN0QnlQYXRoKG5vcm1hbGl6ZShwcm9jZXNzLmN3ZCgpKSkpXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJy0tdGhpcy5fd29ya3NwYWNlLmdldERlZmF1bHRQcm9qZWN0TmFtZSgpLS0nLCB0aGlzLl93b3Jrc3BhY2UuZ2V0RGVmYXVsdFByb2plY3ROYW1lKCkpXG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fd29ya3NwYWNlLmdldFByb2plY3RCeVBhdGgobm9ybWFsaXplKHByb2Nlc3MuY3dkKCkpKVxuICAgICAgICAgICAgICAgICAgICB8fCB0aGlzLl93b3Jrc3BhY2UuZ2V0RGVmYXVsdFByb2plY3ROYW1lKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5sb2coJy0tLS0tLS0tLS0tKystLS0tLS0tLS0tLS0tLXdvcmtmbG93LS0tLS0rKysrKysrKysrKysrKysrKysrKy0tJylcbiAgICAgICAgd29ya2Zsb3cucmVwb3J0ZXIuc3Vic2NyaWJlKChldmVudDogRHJ5UnVuRXZlbnQpID0+IHtcbiAgICAgICAgICAgIG5vdGhpbmdEb25lID0gZmFsc2U7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnLS0tLS0tLS0taW4gcmVwb3J0ZXItLS0tJylcbiAgICAgICAgICAgIC8vIFN0cmlwIGxlYWRpbmcgc2xhc2ggdG8gcHJldmVudCBjb25mdXNpb24uXG4gICAgICAgICAgICBjb25zdCBldmVudFBhdGggPSBldmVudC5wYXRoLnN0YXJ0c1dpdGgoJy8nKSA/IGV2ZW50LnBhdGguc3Vic3RyKDEpIDogZXZlbnQucGF0aDsgLy8gc3JjL2JvYm8xMC5waXBlLnRzXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnLS1ldmVudFBhdGgtLScsIGV2ZW50UGF0aClcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCctLWV2ZW50LS0nLCBldmVudCkgLy8geyBraW5kOiAnY3JlYXRlJyxwYXRoOiAnL3NyYy9ib2JvMTAucGlwZS50cycsY29udGVudDogQnVmZmVy4oCm4oCmfVxuICAgICAgICAgICAgc3dpdGNoIChldmVudC5raW5kKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnZXJyb3InOlxuICAgICAgICAgICAgICAgICAgICBlcnJvciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRlc2MgPSBldmVudC5kZXNjcmlwdGlvbiA9PSAnYWxyZWFkeUV4aXN0JyA/ICdhbHJlYWR5IGV4aXN0cycgOiAnZG9lcyBub3QgZXhpc3QuJztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dnZXIud2FybihgRVJST1IhICR7ZXZlbnRQYXRofSAke2Rlc2N9LmApO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICd1cGRhdGUnOlxuICAgICAgICAgICAgICAgICAgICBsb2dnaW5nUXVldWUucHVzaCh0YWdzLm9uZUxpbmVgXG4gICAgICAgICAgICAke3Rlcm1pbmFsLndoaXRlKCdVUERBVEUnKX0gJHtldmVudFBhdGh9ICgke2V2ZW50LmNvbnRlbnQubGVuZ3RofSBieXRlcylcbiAgICAgICAgICBgKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnY3JlYXRlJzpcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2luZ1F1ZXVlLnB1c2godGFncy5vbmVMaW5lYFxuICAgICAgICAgICAgJHt0ZXJtaW5hbC5ncmVlbignQ1JFQVRFJyl9ICR7ZXZlbnRQYXRofSAoJHtldmVudC5jb250ZW50Lmxlbmd0aH0gYnl0ZXMpXG4gICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2RlbGV0ZSc6XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dpbmdRdWV1ZS5wdXNoKGAke3Rlcm1pbmFsLnllbGxvdygnREVMRVRFJyl9ICR7ZXZlbnRQYXRofWApO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdyZW5hbWUnOlxuICAgICAgICAgICAgICAgICAgICBsb2dnaW5nUXVldWUucHVzaChgJHt0ZXJtaW5hbC5ibHVlKCdSRU5BTUUnKX0gJHtldmVudFBhdGh9ID0+ICR7ZXZlbnQudG99YCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB3b3JrZmxvdy5saWZlQ3ljbGUuc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCctLS0tLS0tLS1pbiBsaWZlQ3ljbGUtLS0tJylcbiAgICAgICAgICAgIGlmIChldmVudC5raW5kID09ICdlbmQnIHx8IGV2ZW50LmtpbmQgPT0gJ3Bvc3QtdGFza3Mtc3RhcnQnKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAvLyBPdXRwdXQgdGhlIGxvZ2dpbmcgcXVldWUsIG5vIGVycm9yIGhhcHBlbmVkLlxuICAgICAgICAgICAgICAgICAgICBsb2dnaW5nUXVldWUuZm9yRWFjaChsb2cgPT4gdGhpcy5sb2dnZXIuaW5mbyhsb2cpKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBsb2dnaW5nUXVldWUgPSBbXTtcbiAgICAgICAgICAgICAgICBlcnJvciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8bnVtYmVyIHwgdm9pZD4oKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG9iaiA9IHtcbiAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uTmFtZSxcbiAgICAgICAgICAgICAgICBzY2hlbWF0aWM6IHNjaGVtYXRpY05hbWUsXG4gICAgICAgICAgICAgICAgb3B0aW9uczogc2NoZW1hdGljT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBkZWJ1ZzogZGVidWcsXG4gICAgICAgICAgICAgICAgbG9nZ2VyOiB0aGlzLmxvZ2dlciBhcyBhbnksXG4gICAgICAgICAgICAgICAgYWxsb3dQcml2YXRlOiB0aGlzLmFsbG93UHJpdmF0ZVNjaGVtYXRpY3MsXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnLS1leGVjLS0nLCBvYmopXG4gICAgICAgICAgICB3b3JrZmxvdy5leGVjdXRlKHtcbiAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uTmFtZSxcbiAgICAgICAgICAgICAgICBzY2hlbWF0aWM6IHNjaGVtYXRpY05hbWUsXG4gICAgICAgICAgICAgICAgb3B0aW9uczogc2NoZW1hdGljT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBkZWJ1ZzogZGVidWcsXG4gICAgICAgICAgICAgICAgbG9nZ2VyOiB0aGlzLmxvZ2dlciBhcyBhbnksXG4gICAgICAgICAgICAgICAgYWxsb3dQcml2YXRlOiB0aGlzLmFsbG93UHJpdmF0ZVNjaGVtYXRpY3MsXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoe1xuICAgICAgICAgICAgICAgICAgICBlcnJvcjogKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCcrKysrZXhlYysgZXJyb3IrKysrJywgZXJyKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJbiBjYXNlIHRoZSB3b3JrZmxvdyB3YXMgbm90IHN1Y2Nlc3NmdWwsIHNob3cgYW4gYXBwcm9wcmlhdGUgZXJyb3IgbWVzc2FnZS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBVbnN1Y2Nlc3NmdWxXb3JrZmxvd0V4ZWN1dGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFwiU2VlIGFib3ZlXCIgYmVjYXVzZSB3ZSBhbHJlYWR5IHByaW50ZWQgdGhlIGVycm9yLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmZhdGFsKCdUaGUgU2NoZW1hdGljIHdvcmtmbG93IGZhaWxlZC4gU2VlIGFib3ZlLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkZWJ1Zykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmZhdGFsKGBBbiBlcnJvciBvY2N1cmVkOlxcbiR7ZXJyLm1lc3NhZ2V9XFxuJHtlcnIuc3RhY2t9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmZhdGFsKGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgxKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgY29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCcrKysrZXhlYysgY29tcGxldGUrKysrJylcblxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2hvd05vdGhpbmdEb25lID0gIShvcHRpb25zLnNob3dOb3RoaW5nRG9uZSA9PT0gZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5vdGhpbmdEb25lICYmIHNob3dOb3RoaW5nRG9uZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmluZm8oJ05vdGhpbmcgdG8gYmUgZG9uZS4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkcnlSdW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGBcXG5OT1RFOiBSdW4gd2l0aCBcImRyeSBydW5cIiBubyBjaGFuZ2VzIHdlcmUgbWFkZS5gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHJlbW92ZUNvcmVPcHRpb25zKG9wdGlvbnM6IGFueSk6IGFueSB7XG4gICAgICAgIGNvbnN0IG9wdHMgPSBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zKTtcbiAgICAgICAgLyoqICBfX29yaWdpbmFsT3B0aW9ucyBcbiAgICAgICAgICogIFsgeyBuYW1lOiAnZHJ5UnVuJyxcbiAgICAgICAgICAgICAgICB0eXBlOiBbRnVuY3Rpb246IEJvb2xlYW5dLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGFsaWFzZXM6IFsgJ2QnIF0sXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdSdW4gdGhyb3VnaCB3aXRob3V0IG1ha2luZyBhbnkgY2hhbmdlcy4nIFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7IG5hbWU6ICdmb3JjZScsXG4gICAgICAgICAgICAgICAgdHlwZTogW0Z1bmN0aW9uOiBCb29sZWFuXSxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgICAgICAgICBhbGlhc2VzOiBbICdmJyBdLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRm9yY2VzIG92ZXJ3cml0aW5nIG9mIGZpbGVzLicgXG4gICAgICAgICAgICAgIH0gXVxuICAgICAgICAqL1xuICAgICAgICAvKiAgIGNvbnNvbGUubG9nKCctLXRoaXMuX19vcmlnaW5hbE9wdGlvbnMtLScsIHRoaXMuX29yaWdpbmFsT3B0aW9ucykgKi9cbiAgICAgICAgaWYgKHRoaXMuX29yaWdpbmFsT3B0aW9ucy5maW5kKG9wdGlvbiA9PiBvcHRpb24ubmFtZSA9PSAnZHJ5UnVuJykpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBvcHRzLmRyeVJ1bjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fb3JpZ2luYWxPcHRpb25zLmZpbmQob3B0aW9uID0+IG9wdGlvbi5uYW1lID09ICdmb3JjZScpKSB7XG4gICAgICAgICAgICBkZWxldGUgb3B0cy5mb3JjZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fb3JpZ2luYWxPcHRpb25zLmZpbmQob3B0aW9uID0+IG9wdGlvbi5uYW1lID09ICdkZWJ1ZycpKSB7XG4gICAgICAgICAgICBkZWxldGUgb3B0cy5kZWJ1ZztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvcHRzO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBnZXRPcHRpb25zKG9wdGlvbnM6IEdldE9wdGlvbnNPcHRpb25zKTogUHJvbWlzZTxHZXRPcHRpb25zUmVzdWx0PiB7XG4gICAgICAgIC8vIE1ha2UgYSBjb3B5LlxuICAgICAgICB0aGlzLl9vcmlnaW5hbE9wdGlvbnMgPSBbLi4udGhpcy5vcHRpb25zXTtcblxuICAgICAgICBjb25zdCBjb2xsZWN0aW9uTmFtZSA9IG9wdGlvbnMuY29sbGVjdGlvbk5hbWUgfHwgZ2V0RGVmYXVsdFNjaGVtYXRpY0NvbGxlY3Rpb24oKTtcblxuICAgICAgICBjb25zdCBjb2xsZWN0aW9uID0gZ2V0Q29sbGVjdGlvbihjb2xsZWN0aW9uTmFtZSk7XG4gICAgICAgIGNvbnNvbGUubG9nKCctLSsrKy1jb2xsZWN0aW9uLS0tLS0tJywgY29sbGVjdGlvbilcbiAgICAgICAgY29uc3Qgc2NoZW1hdGljID0gZ2V0U2NoZW1hdGljKGNvbGxlY3Rpb24sIG9wdGlvbnMuc2NoZW1hdGljTmFtZSwgdGhpcy5hbGxvd1ByaXZhdGVTY2hlbWF0aWNzKTtcbiAgICAgICAgY29uc29sZS5sb2coJy0tKysrLXNjaGVtYXRpYy0tLS0tLScsIHNjaGVtYXRpYylcblxuICAgICAgICB0aGlzLl9kZUFsaWFzZWROYW1lID0gc2NoZW1hdGljLmRlc2NyaXB0aW9uLm5hbWU7XG5cbiAgICAgICAgaWYgKCFzY2hlbWF0aWMuZGVzY3JpcHRpb24uc2NoZW1hSnNvbikge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgb3B0aW9uczogW10sXG4gICAgICAgICAgICAgICAgYXJndW1lbnRzOiBbXSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcHJvcGVydGllcyA9IHNjaGVtYXRpYy5kZXNjcmlwdGlvbi5zY2hlbWFKc29uLnByb3BlcnRpZXM7XG4gICAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhwcm9wZXJ0aWVzKTtcbiAgICAgICAgY29uc3QgYXZhaWxhYmxlT3B0aW9ucyA9IGtleXNcbiAgICAgICAgICAgIC5tYXAoa2V5ID0+ICh7IC4uLnByb3BlcnRpZXNba2V5XSwgLi4ueyBuYW1lOiBzdHJpbmdzLmRhc2hlcml6ZShrZXkpIH0gfSkpXG4gICAgICAgICAgICAubWFwKG9wdCA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHR5cGU7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2NoZW1hdGljVHlwZSA9IG9wdC50eXBlO1xuICAgICAgICAgICAgICAgIHN3aXRjaCAob3B0LnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBTdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gQm9vbGVhbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdpbnRlZ2VyJzpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBOdW1iZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAvLyBJZ25vcmUgYXJyYXlzIC8gb2JqZWN0cy5cbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXQgYWxpYXNlczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgICAgICAgICBpZiAob3B0LmFsaWFzKSB7XG4gICAgICAgICAgICAgICAgICAgIGFsaWFzZXMgPSBbLi4uYWxpYXNlcywgb3B0LmFsaWFzXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG9wdC5hbGlhc2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIGFsaWFzZXMgPSBbLi4uYWxpYXNlcywgLi4ub3B0LmFsaWFzZXNdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBzY2hlbWF0aWNEZWZhdWx0ID0gb3B0LmRlZmF1bHQ7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAuLi5vcHQsXG4gICAgICAgICAgICAgICAgICAgIGFsaWFzZXMsXG4gICAgICAgICAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICAgICAgICAgIHNjaGVtYXRpY1R5cGUsXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHVuZGVmaW5lZCwgLy8gZG8gbm90IGNhcnJ5IG92ZXIgc2NoZW1hdGljcyBkZWZhdWx0c1xuICAgICAgICAgICAgICAgICAgICBzY2hlbWF0aWNEZWZhdWx0LFxuICAgICAgICAgICAgICAgICAgICBoaWRkZW46IG9wdC52aXNpYmxlID09PSBmYWxzZSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiB4KTtcblxuICAgICAgICBjb25zdCBzY2hlbWF0aWNPcHRpb25zID0gYXZhaWxhYmxlT3B0aW9uc1xuICAgICAgICAgICAgLmZpbHRlcihvcHQgPT4gb3B0LiRkZWZhdWx0ID09PSB1bmRlZmluZWQgfHwgb3B0LiRkZWZhdWx0LiRzb3VyY2UgIT09ICdhcmd2Jyk7XG5cbiAgICAgICAgY29uc3Qgc2NoZW1hdGljQXJndW1lbnRzID0gYXZhaWxhYmxlT3B0aW9uc1xuICAgICAgICAgICAgLmZpbHRlcihvcHQgPT4gb3B0LiRkZWZhdWx0ICE9PSB1bmRlZmluZWQgJiYgb3B0LiRkZWZhdWx0LiRzb3VyY2UgPT09ICdhcmd2JylcbiAgICAgICAgICAgIC5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGEuJGRlZmF1bHQuaW5kZXggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGIuJGRlZmF1bHQuaW5kZXggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhLiRkZWZhdWx0LmluZGV4ID09IGIuJGRlZmF1bHQuaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhLiRkZWZhdWx0LmluZGV4ID4gYi4kZGVmYXVsdC5pbmRleCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgICAgICBvcHRpb25zOiBzY2hlbWF0aWNPcHRpb25zLFxuICAgICAgICAgICAgYXJndW1lbnRzOiBzY2hlbWF0aWNBcmd1bWVudHMsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2xvYWRXb3Jrc3BhY2UoKSB7XG4gICAgICAgIGlmICh0aGlzLl93b3Jrc3BhY2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB3b3Jrc3BhY2VMb2FkZXIgPSBuZXcgV29ya3NwYWNlTG9hZGVyKHRoaXMuX2hvc3QpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB3b3Jrc3BhY2VMb2FkZXIubG9hZFdvcmtzcGFjZSh0aGlzLnByb2plY3Qucm9vdCkucGlwZSh0YWtlKDEpKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoXG4gICAgICAgICAgICAgICAgICAgICh3b3Jrc3BhY2U6IGV4cGVyaW1lbnRhbC53b3Jrc3BhY2UuV29ya3NwYWNlKSA9PiB0aGlzLl93b3Jrc3BhY2UgPSB3b3Jrc3BhY2UsXG4gICAgICAgICAgICAgICAgICAgIChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuYWxsb3dNaXNzaW5nV29ya3NwYWNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWdub3JlIG1pc3Npbmcgd29ya3NwYWNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuYWxsb3dNaXNzaW5nV29ya3NwYWNlKSB7XG4gICAgICAgICAgICAgICAgLy8gSWdub3JlIG1pc3Npbmcgd29ya3NwYWNlXG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfY2xlYW5EZWZhdWx0czxULCBLIGV4dGVuZHMga2V5b2YgVD4oZGVmYXVsdHM6IFQsIHVuZGVmaW5lZE9wdGlvbnM6IHN0cmluZ1tdKTogVCB7XG4gICAgICAgIChPYmplY3Qua2V5cyhkZWZhdWx0cykgYXMgS1tdKVxuICAgICAgICAgICAgLmZpbHRlcihrZXkgPT4gIXVuZGVmaW5lZE9wdGlvbnMubWFwKHN0cmluZ3MuY2FtZWxpemUpLmluY2x1ZGVzKGtleSBhcyBhbnkpKVxuICAgICAgICAgICAgLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgICAgICAgICBkZWxldGUgZGVmYXVsdHNba2V5XTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBkZWZhdWx0cztcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlYWREZWZhdWx0cyhjb2xsZWN0aW9uTmFtZTogc3RyaW5nLCBzY2hlbWF0aWNOYW1lOiBzdHJpbmcsIG9wdGlvbnM6IGFueSk6IHt9IHtcbiAgICAgICAgaWYgKHRoaXMuX2RlQWxpYXNlZE5hbWUpIHtcbiAgICAgICAgICAgIHNjaGVtYXRpY05hbWUgPSB0aGlzLl9kZUFsaWFzZWROYW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcHJvamVjdE5hbWUgPSBvcHRpb25zLnByb2plY3Q7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRzID0gZ2V0U2NoZW1hdGljRGVmYXVsdHMoY29sbGVjdGlvbk5hbWUsIHNjaGVtYXRpY05hbWUsIHByb2plY3ROYW1lKTtcblxuICAgICAgICAvLyBHZXQgbGlzdCBvZiBhbGwgdW5kZWZpbmVkIG9wdGlvbnMuXG4gICAgICAgIGNvbnN0IHVuZGVmaW5lZE9wdGlvbnMgPSB0aGlzLm9wdGlvbnNcbiAgICAgICAgICAgIC5maWx0ZXIobyA9PiBvcHRpb25zW28ubmFtZV0gPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIC5tYXAobyA9PiBvLm5hbWUpO1xuXG4gICAgICAgIC8vIERlbGV0ZSBhbnkgZGVmYXVsdCB0aGF0IGlzIG5vdCB1bmRlZmluZWQuXG4gICAgICAgIHRoaXMuX2NsZWFuRGVmYXVsdHMoZGVmYXVsdHMsIHVuZGVmaW5lZE9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiBkZWZhdWx0cztcbiAgICB9XG59XG4iXX0=