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
                    /*    console.log('--eventPath--', eventPath)
                       console.log('--event--', event)  */ // { kind: 'create',path: '/src/bobo10.pipe.ts',content: Buffer……}
                    loggingQueue.push(core_1.tags.oneLine `
            ${core_1.terminal.white('UPDATE')} ${eventPath} (${event.content.length} bytes)
          `);
                    break;
                case 'create':
                    /*     console.log('--eventPath--', eventPath)
                        console.log('--event--', event)  */ // { kind: 'create',path: '/src/bobo10.pipe.ts',content: Buffer……}
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
                    /*                         console.log('-----------++--------------workflow--complete---++++++++++++++++++++--')
                     */ const showNothingDone = !(options.showNothingDone === false);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hdGljLWNvbW1hbmQuanMiLCJzb3VyY2VSb290IjoiL1VzZXJzL2JvYm8vV29yay9zaGFyay1nZW5lcmF0ZS8iLCJzb3VyY2VzIjpbImNvbW1hbmRzL3NjaGVtYXRpYy1jb21tYW5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFFQSwrQ0FBcUY7QUFDckYsb0RBQTJEO0FBQzNELDJEQUF3RjtBQUN4Riw0REFBZ0U7QUFDaEUsOENBQXNDO0FBQ3RDLDhEQUEwRDtBQUMxRCwyQ0FBa0Y7QUFDbEYsMkNBQXNEO0FBQ3RELGtEQUFnRTtBQUNoRSx1Q0FBOEQ7QUEyQjlELHNCQUF1QyxTQUFRLGlCQUFPO0lBQXREOztRQUNhLFlBQU8sR0FBYSxFQUFFLENBQUM7UUFDdkIsMkJBQXNCLEdBQVksS0FBSyxDQUFDO1FBQ3pDLFVBQUssR0FBRyxJQUFJLHFCQUFjLEVBQUUsQ0FBQztRQUlyQyxnQkFBVyxHQUFHLDBCQUFnQixDQUFDLE9BQU8sQ0FBQztRQUVwQixnQkFBVyxHQUFhO1lBQ3ZDO2dCQUNJLElBQUksRUFBRSxRQUFRO2dCQUNkLElBQUksRUFBRSxPQUFPO2dCQUNiLE9BQU8sRUFBRSxLQUFLO2dCQUNkLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQztnQkFDZCxXQUFXLEVBQUUseUNBQXlDO2FBQ3pEO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLE9BQU87Z0JBQ2IsSUFBSSxFQUFFLE9BQU87Z0JBQ2IsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDO2dCQUNkLFdBQVcsRUFBRSw4QkFBOEI7YUFDOUM7U0FBQyxDQUFDO1FBRUUsY0FBUyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7SUE2V3JDLENBQUM7SUEzV2dCLFVBQVUsQ0FBQyxRQUFhOztZQUNqQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDMUIsQ0FBQztLQUFBO0lBRUQsdURBQXVEO0lBQzdDLGNBQWMsQ0FBQyxPQUFZLEVBQUUsVUFB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QyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFdEIsNENBQTRDO1FBQzVDLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFFaEQsT0FBTyxRQUFRLENBQUM7SUFDcEIsQ0FBQztDQUNKO0FBdFlELDRDQXNZQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIHRzbGludDpkaXNhYmxlOm5vLWdsb2JhbC10c2xpbnQtZGlzYWJsZSBuby1hbnkgZmlsZS1oZWFkZXJcbmltcG9ydCB7IEpzb25PYmplY3QsIGV4cGVyaW1lbnRhbCB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IG5vcm1hbGl6ZSwgc3RyaW5ncywgdGFncywgdGVybWluYWwsIHZpcnR1YWxGcyB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IE5vZGVKc1N5bmNIb3N0IH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUvbm9kZSc7XG5pbXBvcnQgeyBEcnlSdW5FdmVudCwgVW5zdWNjZXNzZnVsV29ya2Zsb3dFeGVjdXRpb24gfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQgeyBOb2RlV29ya2Zsb3cgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcy90b29scyc7XG5pbXBvcnQgeyB0YWtlIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHsgV29ya3NwYWNlTG9hZGVyIH0gZnJvbSAnLi4vbGliL3dvcmtzcGFjZS1sb2FkZXInO1xuaW1wb3J0IHsgZ2V0RGVmYXVsdFNjaGVtYXRpY0NvbGxlY3Rpb24sIGdldFBhY2thZ2VNYW5hZ2VyIH0gZnJvbSAnLi4vdXRpbC9jb25maWcnO1xuaW1wb3J0IHsgZ2V0U2NoZW1hdGljRGVmYXVsdHMgfSBmcm9tICcuLi91dGlsL2NvbmZpZyc7XG5pbXBvcnQgeyBnZXRDb2xsZWN0aW9uLCBnZXRTY2hlbWF0aWMgfSBmcm9tICcuLi9saWIvc2NoZW1hdGljcyc7XG5pbXBvcnQgeyBBcmd1bWVudFN0cmF0ZWd5LCBDb21tYW5kLCBPcHRpb24gfSBmcm9tICcuL2NvbW1hbmQnO1xuXG5leHBvcnQgaW50ZXJmYWNlIENvcmVTY2hlbWF0aWNPcHRpb25zIHtcbiAgICBkcnlSdW46IGJvb2xlYW47XG4gICAgZm9yY2U6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUnVuU2NoZW1hdGljT3B0aW9ucyB7XG4gICAgY29sbGVjdGlvbk5hbWU6IHN0cmluZztcbiAgICBzY2hlbWF0aWNOYW1lOiBzdHJpbmc7XG4gICAgc2NoZW1hdGljT3B0aW9uczogYW55O1xuICAgIGRlYnVnPzogYm9vbGVhbjtcbiAgICBkcnlSdW46IGJvb2xlYW47XG4gICAgZm9yY2U6IGJvb2xlYW47XG4gICAgc2hvd05vdGhpbmdEb25lPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBHZXRPcHRpb25zT3B0aW9ucyB7XG4gICAgY29sbGVjdGlvbk5hbWU6IHN0cmluZztcbiAgICBzY2hlbWF0aWNOYW1lOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgR2V0T3B0aW9uc1Jlc3VsdCB7XG4gICAgb3B0aW9uczogT3B0aW9uW107XG4gICAgYXJndW1lbnRzOiBPcHRpb25bXTtcbn1cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFNjaGVtYXRpY0NvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgICByZWFkb25seSBvcHRpb25zOiBPcHRpb25bXSA9IFtdO1xuICAgIHJlYWRvbmx5IGFsbG93UHJpdmF0ZVNjaGVtYXRpY3M6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICBwcml2YXRlIF9ob3N0ID0gbmV3IE5vZGVKc1N5bmNIb3N0KCk7XG4gICAgcHJpdmF0ZSBfd29ya3NwYWNlOiBleHBlcmltZW50YWwud29ya3NwYWNlLldvcmtzcGFjZTtcbiAgICBwcml2YXRlIF9kZUFsaWFzZWROYW1lOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBfb3JpZ2luYWxPcHRpb25zOiBPcHRpb25bXTtcbiAgICBhcmdTdHJhdGVneSA9IEFyZ3VtZW50U3RyYXRlZ3kuTm90aGluZztcblxuICAgIHByb3RlY3RlZCByZWFkb25seSBjb3JlT3B0aW9uczogT3B0aW9uW10gPSBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6ICdkcnlSdW4nLFxuICAgICAgICAgICAgdHlwZTogQm9vbGVhbixcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgICAgICAgYWxpYXNlczogWydkJ10sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1J1biB0aHJvdWdoIHdpdGhvdXQgbWFraW5nIGFueSBjaGFuZ2VzLicsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6ICdmb3JjZScsXG4gICAgICAgICAgICB0eXBlOiBCb29sZWFuLFxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICAgICAgICBhbGlhc2VzOiBbJ2YnXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRm9yY2VzIG92ZXJ3cml0aW5nIG9mIGZpbGVzLicsXG4gICAgICAgIH1dO1xuXG4gICAgcmVhZG9ubHkgYXJndW1lbnRzID0gWydwcm9qZWN0J107XG5cbiAgICBwdWJsaWMgYXN5bmMgaW5pdGlhbGl6ZShfb3B0aW9uczogYW55KSB7XG4gICAgICAgIHRoaXMuX2xvYWRXb3Jrc3BhY2UoKTtcbiAgICB9XG5cbiAgICAvLyBwYXJhbXM6IHsgXzogWyAnYm9ibzEnIF0sIHNraXBJbXBvcnQ6IHRydWUgfSwgJy9zcmMnXG4gICAgcHJvdGVjdGVkIHNldFBhdGhPcHRpb25zKG9wdGlvbnM6IGFueSwgd29ya2luZ0Rpcjogc3RyaW5nKTogYW55IHtcbiAgICAgICAgaWYgKHdvcmtpbmdEaXIgPT09ICcnKSB7XG4gICAgICAgICAgICByZXR1cm4ge307XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zXG4gICAgICAgICAgICAuZmlsdGVyKG8gPT4gby5mb3JtYXQgPT09ICdwYXRoJylcbiAgICAgICAgICAgIC5tYXAobyA9PiBvLm5hbWUpXG4gICAgICAgICAgICAuZmlsdGVyKG5hbWUgPT4gb3B0aW9uc1tuYW1lXSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgLnJlZHVjZSgoYWNjOiBhbnksIGN1cnIpID0+IHtcbiAgICAgICAgICAgICAgICBhY2NbY3Vycl0gPSB3b3JraW5nRGlyO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgICAgIH0sIHt9KTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgcnVuU2NoZW1hdGljKG9wdGlvbnM6IFJ1blNjaGVtYXRpY09wdGlvbnMpIHtcbiAgICAgICAgLyoqICAgIFxuICAgICAgICAgKiDku47kvKDlhaXnmoTphY3nva7pobkgb3B0aW9uc1xuICAgICAgICAgKiBvcHRpb25zID0geyBfOiBbICdib2JvMycgXSwgZHJ5UnVuOiBmYWxzZSwgZm9yY2U6IGZhbHNlLCBza2lwSW1wb3J0OiB0cnVlIH1cbiAgICAgICAgICAgICAtLS1ydW5TY2hlbWF0aWMgb3B0aW9ucy0tIHsgY29sbGVjdGlvbk5hbWU6ICdAc2NoZW1hdGljcy9hbmd1bGFyJyxcbiAgICAgICAgICAgIHNjaGVtYXRpY05hbWU6ICdwaXBlJyxcbiAgICAgICAgICAgIHNjaGVtYXRpY09wdGlvbnM6IHsgXzogWyAnYm9ibzMnIF0sIGRyeVJ1bjogZmFsc2UsIGZvcmNlOiBmYWxzZSwgc2tpcEltcG9ydDogdHJ1ZSB9LFxuICAgICAgICAgICAgZGVidWc6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGRyeVJ1bjogZmFsc2UsXG4gICAgICAgICAgICBmb3JjZTogZmFsc2UgfVxuICAgICAgICAgKi9cbiAgICAgICAgLyogICAgIGNvbnNvbGUubG9nKCctLS1ydW5TY2hlbWF0aWMgb3B0aW9ucy0tJywgb3B0aW9ucyk7XG4gICAgICAgICAqL1xuICAgICAgICBjb25zdCB7IGNvbGxlY3Rpb25OYW1lLCBzY2hlbWF0aWNOYW1lLCBkZWJ1ZywgZm9yY2UsIGRyeVJ1biB9ID0gb3B0aW9ucztcbiAgICAgICAgLyoqICBcbiAgICAgICAgICog56e76Zmkc2NoZW1hdGljT3B0aW9uc+S4rSDnmoTljp/lp4tvcHRpb25z6YeM6Z2i55qE5Y+C5pWwXG4gICAgICAgICAqID09PnNjaGVtYXRpY09wdGlvbnM6eyBfOiBbICdib2JvMScgXSwgc2tpcEltcG9ydDogdHJ1ZSB9XG4gICAgICAgICAqICBjb25zb2xlLmxvZygnLS1zY2hlbWF0aWNPcHRpb25zLS0nLCBzY2hlbWF0aWNPcHRpb25zKVxuICAgICAgICAqL1xuICAgICAgICBsZXQgc2NoZW1hdGljT3B0aW9ucyA9IHRoaXMucmVtb3ZlQ29yZU9wdGlvbnMob3B0aW9ucy5zY2hlbWF0aWNPcHRpb25zKTtcbiAgICAgICAgbGV0IG5vdGhpbmdEb25lID0gdHJ1ZTtcbiAgICAgICAgbGV0IGxvZ2dpbmdRdWV1ZTogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgbGV0IGVycm9yID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IGZzSG9zdCA9IG5ldyB2aXJ0dWFsRnMuU2NvcGVkSG9zdChuZXcgTm9kZUpzU3luY0hvc3QoKSwgbm9ybWFsaXplKHRoaXMucHJvamVjdC5yb290KSk7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiAg5a6e5L6L5YyW5LiA5Liq5bel5L2c5rWBXG4gICAgICAgICAqL1xuICAgICAgICBjb25zdCB3b3JrZmxvdyA9IG5ldyBOb2RlV29ya2Zsb3coXG4gICAgICAgICAgICBmc0hvc3QgYXMgYW55LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGZvcmNlLFxuICAgICAgICAgICAgICAgIGRyeVJ1bixcbiAgICAgICAgICAgICAgICBwYWNrYWdlTWFuYWdlcjogZ2V0UGFja2FnZU1hbmFnZXIoKSwgLy8g5YyF566h55CG5bel5YW3IG5wbXx8IGNucG0gfHwgeWFyblxuICAgICAgICAgICAgICAgIHJvb3Q6IHRoaXMucHJvamVjdC5yb290XG4gICAgICAgICAgICB9LFxuICAgICAgICApO1xuICAgICAgICAvLyDojrflj5blvZPliY3lt6XkvZznm67lvZXnmoTnu53lr7not6/lvoQgIGVnLiAvc3JjICAgcHJvY2Vzcy5jd2QoKSA9PT4gbm9kZS5qc+i/m+eoi+W9k+WJjeW3peS9nOeahOebruW9lVxuICAgICAgICBjb25zdCB3b3JraW5nRGlyID0gcHJvY2Vzcy5jd2QoKS5yZXBsYWNlKHRoaXMucHJvamVjdC5yb290LCAnJykucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuICAgICAgICAvLyB7IHBhdGg6ICcvc3JjJyB9IHRoaXMuc2V0UGF0aE9wdGlvbnMoeyBfOiBbICdib2JvMScgXSwgc2tpcEltcG9ydDogdHJ1ZSB9LCAnL3NyYycpXG4gICAgICAgIGNvbnN0IHBhdGhPcHRpb25zID0gdGhpcy5zZXRQYXRoT3B0aW9ucyhzY2hlbWF0aWNPcHRpb25zLCB3b3JraW5nRGlyKTtcblxuICAgICAgICAvLyBzY2hlbWF0aWNPcHRpb25zID0geyBfOiBbICdib2JvNCddLCBza2lwSW1wb3J0OiB0cnVlLCBwYXRoOiAnL3NyYycgfVxuICAgICAgICBzY2hlbWF0aWNPcHRpb25zID0geyAuLi5zY2hlbWF0aWNPcHRpb25zLCAuLi5wYXRoT3B0aW9ucyB9O1xuICAgICAgICBjb25zdCBkZWZhdWx0T3B0aW9ucyA9IHRoaXMucmVhZERlZmF1bHRzKGNvbGxlY3Rpb25OYW1lLCBzY2hlbWF0aWNOYW1lLCBzY2hlbWF0aWNPcHRpb25zKTtcbiAgICAgICAgc2NoZW1hdGljT3B0aW9ucyA9IHsgLi4uc2NoZW1hdGljT3B0aW9ucywgLi4uZGVmYXVsdE9wdGlvbnMgfTtcblxuICAgICAgICAvLyBQYXNzIHRoZSByZXN0IG9mIHRoZSBhcmd1bWVudHMgYXMgdGhlIHNtYXJ0IGRlZmF1bHQgXCJhcmd2XCIuIFRoZW4gZGVsZXRlIGl0LlxuICAgICAgICAvLyBSZW1vdmluZyB0aGUgZmlyc3QgaXRlbSB3aGljaCBpcyB0aGUgc2NoZW1hdGljIG5hbWUuXG4gICAgICAgIC8vIGVnLiByYXdBcmdzID0gWyAnYm9ibzQnXVxuICAgICAgICBjb25zdCByYXdBcmdzID0gc2NoZW1hdGljT3B0aW9ucy5fO1xuICAgICAgICB3b3JrZmxvdy5yZWdpc3RyeS5hZGRTbWFydERlZmF1bHRQcm92aWRlcignYXJndicsIChzY2hlbWE6IEpzb25PYmplY3QpID0+IHtcbiAgICAgICAgICAgIC8vIHNjaGVtYSA9IHsgJyRzb3VyY2UnOiAnYXJndicsIGluZGV4OiAwIH1cbiAgICAgICAgICAgIGlmICgnaW5kZXgnIGluIHNjaGVtYSkge1xuICAgICAgICAgICAgICAgIHJldHVybiByYXdBcmdzW051bWJlcihzY2hlbWFbJ2luZGV4J10pXTsgLy8gJ2JvYm80JyAtLVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmF3QXJncztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGRlbGV0ZSBzY2hlbWF0aWNPcHRpb25zLl87XG5cbiAgICAgICAgd29ya2Zsb3cucmVnaXN0cnkuYWRkU21hcnREZWZhdWx0UHJvdmlkZXIoJ3Byb2plY3ROYW1lJywgKF9zY2hlbWE6IEpzb25PYmplY3QpID0+IHtcbiAgICAgICAgICAgIC8vICBfc2NoZW1hID0geyAnJHNvdXJjZSc6ICdwcm9qZWN0TmFtZScgfVxuICAgICAgICAgICAgLyogICB0aGlzLl93b3Jrc3BhY2UgPSAgeyAnJHNjaGVtYSc6ICcuL25vZGVfbW9kdWxlcy9AYW5ndWxhci9jbGkvbGliL2NvbmZpZy9zY2hlbWEuanNvbicsXG4gICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogMSxcbiAgICAgICAgICAgICAgICAgICAgICBuZXdQcm9qZWN0Um9vdDogJ3Byb2plY3RzJyxcbiAgICAgICAgICAgICAgICAgICAgICBwcm9qZWN0czogeyBteTE6IFtPYmplY3RdLCAnbXkxLWUyZSc6IFtPYmplY3RdIH0sXG4gICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFByb2plY3Q6ICdteTEnLFxuICAgICAgICAgICAgICAgICAgICAgIGNsaTogeyB9LFxuICAgICAgICAgICAgICAgICAgICAgIHNjaGVtYXRpY3M6IHsgfSxcbiAgICAgICAgICAgICAgICAgICAgICBhcmNoaXRlY3Q6IHsgfVxuICAgICAgICAgICAgICAgICAgfSB9IFxuICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIC8qICBjb25zb2xlLmxvZygnLS10aGlzLl93b3Jrc3BhY2UucHJvamVjdHMtLScsICh0aGlzLl93b3Jrc3BhY2UgYXMgYW55KS5wcm9qZWN0cykgKi9cbiAgICAgICAgICAgIGlmICh0aGlzLl93b3Jrc3BhY2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fd29ya3NwYWNlLmdldFByb2plY3RCeVBhdGgobm9ybWFsaXplKHByb2Nlc3MuY3dkKCkpKVxuICAgICAgICAgICAgICAgICAgICB8fCB0aGlzLl93b3Jrc3BhY2UuZ2V0RGVmYXVsdFByb2plY3ROYW1lKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9KTtcblxuICAgICAgICB3b3JrZmxvdy5yZXBvcnRlci5zdWJzY3JpYmUoKGV2ZW50OiBEcnlSdW5FdmVudCkgPT4ge1xuICAgICAgICAgICAgbm90aGluZ0RvbmUgPSBmYWxzZTtcbiAgICAgICAgICAgIC8vIFN0cmlwIGxlYWRpbmcgc2xhc2ggdG8gcHJldmVudCBjb25mdXNpb24uXG4gICAgICAgICAgICBjb25zdCBldmVudFBhdGggPSBldmVudC5wYXRoLnN0YXJ0c1dpdGgoJy8nKSA/IGV2ZW50LnBhdGguc3Vic3RyKDEpIDogZXZlbnQucGF0aDsgLy8gc3JjL2JvYm8xMC5waXBlLnRzXG4gICAgICAgICAgICBzd2l0Y2ggKGV2ZW50LmtpbmQpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdlcnJvcic6XG4gICAgICAgICAgICAgICAgICAgIGVycm9yID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVzYyA9IGV2ZW50LmRlc2NyaXB0aW9uID09ICdhbHJlYWR5RXhpc3QnID8gJ2FscmVhZHkgZXhpc3RzJyA6ICdkb2VzIG5vdCBleGlzdC4nO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGBFUlJPUiEgJHtldmVudFBhdGh9ICR7ZGVzY30uYCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ3VwZGF0ZSc6XG4gICAgICAgICAgICAgICAgICAgIC8qICAgIGNvbnNvbGUubG9nKCctLWV2ZW50UGF0aC0tJywgZXZlbnRQYXRoKVxuICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnLS1ldmVudC0tJywgZXZlbnQpICAqLy8vIHsga2luZDogJ2NyZWF0ZScscGF0aDogJy9zcmMvYm9ibzEwLnBpcGUudHMnLGNvbnRlbnQ6IEJ1ZmZlcuKApuKApn1cbiAgICAgICAgICAgICAgICAgICAgbG9nZ2luZ1F1ZXVlLnB1c2godGFncy5vbmVMaW5lYFxuICAgICAgICAgICAgJHt0ZXJtaW5hbC53aGl0ZSgnVVBEQVRFJyl9ICR7ZXZlbnRQYXRofSAoJHtldmVudC5jb250ZW50Lmxlbmd0aH0gYnl0ZXMpXG4gICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2NyZWF0ZSc6XG4gICAgICAgICAgICAgICAgICAgIC8qICAgICBjb25zb2xlLmxvZygnLS1ldmVudFBhdGgtLScsIGV2ZW50UGF0aClcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCctLWV2ZW50LS0nLCBldmVudCkgICovLy8geyBraW5kOiAnY3JlYXRlJyxwYXRoOiAnL3NyYy9ib2JvMTAucGlwZS50cycsY29udGVudDogQnVmZmVy4oCm4oCmfVxuICAgICAgICAgICAgICAgICAgICBsb2dnaW5nUXVldWUucHVzaCh0YWdzLm9uZUxpbmVgXG4gICAgICAgICAgICAke3Rlcm1pbmFsLmdyZWVuKCdDUkVBVEUnKX0gJHtldmVudFBhdGh9ICgke2V2ZW50LmNvbnRlbnQubGVuZ3RofSBieXRlcylcbiAgICAgICAgICBgKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnZGVsZXRlJzpcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2luZ1F1ZXVlLnB1c2goYCR7dGVybWluYWwueWVsbG93KCdERUxFVEUnKX0gJHtldmVudFBhdGh9YCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ3JlbmFtZSc6XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dpbmdRdWV1ZS5wdXNoKGAke3Rlcm1pbmFsLmJsdWUoJ1JFTkFNRScpfSAke2V2ZW50UGF0aH0gPT4gJHtldmVudC50b31gKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmtmbG93LmxpZmVDeWNsZS5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgICAgICAgaWYgKGV2ZW50LmtpbmQgPT0gJ2VuZCcgfHwgZXZlbnQua2luZCA9PSAncG9zdC10YXNrcy1zdGFydCcpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIE91dHB1dCB0aGUgbG9nZ2luZyBxdWV1ZSwgbm8gZXJyb3IgaGFwcGVuZWQuXG4gICAgICAgICAgICAgICAgICAgIGxvZ2dpbmdRdWV1ZS5mb3JFYWNoKGxvZyA9PiB0aGlzLmxvZ2dlci5pbmZvKGxvZykpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxvZ2dpbmdRdWV1ZSA9IFtdO1xuICAgICAgICAgICAgICAgIGVycm9yID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxudW1iZXIgfCB2b2lkPigocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgb2JqID0ge1xuICAgICAgICAgICAgICAgIGNvbGxlY3Rpb246IGNvbGxlY3Rpb25OYW1lLFxuICAgICAgICAgICAgICAgIHNjaGVtYXRpYzogc2NoZW1hdGljTmFtZSxcbiAgICAgICAgICAgICAgICBvcHRpb25zOiBzY2hlbWF0aWNPcHRpb25zLFxuICAgICAgICAgICAgICAgIGRlYnVnOiBkZWJ1ZyxcbiAgICAgICAgICAgICAgICBsb2dnZXI6IHRoaXMubG9nZ2VyIGFzIGFueSxcbiAgICAgICAgICAgICAgICBhbGxvd1ByaXZhdGU6IHRoaXMuYWxsb3dQcml2YXRlU2NoZW1hdGljcyxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdvcmtmbG93LmV4ZWN1dGUoe1xuICAgICAgICAgICAgICAgIGNvbGxlY3Rpb246IGNvbGxlY3Rpb25OYW1lLFxuICAgICAgICAgICAgICAgIHNjaGVtYXRpYzogc2NoZW1hdGljTmFtZSxcbiAgICAgICAgICAgICAgICBvcHRpb25zOiBzY2hlbWF0aWNPcHRpb25zLFxuICAgICAgICAgICAgICAgIGRlYnVnOiBkZWJ1ZyxcbiAgICAgICAgICAgICAgICBsb2dnZXI6IHRoaXMubG9nZ2VyIGFzIGFueSxcbiAgICAgICAgICAgICAgICBhbGxvd1ByaXZhdGU6IHRoaXMuYWxsb3dQcml2YXRlU2NoZW1hdGljcyxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSh7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiAoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSW4gY2FzZSB0aGUgd29ya2Zsb3cgd2FzIG5vdCBzdWNjZXNzZnVsLCBzaG93IGFuIGFwcHJvcHJpYXRlIGVycm9yIG1lc3NhZ2UuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyIGluc3RhbmNlb2YgVW5zdWNjZXNzZnVsV29ya2Zsb3dFeGVjdXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBcIlNlZSBhYm92ZVwiIGJlY2F1c2Ugd2UgYWxyZWFkeSBwcmludGVkIHRoZSBlcnJvci5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlci5mYXRhbCgnVGhlIFNjaGVtYXRpYyB3b3JrZmxvdyBmYWlsZWQuIFNlZSBhYm92ZS4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZGVidWcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlci5mYXRhbChgQW4gZXJyb3Igb2NjdXJlZDpcXG4ke2Vyci5tZXNzYWdlfVxcbiR7ZXJyLnN0YWNrfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlci5mYXRhbChlcnIubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoMSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGNvbXBsZXRlOiAoKSA9PiB7XG4vKiAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0rKy0tLS0tLS0tLS0tLS0td29ya2Zsb3ctLWNvbXBsZXRlLS0tKysrKysrKysrKysrKysrKysrKystLScpXG4gKi8gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzaG93Tm90aGluZ0RvbmUgPSAhKG9wdGlvbnMuc2hvd05vdGhpbmdEb25lID09PSBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobm90aGluZ0RvbmUgJiYgc2hvd05vdGhpbmdEb25lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dnZXIuaW5mbygnTm90aGluZyB0byBiZSBkb25lLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRyeVJ1bikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLndhcm4oYFxcbk5PVEU6IFJ1biB3aXRoIFwiZHJ5IHJ1blwiIG5vIGNoYW5nZXMgd2VyZSBtYWRlLmApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgcmVtb3ZlQ29yZU9wdGlvbnMob3B0aW9uczogYW55KTogYW55IHtcbiAgICAgICAgY29uc3Qgb3B0cyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMpO1xuICAgICAgICAvKiogIF9fb3JpZ2luYWxPcHRpb25zIFxuICAgICAgICAgKiAgWyB7IG5hbWU6ICdkcnlSdW4nLFxuICAgICAgICAgICAgICAgIHR5cGU6IFtGdW5jdGlvbjogQm9vbGVhbl0sXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICAgICAgICAgICAgYWxpYXNlczogWyAnZCcgXSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1J1biB0aHJvdWdoIHdpdGhvdXQgbWFraW5nIGFueSBjaGFuZ2VzLicgXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHsgbmFtZTogJ2ZvcmNlJyxcbiAgICAgICAgICAgICAgICB0eXBlOiBbRnVuY3Rpb246IEJvb2xlYW5dLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGFsaWFzZXM6IFsgJ2YnIF0sXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdGb3JjZXMgb3ZlcndyaXRpbmcgb2YgZmlsZXMuJyBcbiAgICAgICAgICAgICAgfSBdXG4gICAgICAgICovXG4gICAgICAgIC8qICAgY29uc29sZS5sb2coJy0tdGhpcy5fX29yaWdpbmFsT3B0aW9ucy0tJywgdGhpcy5fb3JpZ2luYWxPcHRpb25zKSAqL1xuICAgICAgICBpZiAodGhpcy5fb3JpZ2luYWxPcHRpb25zLmZpbmQob3B0aW9uID0+IG9wdGlvbi5uYW1lID09ICdkcnlSdW4nKSkge1xuICAgICAgICAgICAgZGVsZXRlIG9wdHMuZHJ5UnVuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9vcmlnaW5hbE9wdGlvbnMuZmluZChvcHRpb24gPT4gb3B0aW9uLm5hbWUgPT0gJ2ZvcmNlJykpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBvcHRzLmZvcmNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9vcmlnaW5hbE9wdGlvbnMuZmluZChvcHRpb24gPT4gb3B0aW9uLm5hbWUgPT0gJ2RlYnVnJykpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBvcHRzLmRlYnVnO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG9wdHM7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGdldE9wdGlvbnMob3B0aW9uczogR2V0T3B0aW9uc09wdGlvbnMpOiBQcm9taXNlPEdldE9wdGlvbnNSZXN1bHQ+IHtcbiAgICAgICAgLy8gTWFrZSBhIGNvcHkuXG4gICAgICAgIHRoaXMuX29yaWdpbmFsT3B0aW9ucyA9IFsuLi50aGlzLm9wdGlvbnNdO1xuXG4gICAgICAgIGNvbnN0IGNvbGxlY3Rpb25OYW1lID0gb3B0aW9ucy5jb2xsZWN0aW9uTmFtZSB8fCBnZXREZWZhdWx0U2NoZW1hdGljQ29sbGVjdGlvbigpO1xuXG4gICAgICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBnZXRDb2xsZWN0aW9uKGNvbGxlY3Rpb25OYW1lKTtcbiAgICAgICAgY29uc3Qgc2NoZW1hdGljID0gZ2V0U2NoZW1hdGljKGNvbGxlY3Rpb24sIG9wdGlvbnMuc2NoZW1hdGljTmFtZSwgdGhpcy5hbGxvd1ByaXZhdGVTY2hlbWF0aWNzKTtcbiAgICAgICAgdGhpcy5fZGVBbGlhc2VkTmFtZSA9IHNjaGVtYXRpYy5kZXNjcmlwdGlvbi5uYW1lO1xuXG4gICAgICAgIGlmICghc2NoZW1hdGljLmRlc2NyaXB0aW9uLnNjaGVtYUpzb24pIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICAgICAgICAgIG9wdGlvbnM6IFtdLFxuICAgICAgICAgICAgICAgIGFyZ3VtZW50czogW10sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHByb3BlcnRpZXMgPSBzY2hlbWF0aWMuZGVzY3JpcHRpb24uc2NoZW1hSnNvbi5wcm9wZXJ0aWVzO1xuICAgICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMocHJvcGVydGllcyk7XG4gICAgICAgIGNvbnN0IGF2YWlsYWJsZU9wdGlvbnMgPSBrZXlzXG4gICAgICAgICAgICAubWFwKGtleSA9PiAoeyAuLi5wcm9wZXJ0aWVzW2tleV0sIC4uLnsgbmFtZTogc3RyaW5ncy5kYXNoZXJpemUoa2V5KSB9IH0pKVxuICAgICAgICAgICAgLm1hcChvcHQgPT4ge1xuICAgICAgICAgICAgICAgIGxldCB0eXBlO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNjaGVtYXRpY1R5cGUgPSBvcHQudHlwZTtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKG9wdC50eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gU3RyaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IEJvb2xlYW47XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnaW50ZWdlcic6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gTnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gSWdub3JlIGFycmF5cyAvIG9iamVjdHMuXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGV0IGFsaWFzZXM6IHN0cmluZ1tdID0gW107XG4gICAgICAgICAgICAgICAgaWYgKG9wdC5hbGlhcykge1xuICAgICAgICAgICAgICAgICAgICBhbGlhc2VzID0gWy4uLmFsaWFzZXMsIG9wdC5hbGlhc107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChvcHQuYWxpYXNlcykge1xuICAgICAgICAgICAgICAgICAgICBhbGlhc2VzID0gWy4uLmFsaWFzZXMsIC4uLm9wdC5hbGlhc2VzXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3Qgc2NoZW1hdGljRGVmYXVsdCA9IG9wdC5kZWZhdWx0O1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgLi4ub3B0LFxuICAgICAgICAgICAgICAgICAgICBhbGlhc2VzLFxuICAgICAgICAgICAgICAgICAgICB0eXBlLFxuICAgICAgICAgICAgICAgICAgICBzY2hlbWF0aWNUeXBlLFxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiB1bmRlZmluZWQsIC8vIGRvIG5vdCBjYXJyeSBvdmVyIHNjaGVtYXRpY3MgZGVmYXVsdHNcbiAgICAgICAgICAgICAgICAgICAgc2NoZW1hdGljRGVmYXVsdCxcbiAgICAgICAgICAgICAgICAgICAgaGlkZGVuOiBvcHQudmlzaWJsZSA9PT0gZmFsc2UsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4geCk7XG5cbiAgICAgICAgY29uc3Qgc2NoZW1hdGljT3B0aW9ucyA9IGF2YWlsYWJsZU9wdGlvbnNcbiAgICAgICAgICAgIC5maWx0ZXIob3B0ID0+IG9wdC4kZGVmYXVsdCA9PT0gdW5kZWZpbmVkIHx8IG9wdC4kZGVmYXVsdC4kc291cmNlICE9PSAnYXJndicpO1xuXG4gICAgICAgIGNvbnN0IHNjaGVtYXRpY0FyZ3VtZW50cyA9IGF2YWlsYWJsZU9wdGlvbnNcbiAgICAgICAgICAgIC5maWx0ZXIob3B0ID0+IG9wdC4kZGVmYXVsdCAhPT0gdW5kZWZpbmVkICYmIG9wdC4kZGVmYXVsdC4kc291cmNlID09PSAnYXJndicpXG4gICAgICAgICAgICAuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChhLiRkZWZhdWx0LmluZGV4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChiLiRkZWZhdWx0LmluZGV4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYS4kZGVmYXVsdC5pbmRleCA9PSBiLiRkZWZhdWx0LmluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYS4kZGVmYXVsdC5pbmRleCA+IGIuJGRlZmF1bHQuaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICAgICAgb3B0aW9uczogc2NoZW1hdGljT3B0aW9ucyxcbiAgICAgICAgICAgIGFyZ3VtZW50czogc2NoZW1hdGljQXJndW1lbnRzLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9sb2FkV29ya3NwYWNlKCkge1xuICAgICAgICBpZiAodGhpcy5fd29ya3NwYWNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgd29ya3NwYWNlTG9hZGVyID0gbmV3IFdvcmtzcGFjZUxvYWRlcih0aGlzLl9ob3N0KTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgd29ya3NwYWNlTG9hZGVyLmxvYWRXb3Jrc3BhY2UodGhpcy5wcm9qZWN0LnJvb3QpLnBpcGUodGFrZSgxKSlcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKFxuICAgICAgICAgICAgICAgICAgICAod29ya3NwYWNlOiBleHBlcmltZW50YWwud29ya3NwYWNlLldvcmtzcGFjZSkgPT4gdGhpcy5fd29ya3NwYWNlID0gd29ya3NwYWNlLFxuICAgICAgICAgICAgICAgICAgICAoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLmFsbG93TWlzc2luZ1dvcmtzcGFjZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElnbm9yZSBtaXNzaW5nIHdvcmtzcGFjZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmFsbG93TWlzc2luZ1dvcmtzcGFjZSkge1xuICAgICAgICAgICAgICAgIC8vIElnbm9yZSBtaXNzaW5nIHdvcmtzcGFjZVxuICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgX2NsZWFuRGVmYXVsdHM8VCwgSyBleHRlbmRzIGtleW9mIFQ+KGRlZmF1bHRzOiBULCB1bmRlZmluZWRPcHRpb25zOiBzdHJpbmdbXSk6IFQge1xuICAgICAgICAoT2JqZWN0LmtleXMoZGVmYXVsdHMpIGFzIEtbXSlcbiAgICAgICAgICAgIC5maWx0ZXIoa2V5ID0+ICF1bmRlZmluZWRPcHRpb25zLm1hcChzdHJpbmdzLmNhbWVsaXplKS5pbmNsdWRlcyhrZXkgYXMgYW55KSlcbiAgICAgICAgICAgIC5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGRlZmF1bHRzW2tleV07XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZGVmYXVsdHM7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZWFkRGVmYXVsdHMoY29sbGVjdGlvbk5hbWU6IHN0cmluZywgc2NoZW1hdGljTmFtZTogc3RyaW5nLCBvcHRpb25zOiBhbnkpOiB7fSB7XG4gICAgICAgIGlmICh0aGlzLl9kZUFsaWFzZWROYW1lKSB7XG4gICAgICAgICAgICBzY2hlbWF0aWNOYW1lID0gdGhpcy5fZGVBbGlhc2VkTmFtZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHByb2plY3ROYW1lID0gb3B0aW9ucy5wcm9qZWN0O1xuICAgICAgICBjb25zdCBkZWZhdWx0cyA9IGdldFNjaGVtYXRpY0RlZmF1bHRzKGNvbGxlY3Rpb25OYW1lLCBzY2hlbWF0aWNOYW1lLCBwcm9qZWN0TmFtZSk7XG5cbiAgICAgICAgLy8gR2V0IGxpc3Qgb2YgYWxsIHVuZGVmaW5lZCBvcHRpb25zLlxuICAgICAgICBjb25zdCB1bmRlZmluZWRPcHRpb25zID0gdGhpcy5vcHRpb25zXG4gICAgICAgICAgICAuZmlsdGVyKG8gPT4gb3B0aW9uc1tvLm5hbWVdID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICAubWFwKG8gPT4gby5uYW1lKTtcblxuICAgICAgICAvLyBEZWxldGUgYW55IGRlZmF1bHQgdGhhdCBpcyBub3QgdW5kZWZpbmVkLlxuICAgICAgICB0aGlzLl9jbGVhbkRlZmF1bHRzKGRlZmF1bHRzLCB1bmRlZmluZWRPcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gZGVmYXVsdHM7XG4gICAgfVxufVxuIl19