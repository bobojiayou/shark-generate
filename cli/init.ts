
import { tags, terminal } from '@angular-devkit/core';
import { resolve } from '@angular-devkit/core/node';
import * as fs from 'fs';
import * as path from 'path';
import { SemVer } from 'semver';
import { isWarningEnabled } from '../util/config';

const packageJson = require('../../package.json');

function _fromPackageJson(cwd?: string) {
    cwd = cwd || process.cwd();

    do {
        const packageJsonPath = path.join(cwd, 'node_modules/@angular/cli/package.json');
        if (fs.existsSync(packageJsonPath)) {
            const content = fs.readFileSync(packageJsonPath, 'utf-8');
            if (content) {
                const json = JSON.parse(content);
                if (json['version']) {
                    return new SemVer(json['version']);
                }
            }
        }

        // Check the parent.
        cwd = path.dirname(cwd);
    } while (cwd != path.dirname(cwd));

    return null;
}

let cli;
try {
    const projectLocalCli = resolve(
        'shark-generate',
        {
            checkGlobal: false,
            basedir: process.cwd(),
            preserveSymlinks: true,
        },
    );
    // This was run from a global, check local version.
    const globalVersion = new SemVer(packageJson['version']);
    let localVersion;
    let shouldWarn = false;

    try {
        localVersion = _fromPackageJson();
        shouldWarn = localVersion != null && globalVersion.compare(localVersion) > 0;
    } catch (e) {
        // eslint-disable-next-line no-console
        shouldWarn = true;
    }

    if (shouldWarn && isWarningEnabled('versionMismatch')) {
        const warning = terminal.yellow(tags.stripIndents`
    Your global shark-generate CLI version (${globalVersion}) is greater than your local
    version (${localVersion}). The local shark-generate CLI version is used.

    To disable this warning use "sgx config -g cli.warnings.versionMismatch false".
    `);
        // Don't show warning colorised on `ng completion`
        if (process.argv[2] !== 'completion') {
            // eslint-disable-next-line no-console
            console.log(warning);
        } else {
            // eslint-disable-next-line no-console
            console.log(warning);
            process.exit(1);
        }
    }

    // No error implies a projectLocalCli, which will load whatever
    // version of ng-cli you have installed in a local package.json
    cli = require(projectLocalCli);
} catch {
    // If there is an error, resolve could not find the ng-cli
    // library from a package.json. Instead, include it from a relative
    // path to this script file (which is likely a globally installed
    // npm package). Most common cause for hitting this is `ng new`
    cli = require('./index');
}

if ('default' in cli) {
    cli = cli['default'];
}

cli({ cliArgs: process.argv.slice(2) })
    .then((exitCode: number) => {
        process.exit(exitCode);
    })
    .catch((err: Error) => {
        console.log('Unknown error: ' + err.toString());
        process.exit(127);
    });
