// tslint:disable:no-global-tslint-disable file-header
import { logging, terminal } from '@angular-devkit/core';
import { filter } from 'rxjs/operators';
import { runCommand } from '../commands/command-runner';
import { getProjectDetails } from '../util/project';


function loadCommands() {
    return {
        // Schematics generate commands.
        'generate': require('../commands/generate').default,
    };
}

const cli = async function (options: { testing?: boolean, cliArgs: string[] }) {
    const commands = loadCommands();
    const logger = new logging.IndentLogger('cling');
    let loggingSubscription;
    if (!options.testing) {
        loggingSubscription = initializeLogging(logger);
    }

    let projectDetails = getProjectDetails();
    if (projectDetails === null) {
        projectDetails = { root: process.cwd() };
    }
    const context = {
        project: projectDetails,
    };

    try {
        const maybeExitCode = await runCommand(commands, options.cliArgs, logger, context);
        if (typeof maybeExitCode === 'number') {
            console.assert(Number.isInteger(maybeExitCode));

            return maybeExitCode;
        }

        return 0;
    } catch (err) {
        if (err instanceof Error) {
            logger.fatal(err.message);
            if (err.stack) {
                logger.fatal(err.stack);
            }
        } else if (typeof err === 'string') {
            logger.fatal(err);
        } else if (typeof err === 'number') {
            // Log nothing.
        } else {
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
}

// Initialize logging.
function initializeLogging(logger: logging.Logger) {
    return logger
        .pipe(filter(entry => (entry.level != 'debug')))
        .subscribe(entry => {
            let color = (x: string) => terminal.dim(terminal.white(x));
            let output = process.stdout;
            switch (entry.level) {
                case 'info':
                    color = terminal.white;
                    break;
                case 'warn':
                    color = terminal.yellow;
                    break;
                case 'error':
                    color = terminal.red;
                    output = process.stderr;
                    break;
                case 'fatal':
                    color = (x) => terminal.bold(terminal.red(x));
                    output = process.stderr;
                    break;
            }

            output.write(color(entry.message) + '\n');
        });
}

export default cli