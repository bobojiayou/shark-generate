// tslint:disable:no-global-tslint-disable no-any file-header
import { JsonObject, experimental } from '@angular-devkit/core';
import { normalize, strings, tags, terminal, virtualFs } from '@angular-devkit/core';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import { DryRunEvent, UnsuccessfulWorkflowExecution } from '@angular-devkit/schematics';
import { NodeWorkflow } from '@angular-devkit/schematics/tools';
import { take } from 'rxjs/operators';
import { WorkspaceLoader } from '../lib/workspace-loader';
import { getDefaultSchematicCollection, getPackageManager } from '../util/config';
import { getSchematicDefaults } from '../util/config';
import { getCollection, getSchematic } from '../lib/schematics';
import { ArgumentStrategy, Command, Option } from './command';

export interface CoreSchematicOptions {
    dryRun: boolean;
    force: boolean;
}

export interface RunSchematicOptions {
    collectionName: string;
    schematicName: string;
    schematicOptions: any;
    debug?: boolean;
    dryRun: boolean;
    force: boolean;
    showNothingDone?: boolean;
}

export interface GetOptionsOptions {
    collectionName: string;
    schematicName: string;
}

export interface GetOptionsResult {
    options: Option[];
    arguments: Option[];
}

export abstract class SchematicCommand extends Command {
    readonly options: Option[] = [];
    readonly allowPrivateSchematics: boolean = false;
    private _host = new NodeJsSyncHost();
    private _workspace: experimental.workspace.Workspace;
    private _deAliasedName: string;
    private _originalOptions: Option[];
    argStrategy = ArgumentStrategy.Nothing;

    protected readonly coreOptions: Option[] = [
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
        }];

    readonly arguments = ['project'];

    public async initialize(_options: any) {
        this._loadWorkspace();
    }

    // params: { _: [ 'bobo1' ], skipImport: true }, '/src'
    protected setPathOptions(options: any, workingDir: string): any {
        if (workingDir === '') {
            return {};
        }

        return this.options
            .filter(o => o.format === 'path')
            .map(o => o.name)
            .filter(name => options[name] === undefined)
            .reduce((acc: any, curr) => {
                acc[curr] = workingDir;

                return acc;
            }, {});
    }

    protected runSchematic(options: RunSchematicOptions) {
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
        let loggingQueue: string[] = [];
        let error = false;
        const fsHost = new virtualFs.ScopedHost(new NodeJsSyncHost(), normalize(this.project.root));
        /**
         *  实例化一个工作流
         */
        const workflow = new NodeWorkflow(
            fsHost as any,
            {
                force,
                dryRun,
                packageManager: getPackageManager(), // 包管理工具 npm|| cnpm || yarn
                root: this.project.root
            },
        );
        // 获取当前工作目录的绝对路径  eg. /src   process.cwd() ==> node.js进程当前工作的目录
        const workingDir = process.cwd().replace(this.project.root, '').replace(/\\/g, '/');
        // { path: '/src' } this.setPathOptions({ _: [ 'bobo1' ], skipImport: true }, '/src')
        const pathOptions = this.setPathOptions(schematicOptions, workingDir);

        // schematicOptions = { _: [ 'bobo4'], skipImport: true, path: '/src' }
        schematicOptions = { ...schematicOptions, ...pathOptions };
        const defaultOptions = this.readDefaults(collectionName, schematicName, schematicOptions);
        schematicOptions = { ...schematicOptions, ...defaultOptions };

        // Pass the rest of the arguments as the smart default "argv". Then delete it.
        // Removing the first item which is the schematic name.
        // eg. rawArgs = [ 'bobo4']
        const rawArgs = schematicOptions._;
        workflow.registry.addSmartDefaultProvider('argv', (schema: JsonObject) => {
            // schema = { '$source': 'argv', index: 0 }
            if ('index' in schema) {
                return rawArgs[Number(schema['index'])]; // 'bobo4' --
            } else {
                return rawArgs;
            }
        });
        delete schematicOptions._;

        workflow.registry.addSmartDefaultProvider('projectName', (_schema: JsonObject) => {
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
                return this._workspace.getProjectByPath(normalize(process.cwd()))
                    || this._workspace.getDefaultProjectName();
            }
            return undefined;
        });
        workflow.reporter.subscribe((event: DryRunEvent) => {
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
                    loggingQueue.push(tags.oneLine`
            ${terminal.white('UPDATE')} ${eventPath} (${event.content.length} bytes)
          `);
                    break;
                case 'create':
                    loggingQueue.push(tags.oneLine`
            ${terminal.green('CREATE')} ${eventPath} (${event.content.length} bytes)
          `);
                    break;
                case 'delete':
                    loggingQueue.push(`${terminal.yellow('DELETE')} ${eventPath}`);
                    break;
                case 'rename':
                    loggingQueue.push(`${terminal.blue('RENAME')} ${eventPath} => ${event.to}`);
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

        return new Promise<number | void>((resolve) => {
            const obj = {
                collection: collectionName,
                schematic: schematicName,
                options: schematicOptions,
                debug: debug,
                logger: this.logger as any,
                allowPrivate: this.allowPrivateSchematics,
            }
            workflow.execute({
                collection: collectionName,
                schematic: schematicName,
                options: schematicOptions,
                debug: debug,
                logger: this.logger as any,
                allowPrivate: this.allowPrivateSchematics,
            })
                .subscribe({
                    error: (err: Error) => {
                        // In case the workflow was not successful, show an appropriate error message.
                        if (err instanceof UnsuccessfulWorkflowExecution) {
                            // "See above" because we already printed the error.
                            this.logger.fatal('The Schematic workflow failed. See above.');
                        } else if (debug) {
                            this.logger.fatal(`An error occured:\n${err.message}\n${err.stack}`);
                        } else {
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

    protected removeCoreOptions(options: any): any {
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

    protected getOptions(options: GetOptionsOptions): Promise<GetOptionsResult> {
        // Make a copy.
        this._originalOptions = [...this.options];

        const collectionName = options.collectionName || getDefaultSchematicCollection();

        const collection = getCollection(collectionName);
        const schematic = getSchematic(collection, options.schematicName, this.allowPrivateSchematics);
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
            .map(key => ({ ...properties[key], ...{ name: strings.dasherize(key) } }))
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
                let aliases: string[] = [];
                if (opt.alias) {
                    aliases = [...aliases, opt.alias];
                }
                if (opt.aliases) {
                    aliases = [...aliases, ...opt.aliases];
                }
                const schematicDefault = opt.default;

                return {
                    ...opt,
                    aliases,
                    type,
                    schematicType,
                    default: undefined, // do not carry over schematics defaults
                    schematicDefault,
                    hidden: opt.visible === false,
                };
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
                } else if (a.$default.index > b.$default.index) {
                    return 1;
                } else {
                    return -1;
                }
            });

        return Promise.resolve({
            options: schematicOptions,
            arguments: schematicArguments,
        });
    }

    private _loadWorkspace() {
        if (this._workspace) {
            return;
        }
        const workspaceLoader = new WorkspaceLoader(this._host);

        try {
            workspaceLoader.loadWorkspace(this.project.root).pipe(take(1))
                .subscribe(
                    (workspace: experimental.workspace.Workspace) => this._workspace = workspace,
                    (err: Error) => {
                        if (!this.allowMissingWorkspace) {
                            // Ignore missing workspace
                            throw err;
                        }
                    },
            );
        } catch (err) {
            if (!this.allowMissingWorkspace) {
                // Ignore missing workspace
                throw err;
            }
        }
    }

    private _cleanDefaults<T, K extends keyof T>(defaults: T, undefinedOptions: string[]): T {
        (Object.keys(defaults) as K[])
            .filter(key => !undefinedOptions.map(strings.camelize).includes(key as any))
            .forEach(key => {
                delete defaults[key];
            });

        return defaults;
    }

    private readDefaults(collectionName: string, schematicName: string, options: any): {} {
        if (this._deAliasedName) {
            schematicName = this._deAliasedName;
        }

        const projectName = options.project;
        const defaults = getSchematicDefaults(collectionName, schematicName, projectName);

        // Get list of all undefined options.
        const undefinedOptions = this.options
            .filter(o => options[o.name] === undefined)
            .map(o => o.name);

        // Delete any default that is not undefined.
        this._cleanDefaults(defaults, undefinedOptions);

        return defaults;
    }
}
