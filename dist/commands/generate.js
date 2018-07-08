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
const command_1 = require("./command");
const schematic_command_1 = require("./schematic-command");
const config_1 = require("../util/config");
class GenerateCommand extends schematic_command_1.SchematicCommand {
    constructor() {
        super(...arguments);
        this.name = 'generate';
        this.description = 'Generates and/or modifies files based on a schematic.';
        this.scope = command_1.CommandScope.inProject;
        this.arguments = ['schematic'];
        this.options = [
            ...this.coreOptions,
        ];
        // 初始化
        this.initialized = false;
    }
    initialize(options) {
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            if (this.initialized) {
                return;
            }
            yield _super("initialize").call(this, options);
            this.initialized = true;
            const [collectionName, schematicName] = this.parseSchematicInfo(options);
            if (!!schematicName) {
                const schematicOptions = yield this.getOptions({
                    schematicName,
                    collectionName,
                });
                this.options = this.options.concat(schematicOptions.options);
                this.arguments = this.arguments.concat(schematicOptions.arguments.map(a => a.name));
            }
        });
    }
    run(options) {
        const [collectionName, schematicName] = this.parseSchematicInfo(options);
        // remove the schematic name from the options
        options._ = options._.slice(1);
        return this.runSchematic({
            collectionName,
            schematicName,
            schematicOptions: options,
            debug: options.debug,
            dryRun: options.dryRun,
            force: options.force,
        });
    }
    parseSchematicInfo(options) {
        let collectionName = config_1.getDefaultSchematicCollection();
        let schematicName = options._[0];
        if (schematicName) {
            if (schematicName.includes(':')) {
                [collectionName, schematicName] = schematicName.split(':', 2);
            }
        }
        return [collectionName, schematicName];
    }
}
GenerateCommand.aliases = ['g'];
exports.default = GenerateCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGUuanMiLCJzb3VyY2VSb290IjoiL1VzZXJzL2JvYm8vV29yay9zaGFyay1nZW5lcmF0ZS8iLCJzb3VyY2VzIjpbImNvbW1hbmRzL2dlbmVyYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSx1Q0FBaUQ7QUFDakQsMkRBQXVEO0FBQ3ZELDJDQUErRDtBQUUvRCxxQkFBcUMsU0FBUSxvQ0FBZ0I7SUFBN0Q7O1FBQ29CLFNBQUksR0FBRyxVQUFVLENBQUM7UUFDbEIsZ0JBQVcsR0FBRyx1REFBdUQsQ0FBQztRQUV0RSxVQUFLLEdBQUcsc0JBQVksQ0FBQyxTQUFTLENBQUM7UUFDeEMsY0FBUyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDMUIsWUFBTyxHQUFhO1lBQ3ZCLEdBQUcsSUFBSSxDQUFDLFdBQVc7U0FDdEIsQ0FBQztRQUVGLE1BQU07UUFDRSxnQkFBVyxHQUFHLEtBQUssQ0FBQztJQTJDaEMsQ0FBQztJQTFDZ0IsVUFBVSxDQUFDLE9BQVk7OztZQUNoQyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7Z0JBQ2xCLE9BQU87YUFDVjtZQUNELE1BQU0sb0JBQWdCLFlBQUMsT0FBTyxDQUFDLENBQUM7WUFDaEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7WUFDeEIsTUFBTSxDQUFDLGNBQWMsRUFBRSxhQUFhLENBQUMsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDekUsSUFBSSxDQUFDLENBQUMsYUFBYSxFQUFFO2dCQUNqQixNQUFNLGdCQUFnQixHQUFHLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQztvQkFDM0MsYUFBYTtvQkFDYixjQUFjO2lCQUNqQixDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDN0QsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7YUFDdkY7UUFDTCxDQUFDO0tBQUE7SUFFTSxHQUFHLENBQUMsT0FBWTtRQUNuQixNQUFNLENBQUMsY0FBYyxFQUFFLGFBQWEsQ0FBQyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN6RSw2Q0FBNkM7UUFDN0MsT0FBTyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMvQixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7WUFDckIsY0FBYztZQUNkLGFBQWE7WUFDYixnQkFBZ0IsRUFBRSxPQUFPO1lBQ3pCLEtBQUssRUFBRSxPQUFPLENBQUMsS0FBSztZQUNwQixNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU07WUFDdEIsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLO1NBQ3ZCLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFTyxrQkFBa0IsQ0FBQyxPQUFZO1FBQ25DLElBQUksY0FBYyxHQUFHLHNDQUE2QixFQUFFLENBQUM7UUFDckQsSUFBSSxhQUFhLEdBQVcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6QyxJQUFJLGFBQWEsRUFBRTtZQUNmLElBQUksYUFBYSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDN0IsQ0FBQyxjQUFjLEVBQUUsYUFBYSxDQUFDLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7YUFDakU7U0FDSjtRQUNELE9BQU8sQ0FBQyxjQUFjLEVBQUUsYUFBYSxDQUFDLENBQUM7SUFDM0MsQ0FBQzs7QUFqRGEsdUJBQU8sR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBSGxDLGtDQXNEQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbW1hbmRTY29wZSwgT3B0aW9uIH0gZnJvbSAnLi9jb21tYW5kJztcbmltcG9ydCB7IFNjaGVtYXRpY0NvbW1hbmQgfSBmcm9tICcuL3NjaGVtYXRpYy1jb21tYW5kJztcbmltcG9ydCB7IGdldERlZmF1bHRTY2hlbWF0aWNDb2xsZWN0aW9uIH0gZnJvbSAnLi4vdXRpbC9jb25maWcnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHZW5lcmF0ZUNvbW1hbmQgZXh0ZW5kcyBTY2hlbWF0aWNDb21tYW5kIHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgbmFtZSA9ICdnZW5lcmF0ZSc7XG4gICAgcHVibGljIHJlYWRvbmx5IGRlc2NyaXB0aW9uID0gJ0dlbmVyYXRlcyBhbmQvb3IgbW9kaWZpZXMgZmlsZXMgYmFzZWQgb24gYSBzY2hlbWF0aWMuJztcbiAgICBwdWJsaWMgc3RhdGljIGFsaWFzZXMgPSBbJ2cnXTtcbiAgICBwdWJsaWMgcmVhZG9ubHkgc2NvcGUgPSBDb21tYW5kU2NvcGUuaW5Qcm9qZWN0O1xuICAgIHB1YmxpYyBhcmd1bWVudHMgPSBbJ3NjaGVtYXRpYyddO1xuICAgIHB1YmxpYyBvcHRpb25zOiBPcHRpb25bXSA9IFtcbiAgICAgICAgLi4udGhpcy5jb3JlT3B0aW9ucyxcbiAgICBdO1xuXG4gICAgLy8g5Yid5aeL5YyWXG4gICAgcHJpdmF0ZSBpbml0aWFsaXplZCA9IGZhbHNlO1xuICAgIHB1YmxpYyBhc3luYyBpbml0aWFsaXplKG9wdGlvbnM6IGFueSkge1xuICAgICAgICBpZiAodGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHN1cGVyLmluaXRpYWxpemUob3B0aW9ucyk7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgICAgICBjb25zdCBbY29sbGVjdGlvbk5hbWUsIHNjaGVtYXRpY05hbWVdID0gdGhpcy5wYXJzZVNjaGVtYXRpY0luZm8ob3B0aW9ucyk7XG4gICAgICAgIGlmICghIXNjaGVtYXRpY05hbWUpIHtcbiAgICAgICAgICAgIGNvbnN0IHNjaGVtYXRpY09wdGlvbnMgPSBhd2FpdCB0aGlzLmdldE9wdGlvbnMoe1xuICAgICAgICAgICAgICAgIHNjaGVtYXRpY05hbWUsXG4gICAgICAgICAgICAgICAgY29sbGVjdGlvbk5hbWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucyA9IHRoaXMub3B0aW9ucy5jb25jYXQoc2NoZW1hdGljT3B0aW9ucy5vcHRpb25zKTtcbiAgICAgICAgICAgIHRoaXMuYXJndW1lbnRzID0gdGhpcy5hcmd1bWVudHMuY29uY2F0KHNjaGVtYXRpY09wdGlvbnMuYXJndW1lbnRzLm1hcChhID0+IGEubmFtZSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHJ1bihvcHRpb25zOiBhbnkpIHtcbiAgICAgICAgY29uc3QgW2NvbGxlY3Rpb25OYW1lLCBzY2hlbWF0aWNOYW1lXSA9IHRoaXMucGFyc2VTY2hlbWF0aWNJbmZvKG9wdGlvbnMpO1xuICAgICAgICAvLyByZW1vdmUgdGhlIHNjaGVtYXRpYyBuYW1lIGZyb20gdGhlIG9wdGlvbnNcbiAgICAgICAgb3B0aW9ucy5fID0gb3B0aW9ucy5fLnNsaWNlKDEpO1xuICAgICAgICByZXR1cm4gdGhpcy5ydW5TY2hlbWF0aWMoe1xuICAgICAgICAgICAgY29sbGVjdGlvbk5hbWUsXG4gICAgICAgICAgICBzY2hlbWF0aWNOYW1lLFxuICAgICAgICAgICAgc2NoZW1hdGljT3B0aW9uczogb3B0aW9ucyxcbiAgICAgICAgICAgIGRlYnVnOiBvcHRpb25zLmRlYnVnLFxuICAgICAgICAgICAgZHJ5UnVuOiBvcHRpb25zLmRyeVJ1bixcbiAgICAgICAgICAgIGZvcmNlOiBvcHRpb25zLmZvcmNlLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHBhcnNlU2NoZW1hdGljSW5mbyhvcHRpb25zOiBhbnkpIHtcbiAgICAgICAgbGV0IGNvbGxlY3Rpb25OYW1lID0gZ2V0RGVmYXVsdFNjaGVtYXRpY0NvbGxlY3Rpb24oKTtcbiAgICAgICAgbGV0IHNjaGVtYXRpY05hbWU6IHN0cmluZyA9IG9wdGlvbnMuX1swXTtcbiAgICAgICAgaWYgKHNjaGVtYXRpY05hbWUpIHtcbiAgICAgICAgICAgIGlmIChzY2hlbWF0aWNOYW1lLmluY2x1ZGVzKCc6JykpIHtcbiAgICAgICAgICAgICAgICBbY29sbGVjdGlvbk5hbWUsIHNjaGVtYXRpY05hbWVdID0gc2NoZW1hdGljTmFtZS5zcGxpdCgnOicsIDIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbY29sbGVjdGlvbk5hbWUsIHNjaGVtYXRpY05hbWVdO1xuICAgIH1cblxufVxuIl19