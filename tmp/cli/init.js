"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const node_1 = require("@angular-devkit/core/node");
const fs = require("fs");
const path = require("path");
const semver_1 = require("semver");
const config_1 = require("../util/config");
const packageJson = require('../../package.json');
function _fromPackageJson(cwd) {
    cwd = cwd || process.cwd();
    do {
        const packageJsonPath = path.join(cwd, 'node_modules/@angular/cli/package.json');
        if (fs.existsSync(packageJsonPath)) {
            const content = fs.readFileSync(packageJsonPath, 'utf-8');
            if (content) {
                const json = JSON.parse(content);
                if (json['version']) {
                    return new semver_1.SemVer(json['version']);
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
    console.log('--packageJson--', packageJson);
    const projectLocalCli = node_1.resolve('shark-generate', {
        checkGlobal: false,
        basedir: process.cwd(),
        preserveSymlinks: true,
    });
    // This was run from a global, check local version.
    const globalVersion = new semver_1.SemVer(packageJson['version']);
    console.log('--globalVersion--', globalVersion);
    let localVersion;
    let shouldWarn = false;
    try {
        localVersion = _fromPackageJson();
        console.log('--localVersion--', localVersion);
        shouldWarn = localVersion != null && globalVersion.compare(localVersion) > 0;
    }
    catch (e) {
        // eslint-disable-next-line no-console
        console.error('xxxx1', e);
        shouldWarn = true;
    }
    if (shouldWarn && config_1.isWarningEnabled('versionMismatch')) {
        const warning = core_1.terminal.yellow(core_1.tags.stripIndents `
    Your global shark-generate CLI version (${globalVersion}) is greater than your local
    version (${localVersion}). The local shark-generate CLI version is used.

    To disable this warning use "sgx config -g cli.warnings.versionMismatch false".
    `);
        // Don't show warning colorised on `ng completion`
        if (process.argv[2] !== 'completion') {
            // eslint-disable-next-line no-console
            console.log(warning);
        }
        else {
            // eslint-disable-next-line no-console
            console.log(warning);
            process.exit(1);
        }
    }
    // No error implies a projectLocalCli, which will load whatever
    // version of ng-cli you have installed in a local package.json
    console.log('-projectLocalCli-', projectLocalCli);
    cli = require(projectLocalCli);
}
catch (_a) {
    // If there is an error, resolve could not find the ng-cli
    // library from a package.json. Instead, include it from a relative
    // path to this script file (which is likely a globally installed
    // npm package). Most common cause for hitting this is `ng new`
    console.log(`cli = require('./ index');`);
    cli = require('./index');
}
if ('default' in cli) {
    cli = cli['default'];
}
console.log('--end---');
cli({ cliArgs: process.argv.slice(2) })
    .then((exitCode) => {
    process.exit(exitCode);
})
    .catch((err) => {
    console.log('Unknown error: ' + err.toString());
    process.exit(127);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdC5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsiY2xpL2luaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSwrQ0FBc0Q7QUFDdEQsb0RBQW9EO0FBQ3BELHlCQUF5QjtBQUN6Qiw2QkFBNkI7QUFDN0IsbUNBQWdDO0FBQ2hDLDJDQUFrRDtBQUVsRCxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQztBQUVsRCwwQkFBMEIsR0FBWTtJQUNsQyxHQUFHLEdBQUcsR0FBRyxJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUUzQixHQUFHO1FBQ0MsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsd0NBQXdDLENBQUMsQ0FBQztRQUNqRixJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLEVBQUU7WUFDaEMsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxlQUFlLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDMUQsSUFBSSxPQUFPLEVBQUU7Z0JBQ1QsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDakMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUU7b0JBQ2pCLE9BQU8sSUFBSSxlQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7aUJBQ3RDO2FBQ0o7U0FDSjtRQUVELG9CQUFvQjtRQUNwQixHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUMzQixRQUFRLEdBQUcsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO0lBRW5DLE9BQU8sSUFBSSxDQUFDO0FBQ2hCLENBQUM7QUFFRCxJQUFJLEdBQUcsQ0FBQztBQUNSLElBQUk7SUFDQSxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFLFdBQVcsQ0FBQyxD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QGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlL25vZGUnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IFNlbVZlciB9IGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgeyBpc1dhcm5pbmdFbmFibGVkIH0gZnJvbSAnLi4vdXRpbC9jb25maWcnO1xuXG5jb25zdCBwYWNrYWdlSnNvbiA9IHJlcXVpcmUoJy4uLy4uL3BhY2thZ2UuanNvbicpO1xuXG5mdW5jdGlvbiBfZnJvbVBhY2thZ2VKc29uKGN3ZD86IHN0cmluZykge1xuICAgIGN3ZCA9IGN3ZCB8fCBwcm9jZXNzLmN3ZCgpO1xuXG4gICAgZG8ge1xuICAgICAgICBjb25zdCBwYWNrYWdlSnNvblBhdGggPSBwYXRoLmpvaW4oY3dkLCAnbm9kZV9tb2R1bGVzL0Bhbmd1bGFyL2NsaS9wYWNrYWdlLmpzb24nKTtcbiAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMocGFja2FnZUpzb25QYXRoKSkge1xuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhwYWNrYWdlSnNvblBhdGgsICd1dGYtOCcpO1xuICAgICAgICAgICAgaWYgKGNvbnRlbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBqc29uID0gSlNPTi5wYXJzZShjb250ZW50KTtcbiAgICAgICAgICAgICAgICBpZiAoanNvblsndmVyc2lvbiddKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgU2VtVmVyKGpzb25bJ3ZlcnNpb24nXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgdGhlIHBhcmVudC5cbiAgICAgICAgY3dkID0gcGF0aC5kaXJuYW1lKGN3ZCk7XG4gICAgfSB3aGlsZSAoY3dkICE9IHBhdGguZGlybmFtZShjd2QpKTtcblxuICAgIHJldHVybiBudWxsO1xufVxuXG5sZXQgY2xpO1xudHJ5IHtcbiAgICBjb25zb2xlLmxvZygnLS1wYWNrYWdlSnNvbi0tJywgcGFja2FnZUpzb24pXG4gICAgY29uc3QgcHJvamVjdExvY2FsQ2xpID0gcmVzb2x2ZShcbiAgICAgICAgJ3NoYXJrLWdlbmVyYXRlJyxcbiAgICAgICAge1xuICAgICAgICAgICAgY2hlY2tHbG9iYWw6IGZhbHNlLFxuICAgICAgICAgICAgYmFzZWRpcjogcHJvY2Vzcy5jd2QoKSxcbiAgICAgICAgICAgIHByZXNlcnZlU3ltbGlua3M6IHRydWUsXG4gICAgICAgIH0sXG4gICAgKTtcbiAgICAvLyBUaGlzIHdhcyBydW4gZnJvbSBhIGdsb2JhbCwgY2hlY2sgbG9jYWwgdmVyc2lvbi5cbiAgICBjb25zdCBnbG9iYWxWZXJzaW9uID0gbmV3IFNlbVZlcihwYWNrYWdlSnNvblsndmVyc2lvbiddKTtcbiAgICBjb25zb2xlLmxvZygnLS1nbG9iYWxWZXJzaW9uLS0nLCBnbG9iYWxWZXJzaW9uKVxuICAgIGxldCBsb2NhbFZlcnNpb247XG4gICAgbGV0IHNob3VsZFdhcm4gPSBmYWxzZTtcblxuICAgIHRyeSB7XG4gICAgICAgIGxvY2FsVmVyc2lvbiA9IF9mcm9tUGFja2FnZUpzb24oKTtcbiAgICAgICAgY29uc29sZS5sb2coJy0tbG9jYWxWZXJzaW9uLS0nLCBsb2NhbFZlcnNpb24pXG4gICAgICAgIHNob3VsZFdhcm4gPSBsb2NhbFZlcnNpb24gIT0gbnVsbCAmJiBnbG9iYWxWZXJzaW9uLmNvbXBhcmUobG9jYWxWZXJzaW9uKSA+IDA7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgICBjb25zb2xlLmVycm9yKCd4eHh4MScsIGUpO1xuICAgICAgICBzaG91bGRXYXJuID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoc2hvdWxkV2FybiAmJiBpc1dhcm5pbmdFbmFibGVkKCd2ZXJzaW9uTWlzbWF0Y2gnKSkge1xuICAgICAgICBjb25zdCB3YXJuaW5nID0gdGVybWluYWwueWVsbG93KHRhZ3Muc3RyaXBJbmRlbnRzYFxuICAgIFlvdXIgZ2xvYmFsIHNoYXJrLWdlbmVyYXRlIENMSSB2ZXJzaW9uICgke2dsb2JhbFZlcnNpb259KSBpcyBncmVhdGVyIHRoYW4geW91ciBsb2NhbFxuICAgIHZlcnNpb24gKCR7bG9jYWxWZXJzaW9ufSkuIFRoZSBsb2NhbCBzaGFyay1nZW5lcmF0ZSBDTEkgdmVyc2lvbiBpcyB1c2VkLlxuXG4gICAgVG8gZGlzYWJsZSB0aGlzIHdhcm5pbmcgdXNlIFwic2d4IGNvbmZpZyAtZyBjbGkud2FybmluZ3MudmVyc2lvbk1pc21hdGNoIGZhbHNlXCIuXG4gICAgYCk7XG4gICAgICAgIC8vIERvbid0IHNob3cgd2FybmluZyBjb2xvcmlzZWQgb24gYG5nIGNvbXBsZXRpb25gXG4gICAgICAgIGlmIChwcm9jZXNzLmFyZ3ZbMl0gIT09ICdjb21wbGV0aW9uJykge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHdhcm5pbmcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHdhcm5pbmcpO1xuICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gTm8gZXJyb3IgaW1wbGllcyBhIHByb2plY3RMb2NhbENsaSwgd2hpY2ggd2lsbCBsb2FkIHdoYXRldmVyXG4gICAgLy8gdmVyc2lvbiBvZiBuZy1jbGkgeW91IGhhdmUgaW5zdGFsbGVkIGluIGEgbG9jYWwgcGFja2FnZS5qc29uXG4gICAgY29uc29sZS5sb2coJy1wcm9qZWN0TG9jYWxDbGktJywgcHJvamVjdExvY2FsQ2xpKVxuICAgIGNsaSA9IHJlcXVpcmUocHJvamVjdExvY2FsQ2xpKTtcbn0gY2F0Y2gge1xuICAgIC8vIElmIHRoZXJlIGlzIGFuIGVycm9yLCByZXNvbHZlIGNvdWxkIG5vdCBmaW5kIHRoZSBuZy1jbGlcbiAgICAvLyBsaWJyYXJ5IGZyb20gYSBwYWNrYWdlLmpzb24uIEluc3RlYWQsIGluY2x1ZGUgaXQgZnJvbSBhIHJlbGF0aXZlXG4gICAgLy8gcGF0aCB0byB0aGlzIHNjcmlwdCBmaWxlICh3aGljaCBpcyBsaWtlbHkgYSBnbG9iYWxseSBpbnN0YWxsZWRcbiAgICAvLyBucG0gcGFja2FnZSkuIE1vc3QgY29tbW9uIGNhdXNlIGZvciBoaXR0aW5nIHRoaXMgaXMgYG5nIG5ld2BcbiAgICBjb25zb2xlLmxvZyhgY2xpID0gcmVxdWlyZSgnLi8gaW5kZXgnKTtgKVxuICAgIGNsaSA9IHJlcXVpcmUoJy4vaW5kZXgnKTtcbn1cblxuaWYgKCdkZWZhdWx0JyBpbiBjbGkpIHtcbiAgICBjbGkgPSBjbGlbJ2RlZmF1bHQnXTtcbn1cblxuY29uc29sZS5sb2coJy0tZW5kLS0tJylcbmNsaSh7IGNsaUFyZ3M6IHByb2Nlc3MuYXJndi5zbGljZSgyKSB9KVxuICAgIC50aGVuKChleGl0Q29kZTogbnVtYmVyKSA9PiB7XG4gICAgICAgIHByb2Nlc3MuZXhpdChleGl0Q29kZSk7XG4gICAgfSlcbiAgICAuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coJ1Vua25vd24gZXJyb3I6ICcgKyBlcnIudG9TdHJpbmcoKSk7XG4gICAgICAgIHByb2Nlc3MuZXhpdCgxMjcpO1xuICAgIH0pO1xuIl19