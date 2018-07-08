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
// tslint:disable:no-global-tslint-disable file-header
const core_1 = require("@angular-devkit/core");
const operators_1 = require("rxjs/operators");
const command_runner_1 = require("../commands/command-runner");
const project_1 = require("../util/project");
function loadCommands() {
    return {
        // Schematics generate commands.
        'generate': require('../commands/generate').default,
    };
}
const cli = function (options) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('--cliArgs--', options.cliArgs);
        const commands = loadCommands();
        const logger = new core_1.logging.IndentLogger('cling');
        let loggingSubscription;
        if (!options.testing) {
            loggingSubscription = initializeLogging(logger);
        }
        let projectDetails = project_1.getProjectDetails();
        if (projectDetails === null) {
            projectDetails = { root: process.cwd() };
        }
        const context = {
            project: projectDetails,
        };
        try {
            const maybeExitCode = yield command_runner_1.runCommand(commands, options.cliArgs, logger, context);
            if (typeof maybeExitCode === 'number') {
                console.assert(Number.isInteger(maybeExitCode));
                return maybeExitCode;
            }
            return 0;
        }
        catch (err) {
            if (err instanceof Error) {
                logger.fatal(err.message);
                if (err.stack) {
                    logger.fatal(err.stack);
                }
            }
            else if (typeof err === 'string') {
                logger.fatal(err);
            }
            else if (typeof err === 'number') {
                // Log nothing.
            }
            else {
                logger.fatal('An unexpected error occured: ' + JSON.stringify(err));
            }
            if (options.testing) {
                debugger;
                throw err;
            }
            if (loggingSubscription) {
                loggingSubscription.unsubscribe();
            }
            return 1;
        }
    });
};
// Initialize logging.
function initializeLogging(logger) {
    return logger
        .pipe(operators_1.filter(entry => (entry.level != 'debug')))
        .subscribe(entry => {
        let color = (x) => core_1.terminal.dim(core_1.terminal.white(x));
        let output = process.stdout;
        switch (entry.level) {
            case 'info':
                color = core_1.terminal.white;
                break;
            case 'warn':
                color = core_1.terminal.yellow;
                break;
            case 'error':
                color = core_1.terminal.red;
                output = process.stderr;
                break;
            case 'fatal':
                color = (x) => core_1.terminal.bold(core_1.terminal.red(x));
                output = process.stderr;
                break;
        }
        output.write(color(entry.message) + '\n');
    });
}
exports.default = cli;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiL1VzZXJzL2JvYm8vV29yay9zaGFyay1nZW5lcmF0ZS8iLCJzb3VyY2VzIjpbImNsaS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsc0RBQXNEO0FBQ3RELCtDQUF5RDtBQUN6RCw4Q0FBd0M7QUFDeEMsK0RBQXdEO0FBQ3hELDZDQUFvRDtBQUdwRDtJQUNJLE9BQU87UUFDSCxnQ0FBZ0M7UUFDaEMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLE9BQU87S0FDdEQsQ0FBQztBQUNOLENBQUM7QUFFRCxNQUFNLEdBQUcsR0FBRyxVQUFnQixPQUFpRDs7UUFDekUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQzNDLE1BQU0sUUFBUSxHQUFHLFlBQVksRUFBRSxDQUFDO1FBRWhDLE1BQU0sTUFBTSxHQUFHLElBQUksY0FBTyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNqRCxJQUFJLG1CQUFtQixDQUFDO1FBQ3hCLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFO1lBQ2xCLG1CQUFtQixHQUFHLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ25EO1FBRUQsSUFBSSxjQUFjLEdBQUcsMkJBQWlCLEVBQUUsQ0FBQztRQUN6QyxJQUFJLGNBQWMsS0FBSyxJQUFJLEVBQUU7WUFDekIsY0FBYyxHQUFHLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDO1NBQzVDO1FBQ0QsTUFBTSxPQUFPLEdBQUc7WUFDWixPQUFPLEVBQUUsY0FBYztTQUMxQixDQUFDO1FBRUYsSUFBSTtZQUNBLE1BQU0sYUFBYSxHQUFHLE1BQU0sMkJBQVUsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDbkYsSUFBSSxPQUFPLGFBQWEsS0FBSyxRQUFRLEVBQUU7Z0JBQ25DLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO2dCQUVoRCxPQUFPLGFBQWEsQ0FBQzthQUN4QjtZQUVELE9BQU8sQ0FBQyxDQUFDO1NBQ1o7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNWLElBQUksR0FBRyxZQUFZLEtBQUssRUFBRTtnQkFDdEIsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzFCLElBQUksR0FBRyxDQUFDLEtBQUssRUFBRTtvQkFDWCxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztpQkFDM0I7YUFDSjtpQkFBTSxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRTtnQkFDaEMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUNyQjtpQkFBTSxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRTtnQkFDaEMsZUFBZTthQUNsQjtpQkFBTTtnQkFDSCxNQUFNLENBQUMsS0FBSyxDQUFDLCtCQUErQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzthQUN2RTtZQUVELElBQUksT0FBTyxDQUFDLE9BQU8sRUFBRTtnQkFDakIsUUFBUSxDQUFDO2dCQUNULE1BQU0sR0FBRyxDQUFDO2FBQ2I7WUFFRCxJQUFJLG1CQUFtQixFQUFFO2dCQUNyQixtQkFBbUIsQ0FBQyxXQUFXLEVBQUUsQ0FBQzthQUNyQztZQUVELE9BQU8sQ0FBQyxDQUFDO1NBQ1o7SUFDTCxDQUFDO0NBQUEsQ0FBQTtBQUVELHNCQUFzQjtBQUN0QiwyQkFBMkIsTUFBc0I7SUFDN0MsT0FBTyxNQUFNO1NBQ1IsSUFBSSxDQUFDLGtCQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQztTQUMvQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDZixJQUFJLEtBQUssR0FBRyxDQUFDLENBQVMsRUFBRSxFQUFFLENBQUMsZUFBUSxDQUFDLEdBQUcsQ0FBQyxlQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0QsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztRQUM1QixRQUFRLEtBQUssQ0FBQyxLQUFLLEVBQUU7WUFDakIsS0FBSyxNQUFNO2dCQUNQLEtBQUssR0FBRyxlQUFRLENBQUMsS0FBSyxDQUFDO2dCQUN2QixNQUFNO1lBQ1YsS0FBSyxNQUFNO2dCQUNQLEtBQUssR0FBRyxlQUFRLENBQUMsTUFBTSxDQUFDO2dCQUN4QixNQUFNO1lBQ1YsS0FBSyxPQUFPO2dCQUNSLEtBQUssR0FBRyxlQUFRLENBQUMsR0FBRyxDQUFDO2dCQUNyQixNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztnQkFDeEIsTUFBTTtZQUNWLEtBQUssT0FBTztnQkFDUixLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLGVBQVEsQ0FBQyxJQUFJLENBQUMsZUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM5QyxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztnQkFDeEIsTUFBTTtTQUNiO1FBRUQsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO0lBQzlDLENBQUMsQ0FBQyxDQUFDO0FBQ1gsQ0FBQztBQUVELGtCQUFlLEdBQUcsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8vIHRzbGludDpkaXNhYmxlOm5vLWdsb2JhbC10c2xpbnQtZGlzYWJsZSBmaWxlLWhlYWRlclxuaW1wb3J0IHsgbG9nZ2luZywgdGVybWluYWwgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBmaWx0ZXIgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBydW5Db21tYW5kIH0gZnJvbSAnLi4vY29tbWFuZHMvY29tbWFuZC1ydW5uZXInO1xuaW1wb3J0IHsgZ2V0UHJvamVjdERldGFpbHMgfSBmcm9tICcuLi91dGlsL3Byb2plY3QnO1xuXG5cbmZ1bmN0aW9uIGxvYWRDb21tYW5kcygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICAvLyBTY2hlbWF0aWNzIGdlbmVyYXRlIGNvbW1hbmRzLlxuICAgICAgICAnZ2VuZXJhdGUnOiByZXF1aXJlKCcuLi9jb21tYW5kcy9nZW5lcmF0ZScpLmRlZmF1bHQsXG4gICAgfTtcbn1cblxuY29uc3QgY2xpID0gYXN5bmMgZnVuY3Rpb24gKG9wdGlvbnM6IHsgdGVzdGluZz86IGJvb2xlYW4sIGNsaUFyZ3M6IHN0cmluZ1tdIH0pIHtcbiAgICBjb25zb2xlLmxvZygnLS1jbGlBcmdzLS0nLCBvcHRpb25zLmNsaUFyZ3MpXG4gICAgY29uc3QgY29tbWFuZHMgPSBsb2FkQ29tbWFuZHMoKTtcblxuICAgIGNvbnN0IGxvZ2dlciA9IG5ldyBsb2dnaW5nLkluZGVudExvZ2dlcignY2xpbmcnKTtcbiAgICBsZXQgbG9nZ2luZ1N1YnNjcmlwdGlvbjtcbiAgICBpZiAoIW9wdGlvbnMudGVzdGluZykge1xuICAgICAgICBsb2dnaW5nU3Vic2NyaXB0aW9uID0gaW5pdGlhbGl6ZUxvZ2dpbmcobG9nZ2VyKTtcbiAgICB9XG5cbiAgICBsZXQgcHJvamVjdERldGFpbHMgPSBnZXRQcm9qZWN0RGV0YWlscygpO1xuICAgIGlmIChwcm9qZWN0RGV0YWlscyA9PT0gbnVsbCkge1xuICAgICAgICBwcm9qZWN0RGV0YWlscyA9IHsgcm9vdDogcHJvY2Vzcy5jd2QoKSB9O1xuICAgIH1cbiAgICBjb25zdCBjb250ZXh0ID0ge1xuICAgICAgICBwcm9qZWN0OiBwcm9qZWN0RGV0YWlscyxcbiAgICB9O1xuXG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgbWF5YmVFeGl0Q29kZSA9IGF3YWl0IHJ1bkNvbW1hbmQoY29tbWFuZHMsIG9wdGlvbnMuY2xpQXJncywgbG9nZ2VyLCBjb250ZXh0KTtcbiAgICAgICAgaWYgKHR5cGVvZiBtYXliZUV4aXRDb2RlID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgY29uc29sZS5hc3NlcnQoTnVtYmVyLmlzSW50ZWdlcihtYXliZUV4aXRDb2RlKSk7XG5cbiAgICAgICAgICAgIHJldHVybiBtYXliZUV4aXRDb2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgICAgbG9nZ2VyLmZhdGFsKGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgIGlmIChlcnIuc3RhY2spIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuZmF0YWwoZXJyLnN0YWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZXJyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgbG9nZ2VyLmZhdGFsKGVycik7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGVyciA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIC8vIExvZyBub3RoaW5nLlxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbG9nZ2VyLmZhdGFsKCdBbiB1bmV4cGVjdGVkIGVycm9yIG9jY3VyZWQ6ICcgKyBKU09OLnN0cmluZ2lmeShlcnIpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvcHRpb25zLnRlc3RpbmcpIHtcbiAgICAgICAgICAgIGRlYnVnZ2VyO1xuICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxvZ2dpbmdTdWJzY3JpcHRpb24pIHtcbiAgICAgICAgICAgIGxvZ2dpbmdTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAxO1xuICAgIH1cbn1cblxuLy8gSW5pdGlhbGl6ZSBsb2dnaW5nLlxuZnVuY3Rpb24gaW5pdGlhbGl6ZUxvZ2dpbmcobG9nZ2VyOiBsb2dnaW5nLkxvZ2dlcikge1xuICAgIHJldHVybiBsb2dnZXJcbiAgICAgICAgLnBpcGUoZmlsdGVyKGVudHJ5ID0+IChlbnRyeS5sZXZlbCAhPSAnZGVidWcnKSkpXG4gICAgICAgIC5zdWJzY3JpYmUoZW50cnkgPT4ge1xuICAgICAgICAgICAgbGV0IGNvbG9yID0gKHg6IHN0cmluZykgPT4gdGVybWluYWwuZGltKHRlcm1pbmFsLndoaXRlKHgpKTtcbiAgICAgICAgICAgIGxldCBvdXRwdXQgPSBwcm9jZXNzLnN0ZG91dDtcbiAgICAgICAgICAgIHN3aXRjaCAoZW50cnkubGV2ZWwpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdpbmZvJzpcbiAgICAgICAgICAgICAgICAgICAgY29sb3IgPSB0ZXJtaW5hbC53aGl0ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnd2Fybic6XG4gICAgICAgICAgICAgICAgICAgIGNvbG9yID0gdGVybWluYWwueWVsbG93O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdlcnJvcic6XG4gICAgICAgICAgICAgICAgICAgIGNvbG9yID0gdGVybWluYWwucmVkO1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQgPSBwcm9jZXNzLnN0ZGVycjtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnZmF0YWwnOlxuICAgICAgICAgICAgICAgICAgICBjb2xvciA9ICh4KSA9PiB0ZXJtaW5hbC5ib2xkKHRlcm1pbmFsLnJlZCh4KSk7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dCA9IHByb2Nlc3Muc3RkZXJyO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb3V0cHV0LndyaXRlKGNvbG9yKGVudHJ5Lm1lc3NhZ2UpICsgJ1xcbicpO1xuICAgICAgICB9KTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xpIl19