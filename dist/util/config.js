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
    return 'shark-schematics';
}
exports.getDefaultSchematicCollection = getDefaultSchematicCollection;
function getSchematicDefaults(collection, schematic, project) {
    let result = {};
    const fullName = `${collection}:${schematic}`;
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
        }
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6Ii9Vc2Vycy9ib2JvL1dvcmsvc2hhcmstZ2VuZXJhdGUvIiwic291cmNlcyI6WyJ1dGlsL2NvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNEQUFzRDtBQUN0RCwrQ0FFOEI7QUFDOUIsb0RBQTJEO0FBRTNELDJCQUErQztBQUMvQyx5QkFBeUI7QUFDekIsNkJBQTZCO0FBQzdCLHVDQUFtQztBQUVuQztJQUNFLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsMkJBQTJCLENBQUMsQ0FBQztBQUMzRCxDQUFDO0FBRVksUUFBQSxtQkFBbUIsR0FBRyxpQkFBaUIsRUFBRSxDQUFDO0FBRXZELE1BQU0sV0FBVyxHQUFHLENBQUMsMEJBQTBCLENBQUMsQ0FBQztBQUNqRCxNQUFNLGNBQWMsR0FBRywyQkFBMkIsQ0FBQztBQUVuRCx5QkFBeUIsV0FBb0I7SUFDM0MsNkVBQTZFO0lBQzdFLHlEQUF5RDtJQUN6RCxPQUFPLENBQUMsV0FBVyxJQUFJLGdCQUFNLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1dBQ25ELGdCQUFNLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztXQUNsQyxnQkFBTSxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUN0QyxDQUFDO0FBRUQ7SUFDRSxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDMUIsSUFBSSxDQUFDLElBQUksRUFBRTtRQUNULE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFFRCxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQztJQUMxQyxJQUFJLGVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUNqQixPQUFPLENBQUMsQ0FBQztLQUNWO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsTUFBTSxnQkFBZ0Is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O1lBQ2hDLElBQUksT0FBTyxLQUFLLElBQUksU0FBUyxFQUFFO2dCQUM3QixPQUFPLEtBQUssQ0FBQzthQUNkO1NBQ0Y7S0FDRjtJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQXJDRCw0Q0FxQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0c2xpbnQ6ZGlzYWJsZTpuby1nbG9iYWwtdHNsaW50LWRpc2FibGUgZmlsZS1oZWFkZXJcbmltcG9ydCB7XG4gIEpzb25Bc3RPYmplY3QsIEpzb25PYmplY3QsIEpzb25QYXJzZU1vZGUsIGV4cGVyaW1lbnRhbCwgbm9ybWFsaXplLCBwYXJzZUpzb25Bc3QsIHZpcnR1YWxGc1xufSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBOb2RlSnNTeW5jSG9zdCB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlL25vZGUnO1xuXG5pbXBvcnQgeyBleGlzdHNTeW5jLCB3cml0ZUZpbGVTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgb3MgZnJvbSAnb3MnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGZpbmRVcCB9IGZyb20gJy4vZmluZC11cCc7XG5cbmZ1bmN0aW9uIGdldFNjaGVtYUxvY2F0aW9uKCk6IHN0cmluZyB7XG4gIHJldHVybiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vbGliL2NvbmZpZy9zY2hlbWEuanNvbicpO1xufVxuXG5leHBvcnQgY29uc3Qgd29ya3NwYWNlU2NoZW1hUGF0aCA9IGdldFNjaGVtYUxvY2F0aW9uKCk7XG5cbmNvbnN0IGNvbmZpZ05hbWVzID0gWydzaGFyay1nZW5lcmF0ZS1jb25mLmpzb24nXTtcbmNvbnN0IGdsb2JhbEZpbGVOYW1lID0gJy5zaGFyay1nZW5lcmF0ZS1jb25mLmpzb24nO1xuXG5mdW5jdGlvbiBwcm9qZWN0RmlsZVBhdGgocHJvamVjdFBhdGg/OiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgLy8gRmluZCB0aGUgY29uZmlndXJhdGlvbiwgZWl0aGVyIHdoZXJlIHNwZWNpZmllZCwgaW4gdGhlIEFuZ3VsYXIgQ0xJIHByb2plY3RcbiAgLy8gKGlmIGl0J3MgaW4gbm9kZV9tb2R1bGVzKSBvciBmcm9tIHRoZSBjdXJyZW50IHByb2Nlc3MuXG4gIHJldHVybiAocHJvamVjdFBhdGggJiYgZmluZFVwKGNvbmZpZ05hbWVzLCBwcm9qZWN0UGF0aCkpXG4gICAgfHwgZmluZFVwKGNvbmZpZ05hbWVzLCBwcm9jZXNzLmN3ZCgpKVxuICAgIHx8IGZpbmRVcChjb25maWdOYW1lcywgX19kaXJuYW1lKTtcbn1cblxuZnVuY3Rpb24gZ2xvYmFsRmlsZVBhdGgoKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IGhvbWUgPSBvcy5ob21lZGlyKCk7XG4gIGlmICghaG9tZSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgcCA9IHBhdGguam9pbihob21lLCBnbG9iYWxGaWxlTmFtZSk7XG4gIGlmIChleGlzdHNTeW5jKHApKSB7XG4gICAgcmV0dXJuIHA7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuY29uc3QgY2FjaGVkV29ya3NwYWNlcyA9IG5ldyBNYXA8c3RyaW5nLCBleHBlcmltZW50YWwud29ya3NwYWNlLldvcmtzcGFjZSB8IG51bGw+KCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRXb3Jrc3BhY2UoXG4gIGxldmVsOiAnbG9jYWwnIHwgJ2dsb2JhbCcgPSAnbG9jYWwnLFxuKTogZXhwZXJpbWVudGFsLndvcmtzcGFjZS5Xb3Jrc3BhY2UgfCBudWxsIHtcbiAgY29uc3QgY2FjaGVkID0gY2FjaGVkV29ya3NwYWNlcy5nZXQobGV2ZWwpO1xuICBpZiAoY2FjaGVkICE9IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBjYWNoZWQ7XG4gIH1cblxuICBjb25zdCBjb25maWdQYXRoID0gbGV2ZWwgPT09ICdsb2NhbCcgPyBwcm9qZWN0RmlsZVBhdGgoKSA6IGdsb2JhbEZpbGVQYXRoKCk7XG5cbiAgaWYgKCFjb25maWdQYXRoKSB7XG4gICAgY2FjaGVkV29ya3NwYWNlcy5zZXQobGV2ZWwsIG51bGwpO1xuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCByb290ID0gbm9ybWFsaXplKHBhdGguZGlybmFtZShjb25maWdQYXRoKSk7XG4gIGNvbnN0IGZpbGUgPSBub3JtYWxpemUocGF0aC5iYXNlbmFtZShjb25maWdQYXRoKSk7XG4gIGNvbnN0IHdvcmtzcGFjZSA9IG5ldyBleHBlcmltZW50YWwud29ya3NwYWNlLldvcmtzcGFjZShcbiAgICByb290LFxuICAgIG5ldyBOb2RlSnNTeW5jSG9zdCgpLFxuICApO1xuXG4gIHdvcmtzcGFjZS5sb2FkV29ya3NwYWNlRnJvbUhvc3QoZmlsZSkuc3Vic2NyaWJlKCk7XG4gIGNhY2hlZFdvcmtzcGFjZXMuc2V0KGxldmVsLCB3b3Jrc3BhY2UpO1xuXG4gIHJldHVybiB3b3Jrc3BhY2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVHbG9iYWxTZXR0aW5ncygpOiBzdHJpbmcge1xuICBjb25zdCBob21lID0gb3MuaG9tZWRpcigpO1xuICBpZiAoIWhvbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGhvbWUgZGlyZWN0b3J5IGZvdW5kLicpO1xuICB9XG5cbiAgY29uc3QgZ2xvYmFsUGF0aCA9IHBhdGguam9pbihob21lLCBnbG9iYWxGaWxlTmFtZSk7XG4gIHdyaXRlRmlsZVN5bmMoZ2xvYmFsUGF0aCwgSlNPTi5zdHJpbmdpZnkoeyB2ZXJzaW9uOiAxIH0pKTtcblxuICByZXR1cm4gZ2xvYmFsUGF0aDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFdvcmtzcGFjZVJhdyhcbiAgbGV2ZWw6ICdsb2NhbCcgfCAnZ2xvYmFsJyA9ICdsb2NhbCcsXG4pOiBbSnNvbkFzdE9iamVjdCB8IG51bGwsIHN0cmluZyB8IG51bGxdIHtcbiAgbGV0IGNvbmZpZ1BhdGggPSBsZXZlbCA9PT0gJ2xvY2FsJyA/IHByb2plY3RGaWxlUGF0aCgpIDogZ2xvYmFsRmlsZVBhdGgoKTtcblxuICBpZiAoIWNvbmZpZ1BhdGgpIHtcbiAgICBpZiAobGV2ZWwgPT09ICdnbG9iYWwnKSB7XG4gICAgICBjb25maWdQYXRoID0gY3JlYXRlR2xvYmFsU2V0dGluZ3MoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFtudWxsLCBudWxsXTtcbiAgICB9XG4gIH1cblxuICBsZXQgY29udGVudCA9ICcnO1xuICBuZXcgTm9kZUpzU3luY0hvc3QoKS5yZWFkKG5vcm1hbGl6ZShjb25maWdQYXRoKSlcbiAgICAuc3Vic2NyaWJlKGRhdGEgPT4gY29udGVudCA9IHZpcnR1YWxGcy5maWxlQnVmZmVyVG9TdHJpbmcoZGF0YSkpO1xuXG4gIGNvbnN0IGFzdCA9IHBhcnNlSnNvbkFzdChjb250ZW50LCBKc29uUGFyc2VNb2RlLkxvb3NlKTtcblxuICBpZiAoYXN0LmtpbmQgIT0gJ29iamVjdCcpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgSlNPTicpO1xuICB9XG5cbiAgcmV0dXJuIFthc3QgYXMgSnNvbkFzdE9iamVjdCwgY29uZmlnUGF0aF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZVdvcmtzcGFjZShqc29uOiBKc29uT2JqZWN0KSB7XG4gIGNvbnN0IHdvcmtzcGFjZSA9IG5ldyBleHBlcmltZW50YWwud29ya3NwYWNlLldvcmtzcGFjZShcbiAgICBub3JtYWxpemUoJy4nKSxcbiAgICBuZXcgTm9kZUpzU3luY0hvc3QoKSxcbiAgKTtcblxuICBsZXQgZXJyb3I7XG4gIHdvcmtzcGFjZS5sb2FkV29ya3NwYWNlRnJvbUpzb24oanNvbikuc3Vic2NyaWJlKHtcbiAgICBlcnJvcjogZSA9PiBlcnJvciA9IGUsXG4gIH0pO1xuXG4gIGlmIChlcnJvcikge1xuICAgIHRocm93IGVycm9yO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYWNrYWdlTWFuYWdlcigpOiBzdHJpbmcge1xuICBsZXQgd29ya3NwYWNlID0gZ2V0V29ya3NwYWNlKCdsb2NhbCcpO1xuXG4gIGlmICh3b3Jrc3BhY2UpIHtcbiAgICBjb25zdCBwcm9qZWN0ID0gd29ya3NwYWNlLmdldFByb2plY3RCeVBhdGgobm9ybWFsaXplKHByb2Nlc3MuY3dkKCkpKTtcbiAgICBpZiAocHJvamVjdCAmJiB3b3Jrc3BhY2UuZ2V0UHJvamVjdENsaShwcm9qZWN0KSkge1xuICAgICAgY29uc3QgdmFsdWUgPSB3b3Jrc3BhY2UuZ2V0UHJvamVjdENsaShwcm9qZWN0KVsncGFja2FnZU1hbmFnZXInXTtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAod29ya3NwYWNlLmdldENsaSgpKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHdvcmtzcGFjZS5nZXRDbGkoKVsncGFja2FnZU1hbmFnZXInXTtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHdvcmtzcGFjZSA9IGdldFdvcmtzcGFjZSgnZ2xvYmFsJyk7XG4gIGlmICh3b3Jrc3BhY2UgJiYgd29ya3NwYWNlLmdldENsaSgpKSB7XG4gICAgY29uc3QgdmFsdWUgPSB3b3Jrc3BhY2UuZ2V0Q2xpKClbJ3BhY2thZ2VNYW5hZ2VyJ107XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiAnbnBtJztcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVmYXVsdFNjaGVtYXRpY0NvbGxlY3Rpb24oKTogc3RyaW5nIHtcbiAgbGV0IHdvcmtzcGFjZSA9IGdldFdvcmtzcGFjZSgnbG9jYWwnKTtcblxuICBpZiAod29ya3NwYWNlKSB7XG4gICAgY29uc3QgcHJvamVjdCA9IHdvcmtzcGFjZS5nZXRQcm9qZWN0QnlQYXRoKG5vcm1hbGl6ZShwcm9jZXNzLmN3ZCgpKSk7XG4gICAgaWYgKHByb2plY3QgJiYgd29ya3NwYWNlLmdldFByb2plY3RDbGkocHJvamVjdCkpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gd29ya3NwYWNlLmdldFByb2plY3RDbGkocHJvamVjdClbJ2RlZmF1bHRDb2xsZWN0aW9uJ107XG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHdvcmtzcGFjZS5nZXRDbGkoKSkge1xuICAgICAgY29uc3QgdmFsdWUgPSB3b3Jrc3BhY2UuZ2V0Q2xpKClbJ2RlZmF1bHRDb2xsZWN0aW9uJ107XG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB3b3Jrc3BhY2UgPSBnZXRXb3Jrc3BhY2UoJ2dsb2JhbCcpO1xuICBpZiAod29ya3NwYWNlICYmIHdvcmtzcGFjZS5nZXRDbGkoKSkge1xuICAgIGNvbnN0IHZhbHVlID0gd29ya3NwYWNlLmdldENsaSgpWydkZWZhdWx0Q29sbGVjdGlvbiddO1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gJ3NoYXJrLXNjaGVtYXRpY3MnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2NoZW1hdGljRGVmYXVsdHMoXG4gIGNvbGxlY3Rpb246IHN0cmluZyxcbiAgc2NoZW1hdGljOiBzdHJpbmcsXG4gIHByb2plY3Q/OiBzdHJpbmcgfCBudWxsLFxuKToge30ge1xuICBsZXQgcmVzdWx0ID0ge307XG4gIGNvbnN0IGZ1bGxOYW1lID0gYCR7Y29sbGVjdGlvbn06JHtzY2hlbWF0aWN9YDtcbiAgbGV0IHdvcmtzcGFjZSA9IGdldFdvcmtzcGFjZSgnZ2xvYmFsJyk7XG4gIGlmICh3b3Jrc3BhY2UgJiYgd29ya3NwYWNlLmdldFNjaGVtYXRpY3MoKSkge1xuICAgIGNvbnN0IHNjaGVtYXRpY09iamVjdCA9IHdvcmtzcGFjZS5nZXRTY2hlbWF0aWNzKClbZnVsbE5hbWVdO1xuICAgIGlmIChzY2hlbWF0aWNPYmplY3QpIHtcbiAgICAgIHJlc3VsdCA9IHsgLi4ucmVzdWx0LCAuLi4oc2NoZW1hdGljT2JqZWN0IGFzIHt9KSB9O1xuICAgIH1cbiAgICBjb25zdCBjb2xsZWN0aW9uT2JqZWN0ID0gd29ya3NwYWNlLmdldFNjaGVtYXRpY3MoKVtjb2xsZWN0aW9uXTtcbiAgICBpZiAodHlwZW9mIGNvbGxlY3Rpb25PYmplY3QgPT0gJ29iamVjdCcgJiYgIUFycmF5LmlzQXJyYXkoY29sbGVjdGlvbk9iamVjdCkpIHtcbiAgICAgIHJlc3VsdCA9IHsgLi4ucmVzdWx0LCAuLi4oY29sbGVjdGlvbk9iamVjdFtzY2hlbWF0aWNdIGFzIHt9KSB9O1xuICAgIH1cblxuICB9XG5cbiAgd29ya3NwYWNlID0gZ2V0V29ya3NwYWNlKCdsb2NhbCcpO1xuXG4gIGlmICh3b3Jrc3BhY2UpIHtcbiAgICBpZiAod29ya3NwYWNlLmdldFNjaGVtYXRpY3MoKSkge1xuICAgICAgY29uc3Qgc2NoZW1hdGljT2JqZWN0ID0gd29ya3NwYWNlLmdldFNjaGVtYXRpY3MoKVtmdWxsTmFtZV07XG4gICAgICBpZiAoc2NoZW1hdGljT2JqZWN0KSB7XG4gICAgICAgIHJlc3VsdCA9IHsgLi4ucmVzdWx0LCAuLi4oc2NoZW1hdGljT2JqZWN0IGFzIHt9KSB9O1xuICAgICAgfVxuICAgICAgY29uc3QgY29sbGVjdGlvbk9iamVjdCA9IHdvcmtzcGFjZS5nZXRTY2hlbWF0aWNzKClbY29sbGVjdGlvbl07XG4gICAgICBpZiAodHlwZW9mIGNvbGxlY3Rpb25PYmplY3QgPT0gJ29iamVjdCcgJiYgIUFycmF5LmlzQXJyYXkoY29sbGVjdGlvbk9iamVjdCkpIHtcbiAgICAgICAgcmVzdWx0ID0geyAuLi5yZXN1bHQsIC4uLihjb2xsZWN0aW9uT2JqZWN0W3NjaGVtYXRpY10gYXMge30pIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcHJvamVjdCA9IHByb2plY3QgfHwgd29ya3NwYWNlLmdldFByb2plY3RCeVBhdGgobm9ybWFsaXplKHByb2Nlc3MuY3dkKCkpKTtcbiAgICBpZiAocHJvamVjdCAmJiB3b3Jrc3BhY2UuZ2V0UHJvamVjdFNjaGVtYXRpY3MocHJvamVjdCkpIHtcbiAgICAgIGNvbnN0IHNjaGVtYXRpY09iamVjdCA9IHdvcmtzcGFjZS5nZXRQcm9qZWN0U2NoZW1hdGljcyhwcm9qZWN0KVtmdWxsTmFtZV07XG4gICAgICBpZiAoc2NoZW1hdGljT2JqZWN0KSB7XG4gICAgICAgIHJlc3VsdCA9IHsgLi4ucmVzdWx0LCAuLi4oc2NoZW1hdGljT2JqZWN0IGFzIHt9KSB9O1xuICAgICAgfVxuICAgICAgY29uc3QgY29sbGVjdGlvbk9iamVjdCA9IHdvcmtzcGFjZS5nZXRQcm9qZWN0U2NoZW1hdGljcyhwcm9qZWN0KVtjb2xsZWN0aW9uXTtcbiAgICAgIGlmICh0eXBlb2YgY29sbGVjdGlvbk9iamVjdCA9PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheShjb2xsZWN0aW9uT2JqZWN0KSkge1xuICAgICAgICByZXN1bHQgPSB7IC4uLnJlc3VsdCwgLi4uKGNvbGxlY3Rpb25PYmplY3Rbc2NoZW1hdGljXSBhcyB7fSkgfTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzV2FybmluZ0VuYWJsZWQod2FybmluZzogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGxldCB3b3Jrc3BhY2UgPSBnZXRXb3Jrc3BhY2UoJ2xvY2FsJyk7XG5cbiAgaWYgKHdvcmtzcGFjZSkge1xuICAgIGNvbnN0IHByb2plY3QgPSB3b3Jrc3BhY2UuZ2V0UHJvamVjdEJ5UGF0aChub3JtYWxpemUocHJvY2Vzcy5jd2QoKSkpO1xuICAgIGlmIChwcm9qZWN0ICYmIHdvcmtzcGFjZS5nZXRQcm9qZWN0Q2xpKHByb2plY3QpKSB7XG4gICAgICBjb25zdCB3YXJuaW5ncyA9IHdvcmtzcGFjZS5nZXRQcm9qZWN0Q2xpKHByb2plY3QpWyd3YXJuaW5ncyddO1xuICAgICAgaWYgKHR5cGVvZiB3YXJuaW5ncyA9PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheSh3YXJuaW5ncykpIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSB3YXJuaW5nc1t3YXJuaW5nXTtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHdvcmtzcGFjZS5nZXRDbGkoKSkge1xuICAgICAgY29uc3Qgd2FybmluZ3MgPSB3b3Jrc3BhY2UuZ2V0Q2xpKClbJ3dhcm5pbmdzJ107XG4gICAgICBpZiAodHlwZW9mIHdhcm5pbmdzID09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KHdhcm5pbmdzKSkge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHdhcm5pbmdzW3dhcm5pbmddO1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09ICdib29sZWFuJykge1xuICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHdvcmtzcGFjZSA9IGdldFdvcmtzcGFjZSgnZ2xvYmFsJyk7XG4gIGlmICh3b3Jrc3BhY2UgJiYgd29ya3NwYWNlLmdldENsaSgpKSB7XG4gICAgY29uc3Qgd2FybmluZ3MgPSB3b3Jrc3BhY2UuZ2V0Q2xpKClbJ3dhcm5pbmdzJ107XG4gICAgaWYgKHR5cGVvZiB3YXJuaW5ncyA9PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheSh3YXJuaW5ncykpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gd2FybmluZ3Nbd2FybmluZ107XG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09ICdib29sZWFuJykge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG4iXX0=