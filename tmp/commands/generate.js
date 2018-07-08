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
        console.log('--collectionName--', collectionName);
        console.log('--schematicName--', schematicName);
        // remove the schematic name from the options
        options._ = options._.slice(1);
        console.log('--options--');
        console.log(options);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGUuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbImNvbW1hbmRzL2dlbmVyYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSx1Q0FBaUQ7QUFDakQsMkRBQXVEO0FBQ3ZELDJDQUErRDtBQUUvRCxxQkFBcUMsU0FBUSxvQ0FBZ0I7SUFBN0Q7O1FBQ29CLFNBQUksR0FBRyxVQUFVLENBQUM7UUFDbEIsZ0JBQVcsR0FBRyx1REFBdUQsQ0FBQztRQUV0RSxVQUFLLEdBQUcsc0JBQVksQ0FBQyxTQUFTLENBQUM7UUFDeEMsY0FBUyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDMUIsWUFBTyxHQUFhO1lBQ3ZCLEdBQUcsSUFBSSxDQUFDLFdBQVc7U0FDdEIsQ0FBQztRQUVGLE1BQU07UUFDRSxnQkFBVyxHQUFHLEtBQUssQ0FBQztJQStDaEMsQ0FBQztJQTlDZ0IsVUFBVSxDQUFDLE9BQVk7OztZQUNoQyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7Z0JBQ2xCLE9BQU87YUFDVjtZQUNELE1BQU0sb0JBQWdCLFlBQUMsT0FBTyxDQUFDLENBQUM7WUFDaEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7WUFDeEIsTUFBTSxDQUFDLGNBQWMsRUFBRSxhQUFhLENBQUMsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDekUsSUFBSSxDQUFDLENBQUMsYUFBYSxFQUFFO2dCQUNqQixNQUFNLGdCQUFnQixHQUFHLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQztvQkFDM0MsYUFBYTtvQkFDYixjQUFjO2lCQUNqQixDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDN0QsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7YUFDdkY7UUFDTCxDQUFDO0tBQUE7SUFFTSxHQUFHLENBQUMsT0FBWTtRQUNuQixNQUFNLENBQUMsY0FBYyxFQUFFLGFBQWEsQ0FBQyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN6RSxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixFQUFFLGNBQWMsQ0FBRyxDQUFBO1FBQ25ELE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLEVBQUUsYUFBYSxDQUFHLENBQUE7UUFDakQsNkNBQTZDO1FBQzdDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDL0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQTtRQUMxQixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQ3BCLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztZQUNyQixjQUFjO1lBQ2QsYUFBYTtZQUNiLGdCQUFnQixFQUFFLE9BQU87WUFDekIsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLO1lBQ3BCLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTTtZQUN0QixLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUs7U0FDdkIsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVPLGtCQUFrQixDQUFDLE9BQVk7UUFDbkMsSUFBSSxjQUFjLEdBQUcsc0NBQTZCLEVBQUUsQ0FBQztRQUNyRCxJQUFJLGFBQWEsR0FBVyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pDLElBQUksYUFBYSxFQUFFO1lBQ2YsSUFBSSxhQUFhLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUM3QixDQUFDLGNBQWMsRUFBRSxhQUFhLENBQUMsR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQzthQUNqRTtTQUNKO1FBQ0QsT0FBTyxDQUFDLGNBQWMsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUMzQyxDQUFDOztBQXJEYSx1QkFBTyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7QUFIbEMsa0NBMERDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tbWFuZFNjb3BlLCBPcHRpb24gfSBmcm9tICcuL2NvbW1hbmQnO1xuaW1wb3J0IHsgU2NoZW1hdGljQ29tbWFuZCB9IGZyb20gJy4vc2NoZW1hdGljLWNvbW1hbmQnO1xuaW1wb3J0IHsgZ2V0RGVmYXVsdFNjaGVtYXRpY0NvbGxlY3Rpb24gfSBmcm9tICcuLi91dGlsL2NvbmZpZyc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdlbmVyYXRlQ29tbWFuZCBleHRlbmRzIFNjaGVtYXRpY0NvbW1hbmQge1xuICAgIHB1YmxpYyByZWFkb25seSBuYW1lID0gJ2dlbmVyYXRlJztcbiAgICBwdWJsaWMgcmVhZG9ubHkgZGVzY3JpcHRpb24gPSAnR2VuZXJhdGVzIGFuZC9vciBtb2RpZmllcyBmaWxlcyBiYXNlZCBvbiBhIHNjaGVtYXRpYy4nO1xuICAgIHB1YmxpYyBzdGF0aWMgYWxpYXNlcyA9IFsnZyddO1xuICAgIHB1YmxpYyByZWFkb25seSBzY29wZSA9IENvbW1hbmRTY29wZS5pblByb2plY3Q7XG4gICAgcHVibGljIGFyZ3VtZW50cyA9IFsnc2NoZW1hdGljJ107XG4gICAgcHVibGljIG9wdGlvbnM6IE9wdGlvbltdID0gW1xuICAgICAgICAuLi50aGlzLmNvcmVPcHRpb25zLFxuICAgIF07XG5cbiAgICAvLyDliJ3lp4vljJZcbiAgICBwcml2YXRlIGluaXRpYWxpemVkID0gZmFsc2U7XG4gICAgcHVibGljIGFzeW5jIGluaXRpYWxpemUob3B0aW9uczogYW55KSB7XG4gICAgICAgIGlmICh0aGlzLmluaXRpYWxpemVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgc3VwZXIuaW5pdGlhbGl6ZShvcHRpb25zKTtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gICAgICAgIGNvbnN0IFtjb2xsZWN0aW9uTmFtZSwgc2NoZW1hdGljTmFtZV0gPSB0aGlzLnBhcnNlU2NoZW1hdGljSW5mbyhvcHRpb25zKTtcbiAgICAgICAgaWYgKCEhc2NoZW1hdGljTmFtZSkge1xuICAgICAgICAgICAgY29uc3Qgc2NoZW1hdGljT3B0aW9ucyA9IGF3YWl0IHRoaXMuZ2V0T3B0aW9ucyh7XG4gICAgICAgICAgICAgICAgc2NoZW1hdGljTmFtZSxcbiAgICAgICAgICAgICAgICBjb2xsZWN0aW9uTmFtZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zID0gdGhpcy5vcHRpb25zLmNvbmNhdChzY2hlbWF0aWNPcHRpb25zLm9wdGlvbnMpO1xuICAgICAgICAgICAgdGhpcy5hcmd1bWVudHMgPSB0aGlzLmFyZ3VtZW50cy5jb25jYXQoc2NoZW1hdGljT3B0aW9ucy5hcmd1bWVudHMubWFwKGEgPT4gYS5uYW1lKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgcnVuKG9wdGlvbnM6IGFueSkge1xuICAgICAgICBjb25zdCBbY29sbGVjdGlvbk5hbWUsIHNjaGVtYXRpY05hbWVdID0gdGhpcy5wYXJzZVNjaGVtYXRpY0luZm8ob3B0aW9ucyk7XG4gICAgICAgIGNvbnNvbGUubG9nKCctLWNvbGxlY3Rpb25OYW1lLS0nLCBjb2xsZWN0aW9uTmFtZSwgKVxuICAgICAgICBjb25zb2xlLmxvZygnLS1zY2hlbWF0aWNOYW1lLS0nLCBzY2hlbWF0aWNOYW1lLCApXG4gICAgICAgIC8vIHJlbW92ZSB0aGUgc2NoZW1hdGljIG5hbWUgZnJvbSB0aGUgb3B0aW9uc1xuICAgICAgICBvcHRpb25zLl8gPSBvcHRpb25zLl8uc2xpY2UoMSk7XG4gICAgICAgIGNvbnNvbGUubG9nKCctLW9wdGlvbnMtLScpXG4gICAgICAgIGNvbnNvbGUubG9nKG9wdGlvbnMpXG4gICAgICAgIHJldHVybiB0aGlzLnJ1blNjaGVtYXRpYyh7XG4gICAgICAgICAgICBjb2xsZWN0aW9uTmFtZSxcbiAgICAgICAgICAgIHNjaGVtYXRpY05hbWUsXG4gICAgICAgICAgICBzY2hlbWF0aWNPcHRpb25zOiBvcHRpb25zLFxuICAgICAgICAgICAgZGVidWc6IG9wdGlvbnMuZGVidWcsXG4gICAgICAgICAgICBkcnlSdW46IG9wdGlvbnMuZHJ5UnVuLFxuICAgICAgICAgICAgZm9yY2U6IG9wdGlvbnMuZm9yY2UsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgcGFyc2VTY2hlbWF0aWNJbmZvKG9wdGlvbnM6IGFueSkge1xuICAgICAgICBsZXQgY29sbGVjdGlvbk5hbWUgPSBnZXREZWZhdWx0U2NoZW1hdGljQ29sbGVjdGlvbigpO1xuICAgICAgICBsZXQgc2NoZW1hdGljTmFtZTogc3RyaW5nID0gb3B0aW9ucy5fWzBdO1xuICAgICAgICBpZiAoc2NoZW1hdGljTmFtZSkge1xuICAgICAgICAgICAgaWYgKHNjaGVtYXRpY05hbWUuaW5jbHVkZXMoJzonKSkge1xuICAgICAgICAgICAgICAgIFtjb2xsZWN0aW9uTmFtZSwgc2NoZW1hdGljTmFtZV0gPSBzY2hlbWF0aWNOYW1lLnNwbGl0KCc6JywgMik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFtjb2xsZWN0aW9uTmFtZSwgc2NoZW1hdGljTmFtZV07XG4gICAgfVxuXG59XG4iXX0=