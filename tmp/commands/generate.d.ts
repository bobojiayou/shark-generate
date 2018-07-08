import { CommandScope, Option } from './command';
import { SchematicCommand } from './schematic-command';
export default class GenerateCommand extends SchematicCommand {
    readonly name: string;
    readonly description: string;
    static aliases: string[];
    readonly scope: CommandScope;
    arguments: string[];
    options: Option[];
    private initialized;
    initialize(options: any): Promise<void>;
    run(options: any): Promise<number | void>;
    private parseSchematicInfo;
}
