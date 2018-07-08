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
var CommandScope;
(function (CommandScope) {
    CommandScope[CommandScope["everywhere"] = 0] = "everywhere";
    CommandScope[CommandScope["inProject"] = 1] = "inProject";
    CommandScope[CommandScope["outsideProject"] = 2] = "outsideProject";
})(CommandScope = exports.CommandScope || (exports.CommandScope = {}));
var ArgumentStrategy;
(function (ArgumentStrategy) {
    ArgumentStrategy[ArgumentStrategy["MapToOptions"] = 0] = "MapToOptions";
    ArgumentStrategy[ArgumentStrategy["Nothing"] = 1] = "Nothing";
})(ArgumentStrategy = exports.ArgumentStrategy || (exports.ArgumentStrategy = {}));
class Command {
    constructor(context, logger) {
        this.allowMissingWorkspace = false;
        this.argStrategy = ArgumentStrategy.MapToOptions;
        this.hidden = false;
        this.unknown = false;
        this.scope = CommandScope.everywhere;
        this.logger = logger;
        if (context) {
            this.project = context.project;
        }
    }
    initializeRaw(args) {
        return __awaiter(this, void 0, void 0, function* () {
            this._rawArgs = args;
            return args;
        });
    }
    initialize(_options) {
        return __awaiter(this, void 0, void 0, function* () {
            return;
        });
    }
    validate(_options) {
        return true;
    }
    printHelp(_options) {
        this.printHelpUsage(this.name, this.arguments, this.options);
        this.printHelpOptions(this.options);
    }
    printHelpUsage(name, args, options) {
        const argDisplay = args && args.length > 0
            ? ' ' + args.map(a => `<${a}>`).join(' ')
            : '';
        const optionsDisplay = options && options.length > 0
            ? ` [options]`
            : ``;
        this.logger.info(`usage: ng ${name}${argDisplay}${optionsDisplay}`);
    }
    printHelpOptions(options) {
        if (options && this.options.length > 0) {
            this.logger.info(`options:`);
            this.options
                .filter(o => !o.hidden)
                .sort((a, b) => a.name >= b.name ? 1 : -1)
                .forEach(o => {
                const aliases = o.aliases && o.aliases.length > 0
                    ? '(' + o.aliases.map(a => `-${a}`).join(' ') + ')'
                    : '';
                this.logger.info(`  ${core_1.terminal.cyan('--' + o.name)} ${aliases}`);
                this.logger.info(`    ${o.description}`);
            });
        }
    }
}
exports.Command = Command;
class Option {
    constructor() {
        this.hidden = false;
    }
}
exports.Option = Option;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZC5qcyIsInNvdXJjZVJvb3QiOiIvVXNlcnMvYm9iby9Xb3JrL3NoYXJrLWdlbmVyYXRlLyIsInNvdXJjZXMiOlsiY29tbWFuZHMvY29tbWFuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsNkRBQTZEO0FBQzdELCtDQUF5RDtBQVF6RCxJQUFZLFlBSVg7QUFKRCxXQUFZLFlBQVk7SUFDcEIsMkRBQVUsQ0FBQTtJQUNWLHlEQUFTLENBQUE7SUFDVCxtRUFBYyxDQUFBO0FBQ2xCLENBQUMsRUFKVyxZQUFZLEdBQVosb0JBQVksS0FBWixvQkFBWSxRQUl2QjtBQUVELElBQVksZ0JBR1g7QUFIRCxXQUFZLGdCQUFnQjtJQUN4Qix1RUFBWSxDQUFBO0lBQ1osNkRBQU8sQ0FBQTtBQUNYLENBQUMsRUFIVyxnQkFBZ0IsR0FBaEIsd0JBQWdCLEtBQWhCLHdCQUFnQixRQUczQjtBQUVEO0lBSUksWUFBWSxPQUF1QixFQUFFLE1BQXNCO1FBRnBELDBCQUFxQixHQUFHLEtBQUssQ0FBQztRQTBEOUIsZ0JBQVcsR0FBRyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUM7UUFDNUMsV0FBTSxHQUFHLEtBQUssQ0FBQztRQUNmLFlBQU8sR0FBRyxLQUFLLENBQUM7UUFDaEIsVUFBSyxHQUFHLFlBQVksQ0FBQyxVQUFVLENBQUM7UUExRG5DLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksT0FBTyxFQUFFO1lBQ1QsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO1NBQ2xDO0lBQ0wsQ0FBQztJQUVLLGFBQWEsQ0FBQyxJQUFjOztZQUM5QixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztZQUVyQixPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO0tBQUE7SUFDSyxVQUFVLENBQUMsUUFBYTs7WUFDMUIsT0FBTztRQUNYLENBQUM7S0FBQTtJQUVELFFBQVEsQ0FBQyxRQUFXO1FBQ2hCLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxTQUFTLENBQUMsUUFBVztRQUNqQixJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDN0QsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRVMsY0FBYyxDQUFDLElBQVksRUFBRSxJQUFjLEVBQUUsT0FBaUI7UUFDcEUsTUFBTSxVQUFVLEdBQUcsSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQztZQUN0QyxDQUFDLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUN6QyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQ1QsTUFBTSxjQUFjLEdBQUcsT0FBTyxJQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQztZQUNoRCxDQUFDLENBQUMsWUFBWTtZQUNkLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDVCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLElBQUksR0FBRyxVQUFVLEdBQUcsY0FBYyxFQUFFLENBQUMsQ0FBQztJQUN4RSxDQUFDO0lBRVMsZ0JBQWdCLENBQUMsT0FBaUI7UUFDeEMsSUFBSSxPQUFPLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQ3BDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzdCLElBQUksQ0FBQyxPQUFPO2lCQUNQLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztpQkFDdEIsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUN6QyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ1QsTUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDO29CQUM3QyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHO29CQUNuRCxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNULElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssZUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLE9BQU8sRUFBRSxDQUFDLENBQUM7Z0JBQ2pFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDN0MsQ0FBQyxDQUFDLENBQUM7U0FDVjtJQUNMLENBQUM7Q0FhSjtBQWxFRCwwQkFrRUM7QUFNRDtJQUFBO1FBU2EsV0FBTSxHQUFhLEtBQUssQ0FBQztJQUN0QyxDQUFDO0NBQUE7QUFWRCx3QkFVQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIHRzbGludDpkaXNhYmxlOm5vLWdsb2JhbC10c2xpbnQtZGlzYWJsZSBuby1hbnkgZmlsZS1oZWFkZXJcbmltcG9ydCB7IGxvZ2dpbmcsIHRlcm1pbmFsIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuXG5leHBvcnQgaW50ZXJmYWNlIENvbW1hbmRDb25zdHJ1Y3RvciB7XG4gICAgbmV3KGNvbnRleHQ6IENvbW1hbmRDb250ZXh0LCBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyKTogQ29tbWFuZDtcbiAgICBhbGlhc2VzOiBzdHJpbmdbXTtcbiAgICBzY29wZTogQ29tbWFuZFNjb3BlLmV2ZXJ5d2hlcmU7XG59XG5cbmV4cG9ydCBlbnVtIENvbW1hbmRTY29wZSB7XG4gICAgZXZlcnl3aGVyZSxcbiAgICBpblByb2plY3QsXG4gICAgb3V0c2lkZVByb2plY3QsXG59XG5cbmV4cG9ydCBlbnVtIEFyZ3VtZW50U3RyYXRlZ3kge1xuICAgIE1hcFRvT3B0aW9ucyxcbiAgICBOb3RoaW5nLFxufVxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQ29tbWFuZDxUID0gYW55PiB7XG4gICAgcHJvdGVjdGVkIF9yYXdBcmdzOiBzdHJpbmdbXTtcbiAgICBwdWJsaWMgYWxsb3dNaXNzaW5nV29ya3NwYWNlID0gZmFsc2U7XG5cbiAgICBjb25zdHJ1Y3Rvcihjb250ZXh0OiBDb21tYW5kQ29udGV4dCwgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlcikge1xuICAgICAgICB0aGlzLmxvZ2dlciA9IGxvZ2dlcjtcbiAgICAgICAgaWYgKGNvbnRleHQpIHtcbiAgICAgICAgICAgIHRoaXMucHJvamVjdCA9IGNvbnRleHQucHJvamVjdDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGluaXRpYWxpemVSYXcoYXJnczogc3RyaW5nW10pOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB0aGlzLl9yYXdBcmdzID0gYXJncztcblxuICAgICAgICByZXR1cm4gYXJncztcbiAgICB9XG4gICAgYXN5bmMgaW5pdGlhbGl6ZShfb3B0aW9uczogYW55KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YWxpZGF0ZShfb3B0aW9uczogVCk6IGJvb2xlYW4gfCBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcHJpbnRIZWxwKF9vcHRpb25zOiBUKTogdm9pZCB7XG4gICAgICAgIHRoaXMucHJpbnRIZWxwVXNhZ2UodGhpcy5uYW1lLCB0aGlzLmFyZ3VtZW50cywgdGhpcy5vcHRpb25zKTtcbiAgICAgICAgdGhpcy5wcmludEhlbHBPcHRpb25zKHRoaXMub3B0aW9ucyk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHByaW50SGVscFVzYWdlKG5hbWU6IHN0cmluZywgYXJnczogc3RyaW5nW10sIG9wdGlvbnM6IE9wdGlvbltdKSB7XG4gICAgICAgIGNvbnN0IGFyZ0Rpc3BsYXkgPSBhcmdzICYmIGFyZ3MubGVuZ3RoID4gMFxuICAgICAgICAgICAgPyAnICcgKyBhcmdzLm1hcChhID0+IGA8JHthfT5gKS5qb2luKCcgJylcbiAgICAgICAgICAgIDogJyc7XG4gICAgICAgIGNvbnN0IG9wdGlvbnNEaXNwbGF5ID0gb3B0aW9ucyAmJiBvcHRpb25zLmxlbmd0aCA+IDBcbiAgICAgICAgICAgID8gYCBbb3B0aW9uc11gXG4gICAgICAgICAgICA6IGBgO1xuICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKGB1c2FnZTogbmcgJHtuYW1lfSR7YXJnRGlzcGxheX0ke29wdGlvbnNEaXNwbGF5fWApO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBwcmludEhlbHBPcHRpb25zKG9wdGlvbnM6IE9wdGlvbltdKSB7XG4gICAgICAgIGlmIChvcHRpb25zICYmIHRoaXMub3B0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKGBvcHRpb25zOmApO1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zXG4gICAgICAgICAgICAgICAgLmZpbHRlcihvID0+ICFvLmhpZGRlbilcbiAgICAgICAgICAgICAgICAuc29ydCgoYSwgYikgPT4gYS5uYW1lID49IGIubmFtZSA/IDEgOiAtMSlcbiAgICAgICAgICAgICAgICAuZm9yRWFjaChvID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWxpYXNlcyA9IG8uYWxpYXNlcyAmJiBvLmFsaWFzZXMubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgICAgICAgICAgPyAnKCcgKyBvLmFsaWFzZXMubWFwKGEgPT4gYC0ke2F9YCkuam9pbignICcpICsgJyknXG4gICAgICAgICAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKGAgICR7dGVybWluYWwuY3lhbignLS0nICsgby5uYW1lKX0gJHthbGlhc2VzfWApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKGAgICAgJHtvLmRlc2NyaXB0aW9ufWApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYWJzdHJhY3QgcnVuKG9wdGlvbnM6IFQpOiBudW1iZXIgfCB2b2lkIHwgUHJvbWlzZTxudW1iZXIgfCB2b2lkPjtcbiAgICBhYnN0cmFjdCByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gICAgYWJzdHJhY3QgcmVhZG9ubHkgZGVzY3JpcHRpb246IHN0cmluZztcbiAgICBhYnN0cmFjdCByZWFkb25seSBhcmd1bWVudHM6IHN0cmluZ1tdO1xuICAgIGFic3RyYWN0IHJlYWRvbmx5IG9wdGlvbnM6IE9wdGlvbltdO1xuICAgIHB1YmxpYyBhcmdTdHJhdGVneSA9IEFyZ3VtZW50U3RyYXRlZ3kuTWFwVG9PcHRpb25zO1xuICAgIHB1YmxpYyBoaWRkZW4gPSBmYWxzZTtcbiAgICBwdWJsaWMgdW5rbm93biA9IGZhbHNlO1xuICAgIHB1YmxpYyBzY29wZSA9IENvbW1hbmRTY29wZS5ldmVyeXdoZXJlO1xuICAgIHByb3RlY3RlZCByZWFkb25seSBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyO1xuICAgIHByb3RlY3RlZCByZWFkb25seSBwcm9qZWN0OiBhbnk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tbWFuZENvbnRleHQge1xuICAgIHByb2plY3Q6IGFueTtcbn1cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE9wdGlvbiB7XG4gICAgYWJzdHJhY3QgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICAgIGFic3RyYWN0IHJlYWRvbmx5IGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gICAgcmVhZG9ubHkgZGVmYXVsdD86IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW47XG4gICAgcmVhZG9ubHkgcmVxdWlyZWQ/OiBib29sZWFuO1xuICAgIGFic3RyYWN0IHJlYWRvbmx5IGFsaWFzZXM/OiBzdHJpbmdbXTtcbiAgICBhYnN0cmFjdCByZWFkb25seSB0eXBlOiBhbnk7XG4gICAgcmVhZG9ubHkgZm9ybWF0Pzogc3RyaW5nO1xuICAgIHJlYWRvbmx5IHZhbHVlcz86IGFueVtdO1xuICAgIHJlYWRvbmx5IGhpZGRlbj86IGJvb2xlYW4gPSBmYWxzZTtcbn1cbiJdfQ==