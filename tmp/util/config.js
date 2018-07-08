"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:no-global-tslint-disable file-header
const core_1 = require("@angular-devkit/core");
const node_1 = require("@angular-devkit/core/node");
const fs_1 = require("fs");
const os = require("os");
const path = require("path");
const find_up_1 = require("./find-up");
function getSchemaLocation() {
    return path.join(__dirname, '../lib/config/schema.json');
}
exports.workspaceSchemaPath = getSchemaLocation();
const configNames = ['shark-generate-conf.json'];
const globalFileName = '.shark-generate-conf.json';
function projectFilePath(projectPath) {
    // Find the configuration, either where specified, in the Angular CLI project
    // (if it's in node_modules) or from the current process.
    return (projectPath && find_up_1.findUp(configNames, projectPath))
        || find_up_1.findUp(configNames, process.cwd())
        || find_up_1.findUp(configNames, __dirname);
}
function globalFilePath() {
    const home = os.homedir();
    if (!home) {
        return null;
    }
    const p = path.join(home, globalFileName);
    if (fs_1.existsSync(p)) {
        return p;
    }
    return null;
}
const cachedWorkspaces = new Map();
function getWorkspace(level = 'local') {
    const cached = cachedWorkspaces.get(level);
    if (cached != undefined) {
        return cached;
    }
    const configPath = level === 'local' ? projectFilePath() : globalFilePath();
    if (!configPath) {
        cachedWorkspaces.set(level, null);
        return null;
    }
    const root = core_1.normalize(path.dirname(configPath));
    const file = core_1.normalize(path.basename(configPath));
    const workspace = new core_1.experimental.workspace.Workspace(root, new node_1.NodeJsSyncHost());
    workspace.loadWorkspaceFromHost(file).subscribe();
    cachedWorkspaces.set(level, workspace);
    return workspace;
}
exports.getWorkspace = getWorkspace;
function createGlobalSettings() {
    const home = os.homedir();
    if (!home) {
        throw new Error('No home directory found.');
    }
    const globalPath = path.join(home, globalFileName);
    fs_1.writeFileSync(globalPath, JSON.stringify({ version: 1 }));
    return globalPath;
}
exports.createGlobalSettings = createGlobalSettings;
function getWorkspaceRaw(level = 'local') {
    let configPath = level === 'local' ? projectFilePath() : globalFilePath();
    if (!configPath) {
        if (level === 'global') {
            configPath = createGlobalSettings();
        }
        else {
            return [null, null];
        }
    }
    let content = '';
    new node_1.NodeJsSyncHost().read(core_1.normalize(configPath))
        .subscribe(data => content = core_1.virtualFs.fileBufferToString(data));
    const ast = core_1.parseJsonAst(content, core_1.JsonParseMode.Loose);
    if (ast.kind != 'object') {
        throw new Error('Invalid JSON');
    }
    return [ast, configPath];
}
exports.getWorkspaceRaw = getWorkspaceRaw;
function validateWorkspace(json) {
    const workspace = new core_1.experimental.workspace.Workspace(core_1.normalize('.'), new node_1.NodeJsSyncHost());
    let error;
    workspace.loadWorkspaceFromJson(json).subscribe({
        error: e => error = e,
    });
    if (error) {
        throw error;
    }
    return true;
}
exports.validateWorkspace = validateWorkspace;
function getPackageManager() {
    let workspace = getWorkspace('local');
    if (workspace) {
        const project = workspace.getProjectByPath(core_1.normalize(process.cwd()));
        if (project && workspace.getProjectCli(project)) {
            const value = workspace.getProjectCli(project)['packageManager'];
            if (typeof value == 'string') {
                return value;
            }
        }
        if (workspace.getCli()) {
            const value = workspace.getCli()['packageManager'];
            if (typeof value == 'string') {
                return value;
            }
        }
    }
    workspace = getWorkspace('global');
    if (workspace && workspace.getCli()) {
        const value = workspace.getCli()['packageManager'];
        if (typeof value == 'string') {
            return value;
        }
    }
    return 'npm';
}
exports.getPackageManager = getPackageManager;
function getDefaultSchematicCollection() {
    let workspace = getWorkspace('local');
    if (workspace) {
        const project = workspace.getProjectByPath(core_1.normalize(process.cwd()));
        if (project && workspace.getProjectCli(project)) {
            const value = workspace.getProjectCli(project)['defaultCollection'];
            if (typeof value == 'string') {
                return value;
            }
        }
        if (workspace.getCli()) {
            const value = workspace.getCli()['defaultCollection'];
            if (typeof value == 'string') {
                return value;
            }
        }
    }
    workspace = getWorkspace('global');
    if (workspace && workspace.getCli()) {
        const value = workspace.getCli()['defaultCollection'];
        if (typeof value == 'string') {
            return value;
        }
    }
    return '@schematics/angular';
}
exports.getDefaultSchematicCollection = getDefaultSchematicCollection;
function getSchematicDefaults(collection, schematic, project) {
    let result = {};
    const fullName = `${collection}:${schematic}`;
    console.log('--fullName--', fullName);
    let workspace = getWorkspace('global');
    if (workspace && workspace.getSchematics()) {
        const schematicObject = workspace.getSchematics()[fullName];
        if (schematicObject) {
            result = Object.assign({}, result, schematicObject);
        }
        const collectionObject = workspace.getSchematics()[collection];
        if (typeof collectionObject == 'object' && !Array.isArray(collectionObject)) {
            result = Object.assign({}, result, collectionObject[schematic]);
        }
    }
    workspace = getWorkspace('local');
    if (workspace) {
        if (workspace.getSchematics()) {
            const schematicObject = workspace.getSchematics()[fullName];
            if (schematicObject) {
                result = Object.assign({}, result, schematicObject);
            }
            const collectionObject = workspace.getSchematics()[collection];
            if (typeof collectionObject == 'object' && !Array.isArray(collectionObject)) {
                result = Object.assign({}, result, collectionObject[schematic]);
            }
        }
        project = project || workspace.getProjectByPath(core_1.normalize(process.cwd()));
        if (project && workspace.getProjectSchematics(project)) {
            const schematicObject = workspace.getProjectSchematics(project)[fullName];
            if (schematicObject) {
                result = Object.assign({}, result, schematicObject);
            }
            const collectionObject = workspace.getProjectSchematics(project)[collection];
            if (typeof collectionObject == 'object' && !Array.isArray(collectionObject)) {
                result = Object.assign({}, result, collectionObject[schematic]);
            }
            console.log('--collectionObject--', collectionObject);
        }
    }
    console.log('--workspace--', workspace);
    return result;
}
exports.getSchematicDefaults = getSchematicDefaults;
function isWarningEnabled(warning) {
    let workspace = getWorkspace('local');
    if (workspace) {
        const project = workspace.getProjectByPath(core_1.normalize(process.cwd()));
        if (project && workspace.getProjectCli(project)) {
            const warnings = workspace.getProjectCli(project)['warnings'];
            if (typeof warnings == 'object' && !Array.isArray(warnings)) {
                const value = warnings[warning];
                if (typeof value == 'boolean') {
                    return value;
                }
            }
        }
        if (workspace.getCli()) {
            const warnings = workspace.getCli()['warnings'];
            if (typeof warnings == 'object' && !Array.isArray(warnings)) {
                const value = warnings[warning];
                if (typeof value == 'boolean') {
                    return value;
                }
            }
        }
    }
    workspace = getWorkspace('global');
    if (workspace && workspace.getCli()) {
        const warnings = workspace.getCli()['warnings'];
        if (typeof warnings == 'object' && !Array.isArray(warnings)) {
            const value = warnings[warning];
            if (typeof value == 'boolean') {
                return value;
            }
        }
    }
    return true;
}
exports.isWarningEnabled = isWarningEnabled;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJ1dGlsL2NvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNEQUFzRDtBQUN0RCwrQ0FFOEI7QUFDOUIsb0RBQTJEO0FBRTNELDJCQUErQztBQUMvQyx5QkFBeUI7QUFDekIsNkJBQTZCO0FBQzdCLHVDQUFtQztBQUVuQztJQUNFLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsMkJBQTJCLENBQUMsQ0FBQztBQUMzRCxDQUFDO0FBRVksUUFBQSxtQkFBbUIsR0FBRyxpQkFBaUIsRUFBRSxDQUFDO0FBRXZELE1BQU0sV0FBVyxHQUFHLENBQUMsMEJBQTBCLENBQUMsQ0FBQztBQUNqRCxNQUFNLGNBQWMsR0FBRywyQkFBMkIsQ0FBQztBQUVuRCx5QkFBeUIsV0FBb0I7SUFDM0MsNkVBQTZFO0lBQzdFLHlEQUF5RDtJQUN6RCxPQUFPLENBQUMsV0FBVyxJQUFJLGdCQUFNLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1dBQ25ELGdCQUFNLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztXQUNsQyxnQkFBTSxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUN0QyxDQUFDO0FBRUQ7SUFDRSxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDMUIsSUFBSSxDQUFDLElBQUksRUFBRTtRQUNULE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFFRCxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQztJQUMxQyxJQUFJLGVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUNqQixPQUFPLENBQUMsQ0FBQztLQUNWO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLEdBQUcsRUFBbUQsQ0FBQztBQUVw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LENBQUM7UUFDaEQsSUFBSSxPQUFPLFFBQVEsSUFBSSxRQUFRLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQzNELE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNoQyxJQUFJLE9BQU8sS0FBSyxJQUFJLFNBQVMsRUFBRTtnQkFDN0IsT0FBTyxLQUFLLENBQUM7YUFDZDtTQUNGO0tBQ0Y7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFyQ0QsNENBcUNDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gdHNsaW50OmRpc2FibGU6bm8tZ2xvYmFsLXRzbGludC1kaXNhYmxlIGZpbGUtaGVhZGVyXG5pbXBvcnQge1xuICBKc29uQXN0T2JqZWN0LCBKc29uT2JqZWN0LCBKc29uUGFyc2VNb2RlLCBleHBlcmltZW50YWwsIG5vcm1hbGl6ZSwgcGFyc2VKc29uQXN0LCB2aXJ0dWFsRnNcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgTm9kZUpzU3luY0hvc3QgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZS9ub2RlJztcblxuaW1wb3J0IHsgZXhpc3RzU3luYywgd3JpdGVGaWxlU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIG9zIGZyb20gJ29zJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBmaW5kVXAgfSBmcm9tICcuL2ZpbmQtdXAnO1xuXG5mdW5jdGlvbiBnZXRTY2hlbWFMb2NhdGlvbigpOiBzdHJpbmcge1xuICByZXR1cm4gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL2xpYi9jb25maWcvc2NoZW1hLmpzb24nKTtcbn1cblxuZXhwb3J0IGNvbnN0IHdvcmtzcGFjZVNjaGVtYVBhdGggPSBnZXRTY2hlbWFMb2NhdGlvbigpO1xuXG5jb25zdCBjb25maWdOYW1lcyA9IFsnc2hhcmstZ2VuZXJhdGUtY29uZi5qc29uJ107XG5jb25zdCBnbG9iYWxGaWxlTmFtZSA9ICcuc2hhcmstZ2VuZXJhdGUtY29uZi5qc29uJztcblxuZnVuY3Rpb24gcHJvamVjdEZpbGVQYXRoKHByb2plY3RQYXRoPzogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIC8vIEZpbmQgdGhlIGNvbmZpZ3VyYXRpb24sIGVpdGhlciB3aGVyZSBzcGVjaWZpZWQsIGluIHRoZSBBbmd1bGFyIENMSSBwcm9qZWN0XG4gIC8vIChpZiBpdCdzIGluIG5vZGVfbW9kdWxlcykgb3IgZnJvbSB0aGUgY3VycmVudCBwcm9jZXNzLlxuICByZXR1cm4gKHByb2plY3RQYXRoICYmIGZpbmRVcChjb25maWdOYW1lcywgcHJvamVjdFBhdGgpKVxuICAgIHx8IGZpbmRVcChjb25maWdOYW1lcywgcHJvY2Vzcy5jd2QoKSlcbiAgICB8fCBmaW5kVXAoY29uZmlnTmFtZXMsIF9fZGlybmFtZSk7XG59XG5cbmZ1bmN0aW9uIGdsb2JhbEZpbGVQYXRoKCk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBob21lID0gb3MuaG9tZWRpcigpO1xuICBpZiAoIWhvbWUpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IHAgPSBwYXRoLmpvaW4oaG9tZSwgZ2xvYmFsRmlsZU5hbWUpO1xuICBpZiAoZXhpc3RzU3luYyhwKSkge1xuICAgIHJldHVybiBwO1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbmNvbnN0IGNhY2hlZFdvcmtzcGFjZXMgPSBuZXcgTWFwPHN0cmluZywgZXhwZXJpbWVudGFsLndvcmtzcGFjZS5Xb3Jrc3BhY2UgfCBudWxsPigpO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0V29ya3NwYWNlKFxuICBsZXZlbDogJ2xvY2FsJyB8ICdnbG9iYWwnID0gJ2xvY2FsJyxcbik6IGV4cGVyaW1lbnRhbC53b3Jrc3BhY2UuV29ya3NwYWNlIHwgbnVsbCB7XG4gIGNvbnN0IGNhY2hlZCA9IGNhY2hlZFdvcmtzcGFjZXMuZ2V0KGxldmVsKTtcbiAgaWYgKGNhY2hlZCAhPSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gY2FjaGVkO1xuICB9XG5cbiAgY29uc3QgY29uZmlnUGF0aCA9IGxldmVsID09PSAnbG9jYWwnID8gcHJvamVjdEZpbGVQYXRoKCkgOiBnbG9iYWxGaWxlUGF0aCgpO1xuXG4gIGlmICghY29uZmlnUGF0aCkge1xuICAgIGNhY2hlZFdvcmtzcGFjZXMuc2V0KGxldmVsLCBudWxsKTtcblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3Qgcm9vdCA9IG5vcm1hbGl6ZShwYXRoLmRpcm5hbWUoY29uZmlnUGF0aCkpO1xuICBjb25zdCBmaWxlID0gbm9ybWFsaXplKHBhdGguYmFzZW5hbWUoY29uZmlnUGF0aCkpO1xuICBjb25zdCB3b3Jrc3BhY2UgPSBuZXcgZXhwZXJpbWVudGFsLndvcmtzcGFjZS5Xb3Jrc3BhY2UoXG4gICAgcm9vdCxcbiAgICBuZXcgTm9kZUpzU3luY0hvc3QoKSxcbiAgKTtcblxuICB3b3Jrc3BhY2UubG9hZFdvcmtzcGFjZUZyb21Ib3N0KGZpbGUpLnN1YnNjcmliZSgpO1xuICBjYWNoZWRXb3Jrc3BhY2VzLnNldChsZXZlbCwgd29ya3NwYWNlKTtcblxuICByZXR1cm4gd29ya3NwYWNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlR2xvYmFsU2V0dGluZ3MoKTogc3RyaW5nIHtcbiAgY29uc3QgaG9tZSA9IG9zLmhvbWVkaXIoKTtcbiAgaWYgKCFob21lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdObyBob21lIGRpcmVjdG9yeSBmb3VuZC4nKTtcbiAgfVxuXG4gIGNvbnN0IGdsb2JhbFBhdGggPSBwYXRoLmpvaW4oaG9tZSwgZ2xvYmFsRmlsZU5hbWUpO1xuICB3cml0ZUZpbGVTeW5jKGdsb2JhbFBhdGgsIEpTT04uc3RyaW5naWZ5KHsgdmVyc2lvbjogMSB9KSk7XG5cbiAgcmV0dXJuIGdsb2JhbFBhdGg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRXb3Jrc3BhY2VSYXcoXG4gIGxldmVsOiAnbG9jYWwnIHwgJ2dsb2JhbCcgPSAnbG9jYWwnLFxuKTogW0pzb25Bc3RPYmplY3QgfCBudWxsLCBzdHJpbmcgfCBudWxsXSB7XG4gIGxldCBjb25maWdQYXRoID0gbGV2ZWwgPT09ICdsb2NhbCcgPyBwcm9qZWN0RmlsZVBhdGgoKSA6IGdsb2JhbEZpbGVQYXRoKCk7XG5cbiAgaWYgKCFjb25maWdQYXRoKSB7XG4gICAgaWYgKGxldmVsID09PSAnZ2xvYmFsJykge1xuICAgICAgY29uZmlnUGF0aCA9IGNyZWF0ZUdsb2JhbFNldHRpbmdzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBbbnVsbCwgbnVsbF07XG4gICAgfVxuICB9XG5cbiAgbGV0IGNvbnRlbnQgPSAnJztcbiAgbmV3IE5vZGVKc1N5bmNIb3N0KCkucmVhZChub3JtYWxpemUoY29uZmlnUGF0aCkpXG4gICAgLnN1YnNjcmliZShkYXRhID0+IGNvbnRlbnQgPSB2aXJ0dWFsRnMuZmlsZUJ1ZmZlclRvU3RyaW5nKGRhdGEpKTtcblxuICBjb25zdCBhc3QgPSBwYXJzZUpzb25Bc3QoY29udGVudCwgSnNvblBhcnNlTW9kZS5Mb29zZSk7XG5cbiAgaWYgKGFzdC5raW5kICE9ICdvYmplY3QnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIEpTT04nKTtcbiAgfVxuXG4gIHJldHVybiBbYXN0IGFzIEpzb25Bc3RPYmplY3QsIGNvbmZpZ1BhdGhdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVXb3Jrc3BhY2UoanNvbjogSnNvbk9iamVjdCkge1xuICBjb25zdCB3b3Jrc3BhY2UgPSBuZXcgZXhwZXJpbWVudGFsLndvcmtzcGFjZS5Xb3Jrc3BhY2UoXG4gICAgbm9ybWFsaXplKCcuJyksXG4gICAgbmV3IE5vZGVKc1N5bmNIb3N0KCksXG4gICk7XG5cbiAgbGV0IGVycm9yO1xuICB3b3Jrc3BhY2UubG9hZFdvcmtzcGFjZUZyb21Kc29uKGpzb24pLnN1YnNjcmliZSh7XG4gICAgZXJyb3I6IGUgPT4gZXJyb3IgPSBlLFxuICB9KTtcblxuICBpZiAoZXJyb3IpIHtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFja2FnZU1hbmFnZXIoKTogc3RyaW5nIHtcbiAgbGV0IHdvcmtzcGFjZSA9IGdldFdvcmtzcGFjZSgnbG9jYWwnKTtcblxuICBpZiAod29ya3NwYWNlKSB7XG4gICAgY29uc3QgcHJvamVjdCA9IHdvcmtzcGFjZS5nZXRQcm9qZWN0QnlQYXRoKG5vcm1hbGl6ZShwcm9jZXNzLmN3ZCgpKSk7XG4gICAgaWYgKHByb2plY3QgJiYgd29ya3NwYWNlLmdldFByb2plY3RDbGkocHJvamVjdCkpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gd29ya3NwYWNlLmdldFByb2plY3RDbGkocHJvamVjdClbJ3BhY2thZ2VNYW5hZ2VyJ107XG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHdvcmtzcGFjZS5nZXRDbGkoKSkge1xuICAgICAgY29uc3QgdmFsdWUgPSB3b3Jrc3BhY2UuZ2V0Q2xpKClbJ3BhY2thZ2VNYW5hZ2VyJ107XG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB3b3Jrc3BhY2UgPSBnZXRXb3Jrc3BhY2UoJ2dsb2JhbCcpO1xuICBpZiAod29ya3NwYWNlICYmIHdvcmtzcGFjZS5nZXRDbGkoKSkge1xuICAgIGNvbnN0IHZhbHVlID0gd29ya3NwYWNlLmdldENsaSgpWydwYWNrYWdlTWFuYWdlciddO1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gJ25wbSc7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERlZmF1bHRTY2hlbWF0aWNDb2xsZWN0aW9uKCk6IHN0cmluZyB7XG4gIGxldCB3b3Jrc3BhY2UgPSBnZXRXb3Jrc3BhY2UoJ2xvY2FsJyk7XG5cbiAgaWYgKHdvcmtzcGFjZSkge1xuICAgIGNvbnN0IHByb2plY3QgPSB3b3Jrc3BhY2UuZ2V0UHJvamVjdEJ5UGF0aChub3JtYWxpemUocHJvY2Vzcy5jd2QoKSkpO1xuICAgIGlmIChwcm9qZWN0ICYmIHdvcmtzcGFjZS5nZXRQcm9qZWN0Q2xpKHByb2plY3QpKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHdvcmtzcGFjZS5nZXRQcm9qZWN0Q2xpKHByb2plY3QpWydkZWZhdWx0Q29sbGVjdGlvbiddO1xuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh3b3Jrc3BhY2UuZ2V0Q2xpKCkpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gd29ya3NwYWNlLmdldENsaSgpWydkZWZhdWx0Q29sbGVjdGlvbiddO1xuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgd29ya3NwYWNlID0gZ2V0V29ya3NwYWNlKCdnbG9iYWwnKTtcbiAgaWYgKHdvcmtzcGFjZSAmJiB3b3Jrc3BhY2UuZ2V0Q2xpKCkpIHtcbiAgICBjb25zdCB2YWx1ZSA9IHdvcmtzcGFjZS5nZXRDbGkoKVsnZGVmYXVsdENvbGxlY3Rpb24nXTtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuICdAc2NoZW1hdGljcy9hbmd1bGFyJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFNjaGVtYXRpY0RlZmF1bHRzKFxuICBjb2xsZWN0aW9uOiBzdHJpbmcsXG4gIHNjaGVtYXRpYzogc3RyaW5nLFxuICBwcm9qZWN0Pzogc3RyaW5nIHwgbnVsbCxcbik6IHt9IHtcbiAgbGV0IHJlc3VsdCA9IHt9O1xuICBjb25zdCBmdWxsTmFtZSA9IGAke2NvbGxlY3Rpb259OiR7c2NoZW1hdGljfWA7XG4gIGNvbnNvbGUubG9nKCctLWZ1bGxOYW1lLS0nLCBmdWxsTmFtZSlcbiAgbGV0IHdvcmtzcGFjZSA9IGdldFdvcmtzcGFjZSgnZ2xvYmFsJyk7XG4gIGlmICh3b3Jrc3BhY2UgJiYgd29ya3NwYWNlLmdldFNjaGVtYXRpY3MoKSkge1xuICAgIGNvbnN0IHNjaGVtYXRpY09iamVjdCA9IHdvcmtzcGFjZS5nZXRTY2hlbWF0aWNzKClbZnVsbE5hbWVdO1xuICAgIGlmIChzY2hlbWF0aWNPYmplY3QpIHtcbiAgICAgIHJlc3VsdCA9IHsgLi4ucmVzdWx0LCAuLi4oc2NoZW1hdGljT2JqZWN0IGFzIHt9KSB9O1xuICAgIH1cbiAgICBjb25zdCBjb2xsZWN0aW9uT2JqZWN0ID0gd29ya3NwYWNlLmdldFNjaGVtYXRpY3MoKVtjb2xsZWN0aW9uXTtcbiAgICBpZiAodHlwZW9mIGNvbGxlY3Rpb25PYmplY3QgPT0gJ29iamVjdCcgJiYgIUFycmF5LmlzQXJyYXkoY29sbGVjdGlvbk9iamVjdCkpIHtcbiAgICAgIHJlc3VsdCA9IHsgLi4ucmVzdWx0LCAuLi4oY29sbGVjdGlvbk9iamVjdFtzY2hlbWF0aWNdIGFzIHt9KSB9O1xuICAgIH1cblxuICB9XG5cbiAgd29ya3NwYWNlID0gZ2V0V29ya3NwYWNlKCdsb2NhbCcpO1xuXG4gIGlmICh3b3Jrc3BhY2UpIHtcbiAgICBpZiAod29ya3NwYWNlLmdldFNjaGVtYXRpY3MoKSkge1xuICAgICAgY29uc3Qgc2NoZW1hdGljT2JqZWN0ID0gd29ya3NwYWNlLmdldFNjaGVtYXRpY3MoKVtmdWxsTmFtZV07XG4gICAgICBpZiAoc2NoZW1hdGljT2JqZWN0KSB7XG4gICAgICAgIHJlc3VsdCA9IHsgLi4ucmVzdWx0LCAuLi4oc2NoZW1hdGljT2JqZWN0IGFzIHt9KSB9O1xuICAgICAgfVxuICAgICAgY29uc3QgY29sbGVjdGlvbk9iamVjdCA9IHdvcmtzcGFjZS5nZXRTY2hlbWF0aWNzKClbY29sbGVjdGlvbl07XG4gICAgICBpZiAodHlwZW9mIGNvbGxlY3Rpb25PYmplY3QgPT0gJ29iamVjdCcgJiYgIUFycmF5LmlzQXJyYXkoY29sbGVjdGlvbk9iamVjdCkpIHtcbiAgICAgICAgcmVzdWx0ID0geyAuLi5yZXN1bHQsIC4uLihjb2xsZWN0aW9uT2JqZWN0W3NjaGVtYXRpY10gYXMge30pIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcHJvamVjdCA9IHByb2plY3QgfHwgd29ya3NwYWNlLmdldFByb2plY3RCeVBhdGgobm9ybWFsaXplKHByb2Nlc3MuY3dkKCkpKTtcbiAgICBpZiAocHJvamVjdCAmJiB3b3Jrc3BhY2UuZ2V0UHJvamVjdFNjaGVtYXRpY3MocHJvamVjdCkpIHtcbiAgICAgIGNvbnN0IHNjaGVtYXRpY09iamVjdCA9IHdvcmtzcGFjZS5nZXRQcm9qZWN0U2NoZW1hdGljcyhwcm9qZWN0KVtmdWxsTmFtZV07XG4gICAgICBpZiAoc2NoZW1hdGljT2JqZWN0KSB7XG4gICAgICAgIHJlc3VsdCA9IHsgLi4ucmVzdWx0LCAuLi4oc2NoZW1hdGljT2JqZWN0IGFzIHt9KSB9O1xuICAgICAgfVxuICAgICAgY29uc3QgY29sbGVjdGlvbk9iamVjdCA9IHdvcmtzcGFjZS5nZXRQcm9qZWN0U2NoZW1hdGljcyhwcm9qZWN0KVtjb2xsZWN0aW9uXTtcbiAgICAgIGlmICh0eXBlb2YgY29sbGVjdGlvbk9iamVjdCA9PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheShjb2xsZWN0aW9uT2JqZWN0KSkge1xuICAgICAgICByZXN1bHQgPSB7IC4uLnJlc3VsdCwgLi4uKGNvbGxlY3Rpb25PYmplY3Rbc2NoZW1hdGljXSBhcyB7fSkgfTtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKCctLWNvbGxlY3Rpb25PYmplY3QtLScsIGNvbGxlY3Rpb25PYmplY3QpXG4gICAgfVxuICB9XG4gIGNvbnNvbGUubG9nKCctLXdvcmtzcGFjZS0tJywgd29ya3NwYWNlKVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNXYXJuaW5nRW5hYmxlZCh3YXJuaW5nOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgbGV0IHdvcmtzcGFjZSA9IGdldFdvcmtzcGFjZSgnbG9jYWwnKTtcblxuICBpZiAod29ya3NwYWNlKSB7XG4gICAgY29uc3QgcHJvamVjdCA9IHdvcmtzcGFjZS5nZXRQcm9qZWN0QnlQYXRoKG5vcm1hbGl6ZShwcm9jZXNzLmN3ZCgpKSk7XG4gICAgaWYgKHByb2plY3QgJiYgd29ya3NwYWNlLmdldFByb2plY3RDbGkocHJvamVjdCkpIHtcbiAgICAgIGNvbnN0IHdhcm5pbmdzID0gd29ya3NwYWNlLmdldFByb2plY3RDbGkocHJvamVjdClbJ3dhcm5pbmdzJ107XG4gICAgICBpZiAodHlwZW9mIHdhcm5pbmdzID09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KHdhcm5pbmdzKSkge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHdhcm5pbmdzW3dhcm5pbmddO1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09ICdib29sZWFuJykge1xuICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAod29ya3NwYWNlLmdldENsaSgpKSB7XG4gICAgICBjb25zdCB3YXJuaW5ncyA9IHdvcmtzcGFjZS5nZXRDbGkoKVsnd2FybmluZ3MnXTtcbiAgICAgIGlmICh0eXBlb2Ygd2FybmluZ3MgPT0gJ29iamVjdCcgJiYgIUFycmF5LmlzQXJyYXkod2FybmluZ3MpKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gd2FybmluZ3Nbd2FybmluZ107XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgd29ya3NwYWNlID0gZ2V0V29ya3NwYWNlKCdnbG9iYWwnKTtcbiAgaWYgKHdvcmtzcGFjZSAmJiB3b3Jrc3BhY2UuZ2V0Q2xpKCkpIHtcbiAgICBjb25zdCB3YXJuaW5ncyA9IHdvcmtzcGFjZS5nZXRDbGkoKVsnd2FybmluZ3MnXTtcbiAgICBpZiAodHlwZW9mIHdhcm5pbmdzID09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KHdhcm5pbmdzKSkge1xuICAgICAgY29uc3QgdmFsdWUgPSB3YXJuaW5nc1t3YXJuaW5nXTtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cbiJdfQ==