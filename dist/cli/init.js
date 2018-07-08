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
    const projectLocalCli = node_1.resolve('shark-generate', {
        checkGlobal: false,
        basedir: process.cwd(),
        preserveSymlinks: true,
    });
    // This was run from a global, check local version.
    const globalVersion = new semver_1.SemVer(packageJson['version']);
    let localVersion;
    let shouldWarn = false;
    try {
        localVersion = _fromPackageJson();
        shouldWarn = localVersion != null && globalVersion.compare(localVersion) > 0;
    }
    catch (e) {
        // eslint-disable-next-line no-console
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
    cli = require(projectLocalCli);
}
catch (_a) {
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
    .then((exitCode) => {
    process.exit(exitCode);
})
    .catch((err) => {
    console.log('Unknown error: ' + err.toString());
    process.exit(127);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdC5qcyIsInNvdXJjZVJvb3QiOiIvVXNlcnMvYm9iby9Xb3JrL3NoYXJrLWdlbmVyYXRlLyIsInNvdXJjZXMiOlsiY2xpL2luaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSwrQ0FBc0Q7QUFDdEQsb0RBQW9EO0FBQ3BELHlCQUF5QjtBQUN6Qiw2QkFBNkI7QUFDN0IsbUNBQWdDO0FBQ2hDLDJDQUFrRDtBQUVsRCxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQztBQUVsRCwwQkFBMEIsR0FBWTtJQUNsQyxHQUFHLEdBQUcsR0FBRyxJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUUzQixHQUFHO1FBQ0MsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsd0NBQXdDLENBQUMsQ0FBQztRQUNqRixJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLEVBQUU7WUFDaEMsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxlQUFlLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDMUQsSUFBSSxPQUFPLEVBQUU7Z0JBQ1QsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDakMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUU7b0JBQ2pCLE9BQU8sSUFBSSxlQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7aUJBQ3RDO2FBQ0o7U0FDSjtRQUVELG9CQUFvQjtRQUNwQixHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUMzQixRQUFRLEdBQUcsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO0lBRW5DLE9BQU8sSUFBSSxDQUFDO0FBQ2hCLENBQUM7QUFFRCxJQUFJLEdBQUcsQ0FBQztBQUNSLElBQUk7SUFDQSxNQUFNLGVBQWUsR0FBRyxjQUFPLENBQzNCLGdCQUFnQixFQUNoQjtRQUNJLFdBQVcsRUFBRSxLQUFLO1FBQ2xCLE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxFQUFFO1FBQ3RCLGdCQUFnQixFQUFFLElBQUk7S0FDekIsQ0FDSixDQUFDO0lBQ0YsbURBQW1EO0lBQ25ELE1BQU0sYUFBYSxHQUFHLElBQUksZUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQ3pELElBQUksWUFBWSxDQUFDO0lBQ2pCLElBQUksVUFBVSxHQUFHLEtBQUssQ0FBQztJQUV2QixJQUFJO1FBQ0EsWUFBWSxHQUFHLGdCQUFnQixFQUFFLENBQUM7UUFDbEMsVUFBVSxHQUFHLFlBQVksSUFBSSxJQUFJLElBQUksYUFBYSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDaEY7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNSLHNDQUFzQztRQUN0QyxVQUFVLEdBQUcsSUFBSSxDQUFDO0tBQ3JCO0lBRUQsSUFBSSxVQUFVLElBQUkseUJBQWdCLENBQUMsaUJBQWlCLENBQUMsRUFBRTtRQUNuRCxNQUFNLE9BQU8sR0FBRyxlQUFRLENBQUMsTUFBTSxDQUFDLFdBQUksQ0FBQyxZQUFZLENBQUE7OENBQ1gsYUFBYTtlQUM1QyxZQUFZOzs7S0FHdEIsQ0FBQyxDQUFDO1FBQ0Msa0RBQWtEO1FBQ2xELElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxZQUFZLEVBQUU7WUFDbEMsc0NBQXNDO1lBQ3RDLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDeEI7YUFBTTtZQUNILHNDQUFzQztZQUN0QyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3JCLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDbkI7S0FDSjtJQUVELCtEQUErRDtJQUMvRCwrREFBK0Q7SUFDL0QsR0FBRyxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztDQUNsQztBQUFDLFdBQU07SUFDSiwwREFBMEQ7SUFDMUQsbUVBQW1FO0lBQ25FLGlFQUFpRTtJQUNqRSwrREFBK0Q7SUFDL0QsR0FBRyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztDQUM1QjtBQUVELElBQUksU0FBUyxJQUFJLEdBQUcsRUFBRTtJQUNsQixHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0NBQ3hCO0FBRUQsR0FBRyxDQUFDLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7S0FDbEMsSUFBSSxDQUFDLENBQUMsUUFBZ0IsRUFBRSxFQUFFO0lBQ3ZCLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDM0IsQ0FBQyxDQUFDO0tBQ0QsS0FBSyxDQUFDLENBQUMsR0FBVSxFQUFFLEVBQUU7SUFDbEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztJQUNoRCxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3RCLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiXG5pbXBvcnQgeyB0YWdzLCB0ZXJtaW5hbCB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZS9ub2RlJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBTZW1WZXIgfSBmcm9tICdzZW12ZXInO1xuaW1wb3J0IHsgaXNXYXJuaW5nRW5hYmxlZCB9IGZyb20gJy4uL3V0aWwvY29uZmlnJztcblxuY29uc3QgcGFja2FnZUpzb24gPSByZXF1aXJlKCcuLi8uLi9wYWNrYWdlLmpzb24nKTtcblxuZnVuY3Rpb24gX2Zyb21QYWNrYWdlSnNvbihjd2Q/OiBzdHJpbmcpIHtcbiAgICBjd2QgPSBjd2QgfHwgcHJvY2Vzcy5jd2QoKTtcblxuICAgIGRvIHtcbiAgICAgICAgY29uc3QgcGFja2FnZUpzb25QYXRoID0gcGF0aC5qb2luKGN3ZCwgJ25vZGVfbW9kdWxlcy9AYW5ndWxhci9jbGkvcGFja2FnZS5qc29uJyk7XG4gICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHBhY2thZ2VKc29uUGF0aCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMocGFja2FnZUpzb25QYXRoLCAndXRmLTgnKTtcbiAgICAgICAgICAgIGlmIChjb250ZW50KSB7XG4gICAgICAgICAgICAgICAgY29uc3QganNvbiA9IEpTT04ucGFyc2UoY29udGVudCk7XG4gICAgICAgICAgICAgICAgaWYgKGpzb25bJ3ZlcnNpb24nXSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFNlbVZlcihqc29uWyd2ZXJzaW9uJ10pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENoZWNrIHRoZSBwYXJlbnQuXG4gICAgICAgIGN3ZCA9IHBhdGguZGlybmFtZShjd2QpO1xuICAgIH0gd2hpbGUgKGN3ZCAhPSBwYXRoLmRpcm5hbWUoY3dkKSk7XG5cbiAgICByZXR1cm4gbnVsbDtcbn1cblxubGV0IGNsaTtcbnRyeSB7XG4gICAgY29uc3QgcHJvamVjdExvY2FsQ2xpID0gcmVzb2x2ZShcbiAgICAgICAgJ3NoYXJrLWdlbmVyYXRlJyxcbiAgICAgICAge1xuICAgICAgICAgICAgY2hlY2tHbG9iYWw6IGZhbHNlLFxuICAgICAgICAgICAgYmFzZWRpcjogcHJvY2Vzcy5jd2QoKSxcbiAgICAgICAgICAgIHByZXNlcnZlU3ltbGlua3M6IHRydWUsXG4gICAgICAgIH0sXG4gICAgKTtcbiAgICAvLyBUaGlzIHdhcyBydW4gZnJvbSBhIGdsb2JhbCwgY2hlY2sgbG9jYWwgdmVyc2lvbi5cbiAgICBjb25zdCBnbG9iYWxWZXJzaW9uID0gbmV3IFNlbVZlcihwYWNrYWdlSnNvblsndmVyc2lvbiddKTtcbiAgICBsZXQgbG9jYWxWZXJzaW9uO1xuICAgIGxldCBzaG91bGRXYXJuID0gZmFsc2U7XG5cbiAgICB0cnkge1xuICAgICAgICBsb2NhbFZlcnNpb24gPSBfZnJvbVBhY2thZ2VKc29uKCk7XG4gICAgICAgIHNob3VsZFdhcm4gPSBsb2NhbFZlcnNpb24gIT0gbnVsbCAmJiBnbG9iYWxWZXJzaW9uLmNvbXBhcmUobG9jYWxWZXJzaW9uKSA+IDA7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgICBzaG91bGRXYXJuID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoc2hvdWxkV2FybiAmJiBpc1dhcm5pbmdFbmFibGVkKCd2ZXJzaW9uTWlzbWF0Y2gnKSkge1xuICAgICAgICBjb25zdCB3YXJuaW5nID0gdGVybWluYWwueWVsbG93KHRhZ3Muc3RyaXBJbmRlbnRzYFxuICAgIFlvdXIgZ2xvYmFsIHNoYXJrLWdlbmVyYXRlIENMSSB2ZXJzaW9uICgke2dsb2JhbFZlcnNpb259KSBpcyBncmVhdGVyIHRoYW4geW91ciBsb2NhbFxuICAgIHZlcnNpb24gKCR7bG9jYWxWZXJzaW9ufSkuIFRoZSBsb2NhbCBzaGFyay1nZW5lcmF0ZSBDTEkgdmVyc2lvbiBpcyB1c2VkLlxuXG4gICAgVG8gZGlzYWJsZSB0aGlzIHdhcm5pbmcgdXNlIFwic2d4IGNvbmZpZyAtZyBjbGkud2FybmluZ3MudmVyc2lvbk1pc21hdGNoIGZhbHNlXCIuXG4gICAgYCk7XG4gICAgICAgIC8vIERvbid0IHNob3cgd2FybmluZyBjb2xvcmlzZWQgb24gYG5nIGNvbXBsZXRpb25gXG4gICAgICAgIGlmIChwcm9jZXNzLmFyZ3ZbMl0gIT09ICdjb21wbGV0aW9uJykge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHdhcm5pbmcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHdhcm5pbmcpO1xuICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gTm8gZXJyb3IgaW1wbGllcyBhIHByb2plY3RMb2NhbENsaSwgd2hpY2ggd2lsbCBsb2FkIHdoYXRldmVyXG4gICAgLy8gdmVyc2lvbiBvZiBuZy1jbGkgeW91IGhhdmUgaW5zdGFsbGVkIGluIGEgbG9jYWwgcGFja2FnZS5qc29uXG4gICAgY2xpID0gcmVxdWlyZShwcm9qZWN0TG9jYWxDbGkpO1xufSBjYXRjaCB7XG4gICAgLy8gSWYgdGhlcmUgaXMgYW4gZXJyb3IsIHJlc29sdmUgY291bGQgbm90IGZpbmQgdGhlIG5nLWNsaVxuICAgIC8vIGxpYnJhcnkgZnJvbSBhIHBhY2thZ2UuanNvbi4gSW5zdGVhZCwgaW5jbHVkZSBpdCBmcm9tIGEgcmVsYXRpdmVcbiAgICAvLyBwYXRoIHRvIHRoaXMgc2NyaXB0IGZpbGUgKHdoaWNoIGlzIGxpa2VseSBhIGdsb2JhbGx5IGluc3RhbGxlZFxuICAgIC8vIG5wbSBwYWNrYWdlKS4gTW9zdCBjb21tb24gY2F1c2UgZm9yIGhpdHRpbmcgdGhpcyBpcyBgbmcgbmV3YFxuICAgIGNsaSA9IHJlcXVpcmUoJy4vaW5kZXgnKTtcbn1cblxuaWYgKCdkZWZhdWx0JyBpbiBjbGkpIHtcbiAgICBjbGkgPSBjbGlbJ2RlZmF1bHQnXTtcbn1cblxuY2xpKHsgY2xpQXJnczogcHJvY2Vzcy5hcmd2LnNsaWNlKDIpIH0pXG4gICAgLnRoZW4oKGV4aXRDb2RlOiBudW1iZXIpID0+IHtcbiAgICAgICAgcHJvY2Vzcy5leGl0KGV4aXRDb2RlKTtcbiAgICB9KVxuICAgIC5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZygnVW5rbm93biBlcnJvcjogJyArIGVyci50b1N0cmluZygpKTtcbiAgICAgICAgcHJvY2Vzcy5leGl0KDEyNyk7XG4gICAgfSk7XG4iXX0=