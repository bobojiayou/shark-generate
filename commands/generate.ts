import { CommandScope, Option } from './command';
import { SchematicCommand } from './schematic-command';
import { getDefaultSchematicCollection } from '../util/config';

export default class GenerateCommand extends SchematicCommand {
    public readonly name = 'generate';
    public readonly description = 'Generates and/or modifies files based on a schematic.';
    public static aliases = ['g'];
    public readonly scope = CommandScope.inProject;
    public arguments = ['schematic'];
    public options: Option[] = [
        ...this.coreOptions,
    ];

    // 初始化
    private initialized = false;
    public async initialize(options: any) {
        if (this.initialized) {
            return;
        }
        await super.initialize(options);
        this.initialized = true;
        const [collectionName, schematicName] = this.parseSchematicInfo(options);
        if (!!schematicName) {
            const schematicOptions = await this.getOptions({
                schematicName,
                collectionName,
            });
            this.options = this.options.concat(schematicOptions.options);
            this.arguments = this.arguments.concat(schematicOptions.arguments.map(a => a.name));
        }
    }

    public run(options: any) {
        const [collectionName, schematicName] = this.parseSchematicInfo(options);
        console.log('--collectionName--', collectionName, )
        console.log('--schematicName--', schematicName, )
        // remove the schematic name from the options
        options._ = options._.slice(1);
        console.log('--options--')
        console.log(options)
        return this.runSchematic({
            collectionName,
            schematicName,
            schematicOptions: options,
            debug: options.debug,
            dryRun: options.dryRun,
            force: options.force,
        });
    }

    private parseSchematicInfo(options: any) {
        let collectionName = getDefaultSchematicCollection();
        let schematicName: string = options._[0];
        if (schematicName) {
            if (schematicName.includes(':')) {
                [collectionName, schematicName] = schematicName.split(':', 2);
            }
        }
        return [collectionName, schematicName];
    }

}
