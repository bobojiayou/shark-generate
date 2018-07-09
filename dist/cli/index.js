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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiL1VzZXJzL2JvYm8vV29yay9zaGFyay1nZW5lcmF0ZS8iLCJzb3VyY2VzIjpbImNsaS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsc0RBQXNEO0FBQ3RELCtDQUF5RDtBQUN6RCw4Q0FBd0M7QUFDeEMsK0RBQXdEO0FBQ3hELDZDQUFvRDtBQUdwRDtJQUNJLE9BQU87UUFDSCxnQ0FBZ0M7UUFDaEMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLE9BQU87S0FDdEQsQ0FBQztBQUNOLENBQUM7QUFFRCxNQUFNLEdBQUcsR0FBRyxVQUFnQixPQUFpRDs7UUFDekUsTUFBTSxRQUFRLEdBQUcsWUFBWSxFQUFFLENBQUM7UUFDaEMsTUFBTSxNQUFNLEdBQUcsSUFBSSxjQUFPLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2pELElBQUksbUJBQW1CLENBQUM7UUFDeEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUU7WUFDbEIsbUJBQW1CLEdBQUcsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDbkQ7UUFFRCxJQUFJLGNBQWMsR0FBRywyQkFBaUIsRUFBRSxDQUFDO1FBQ3pDLElBQUksY0FBYyxLQUFLLElBQUksRUFBRTtZQUN6QixjQUFjLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUM7U0FDNUM7UUFDRCxNQUFNLE9BQU8sR0FBRztZQUNaLE9BQU8sRUFBRSxjQUFjO1NBQzFCLENBQUM7UUFFRixJQUFJO1lBQ0EsTUFBTSxhQUFhLEdBQUcsTUFBTSwyQkFBVSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNuRixJQUFJLE9BQU8sYUFBYSxLQUFLLFFBQVEsRUFBRTtnQkFDbkMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7Z0JBRWhELE9BQU8sYUFBYSxDQUFDO2FBQ3hCO1lBRUQsT0FBTyxDQUFDLENBQUM7U0FDWjtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1YsSUFBSSxHQUFHLFlBQVksS0FBSyxFQUFFO2dCQUN0QixNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDMUIsSUFBSSxHQUFHLENBQUMsS0FBSyxFQUFFO29CQUNYLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO2lCQUMzQjthQUNKO2lCQUFNLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFO2dCQUNoQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ3JCO2lCQUFNLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFO2dCQUNoQyxlQUFlO2FBQ2xCO2lCQUFNO2dCQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMsK0JBQStCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2FBQ3ZFO1lBRUQsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFO2dCQUNqQixRQUFRLENBQUM7Z0JBQ1QsTUFBTSxHQUFHLENBQUM7YUFDYjtZQUVELElBQUksbUJBQW1CLEVBQUU7Z0JBQ3JCLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxDQUFDO2FBQ3JDO1lBRUQsT0FBTyxDQUFDLENBQUM7U0FDWjtJQUNMLENBQUM7Q0FBQSxDQUFBO0FBRUQsc0JBQXNCO0FBQ3RCLDJCQUEyQixNQUFzQjtJQUM3QyxPQUFPLE1BQU07U0FDUixJQUFJLENBQUMsa0JBQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDO1NBQy9DLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUNmLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBUyxFQUFFLEVBQUUsQ0FBQyxlQUFRLENBQUMsR0FBRyxDQUFDLGVBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzRCxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQzVCLFFBQVEsS0FBSyxDQUFDLEtBQUssRUFBRTtZQUNqQixLQUFLLE1BQU07Z0JBQ1AsS0FBSyxHQUFHLGVBQVEsQ0FBQyxLQUFLLENBQUM7Z0JBQ3ZCLE1BQU07WUFDVixLQUFLLE1BQU07Z0JBQ1AsS0FBSyxHQUFHLGVBQVEsQ0FBQyxNQUFNLENBQUM7Z0JBQ3hCLE1BQU07WUFDVixLQUFLLE9BQU87Z0JBQ1IsS0FBSyxHQUFHLGVBQVEsQ0FBQyxHQUFHLENBQUM7Z0JBQ3JCLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO2dCQUN4QixNQUFNO1lBQ1YsS0FBSyxPQUFPO2dCQUNSLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsZUFBUSxDQUFDLElBQUksQ0FBQyxlQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzlDLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO2dCQUN4QixNQUFNO1NBQ2I7UUFFRCxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDOUMsQ0FBQyxDQUFDLENBQUM7QUFDWCxDQUFDO0FBRUQsa0JBQWUsR0FBRyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLy8gdHNsaW50OmRpc2FibGU6bm8tZ2xvYmFsLXRzbGludC1kaXNhYmxlIGZpbGUtaGVhZGVyXG5pbXBvcnQgeyBsb2dnaW5nLCB0ZXJtaW5hbCB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IGZpbHRlciB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7IHJ1bkNvbW1hbmQgfSBmcm9tICcuLi9jb21tYW5kcy9jb21tYW5kLXJ1bm5lcic7XG5pbXBvcnQgeyBnZXRQcm9qZWN0RGV0YWlscyB9IGZyb20gJy4uL3V0aWwvcHJvamVjdCc7XG5cblxuZnVuY3Rpb24gbG9hZENvbW1hbmRzKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIC8vIFNjaGVtYXRpY3MgZ2VuZXJhdGUgY29tbWFuZHMuXG4gICAgICAgICdnZW5lcmF0ZSc6IHJlcXVpcmUoJy4uL2NvbW1hbmRzL2dlbmVyYXRlJykuZGVmYXVsdCxcbiAgICB9O1xufVxuXG5jb25zdCBjbGkgPSBhc3luYyBmdW5jdGlvbiAob3B0aW9uczogeyB0ZXN0aW5nPzogYm9vbGVhbiwgY2xpQXJnczogc3RyaW5nW10gfSkge1xuICAgIGNvbnN0IGNvbW1hbmRzID0gbG9hZENvbW1hbmRzKCk7XG4gICAgY29uc3QgbG9nZ2VyID0gbmV3IGxvZ2dpbmcuSW5kZW50TG9nZ2VyKCdjbGluZycpO1xuICAgIGxldCBsb2dnaW5nU3Vic2NyaXB0aW9uO1xuICAgIGlmICghb3B0aW9ucy50ZXN0aW5nKSB7XG4gICAgICAgIGxvZ2dpbmdTdWJzY3JpcHRpb24gPSBpbml0aWFsaXplTG9nZ2luZyhsb2dnZXIpO1xuICAgIH1cblxuICAgIGxldCBwcm9qZWN0RGV0YWlscyA9IGdldFByb2plY3REZXRhaWxzKCk7XG4gICAgaWYgKHByb2plY3REZXRhaWxzID09PSBudWxsKSB7XG4gICAgICAgIHByb2plY3REZXRhaWxzID0geyByb290OiBwcm9jZXNzLmN3ZCgpIH07XG4gICAgfVxuICAgIGNvbnN0IGNvbnRleHQgPSB7XG4gICAgICAgIHByb2plY3Q6IHByb2plY3REZXRhaWxzLFxuICAgIH07XG5cbiAgICB0cnkge1xuICAgICAgICBjb25zdCBtYXliZUV4aXRDb2RlID0gYXdhaXQgcnVuQ29tbWFuZChjb21tYW5kcywgb3B0aW9ucy5jbGlBcmdzLCBsb2dnZXIsIGNvbnRleHQpO1xuICAgICAgICBpZiAodHlwZW9mIG1heWJlRXhpdENvZGUgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBjb25zb2xlLmFzc2VydChOdW1iZXIuaXNJbnRlZ2VyKG1heWJlRXhpdENvZGUpKTtcblxuICAgICAgICAgICAgcmV0dXJuIG1heWJlRXhpdENvZGU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gMDtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgICAgICBsb2dnZXIuZmF0YWwoZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgICAgaWYgKGVyci5zdGFjaykge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5mYXRhbChlcnIuc3RhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBlcnIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBsb2dnZXIuZmF0YWwoZXJyKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZXJyID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgLy8gTG9nIG5vdGhpbmcuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsb2dnZXIuZmF0YWwoJ0FuIHVuZXhwZWN0ZWQgZXJyb3Igb2NjdXJlZDogJyArIEpTT04uc3RyaW5naWZ5KGVycikpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9wdGlvbnMudGVzdGluZykge1xuICAgICAgICAgICAgZGVidWdnZXI7XG4gICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobG9nZ2luZ1N1YnNjcmlwdGlvbikge1xuICAgICAgICAgICAgbG9nZ2luZ1N1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfVxufVxuXG4vLyBJbml0aWFsaXplIGxvZ2dpbmcuXG5mdW5jdGlvbiBpbml0aWFsaXplTG9nZ2luZyhsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyKSB7XG4gICAgcmV0dXJuIGxvZ2dlclxuICAgICAgICAucGlwZShmaWx0ZXIoZW50cnkgPT4gKGVudHJ5LmxldmVsICE9ICdkZWJ1ZycpKSlcbiAgICAgICAgLnN1YnNjcmliZShlbnRyeSA9PiB7XG4gICAgICAgICAgICBsZXQgY29sb3IgPSAoeDogc3RyaW5nKSA9PiB0ZXJtaW5hbC5kaW0odGVybWluYWwud2hpdGUoeCkpO1xuICAgICAgICAgICAgbGV0IG91dHB1dCA9IHByb2Nlc3Muc3Rkb3V0O1xuICAgICAgICAgICAgc3dpdGNoIChlbnRyeS5sZXZlbCkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ2luZm8nOlxuICAgICAgICAgICAgICAgICAgICBjb2xvciA9IHRlcm1pbmFsLndoaXRlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICd3YXJuJzpcbiAgICAgICAgICAgICAgICAgICAgY29sb3IgPSB0ZXJtaW5hbC55ZWxsb3c7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2Vycm9yJzpcbiAgICAgICAgICAgICAgICAgICAgY29sb3IgPSB0ZXJtaW5hbC5yZWQ7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dCA9IHByb2Nlc3Muc3RkZXJyO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdmYXRhbCc6XG4gICAgICAgICAgICAgICAgICAgIGNvbG9yID0gKHgpID0+IHRlcm1pbmFsLmJvbGQodGVybWluYWwucmVkKHgpKTtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0ID0gcHJvY2Vzcy5zdGRlcnI7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvdXRwdXQud3JpdGUoY29sb3IoZW50cnkubWVzc2FnZSkgKyAnXFxuJyk7XG4gICAgICAgIH0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGkiXX0=