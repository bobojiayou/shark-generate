// tslint:disable:no-global-tslint-disable file-header
import {
  JsonAstObject, JsonObject, JsonParseMode, experimental, normalize, parseJsonAst, virtualFs
} from '@angular-devkit/core';
import { NodeJsSyncHost } from '@angular-devkit/core/node';

import { existsSync, writeFileSync } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { findUp } from './find-up';

function getSchemaLocation(): string {
  return path.join(__dirname, '../lib/config/schema.json');
}

export const workspaceSchemaPath = getSchemaLocation();

const configNames = ['shark-generate-conf.json'];
const globalFileName = '.shark-generate-conf.json';

function projectFilePath(projectPath?: string): string | null {
  // Find the configuration, either where specified, in the Angular CLI project
  // (if it's in node_modules) or from the current process.
  return (projectPath && findUp(configNames, projectPath))
    || findUp(configNames, process.cwd())
    || findUp(configNames, __dirname);
}

function globalFilePath(): string | null {
  const home = os.homedir();
  if (!home) {
    return null;
  }

  const p = path.join(home, globalFileName);
  if (existsSync(p)) {
    return p;
  }

  return null;
}

const cachedWorkspaces = new Map<string, experimental.workspace.Workspace | null>();

export function getWorkspace(
  level: 'local' | 'global' = 'local',
): experimental.workspace.Workspace | null {
  const cached = cachedWorkspaces.get(level);
  if (cached != undefined) {
    return cached;
  }

  const configPath = level === 'local' ? projectFilePath() : globalFilePath();

  if (!configPath) {
    cachedWorkspaces.set(level, null);

    return null;
  }

  const root = normalize(path.dirname(configPath));
  const file = normalize(path.basename(configPath));
  const workspace = new experimental.workspace.Workspace(
    root,
    new NodeJsSyncHost(),
  );

  workspace.loadWorkspaceFromHost(file).subscribe();
  cachedWorkspaces.set(level, workspace);

  return workspace;
}

export function createGlobalSettings(): string {
  const home = os.homedir();
  if (!home) {
    throw new Error('No home directory found.');
  }

  const globalPath = path.join(home, globalFileName);
  writeFileSync(globalPath, JSON.stringify({ version: 1 }));

  return globalPath;
}

export function getWorkspaceRaw(
  level: 'local' | 'global' = 'local',
): [JsonAstObject | null, string | null] {
  let configPath = level === 'local' ? projectFilePath() : globalFilePath();

  if (!configPath) {
    if (level === 'global') {
      configPath = createGlobalSettings();
    } else {
      return [null, null];
    }
  }

  let content = '';
  new NodeJsSyncHost().read(normalize(configPath))
    .subscribe(data => content = virtualFs.fileBufferToString(data));

  const ast = parseJsonAst(content, JsonParseMode.Loose);

  if (ast.kind != 'object') {
    throw new Error('Invalid JSON');
  }

  return [ast as JsonAstObject, configPath];
}

export function validateWorkspace(json: JsonObject) {
  const workspace = new experimental.workspace.Workspace(
    normalize('.'),
    new NodeJsSyncHost(),
  );

  let error;
  workspace.loadWorkspaceFromJson(json).subscribe({
    error: e => error = e,
  });

  if (error) {
    throw error;
  }

  return true;
}

export function getPackageManager(): string {
  let workspace = getWorkspace('local');

  if (workspace) {
    const project = workspace.getProjectByPath(normalize(process.cwd()));
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


export function getDefaultSchematicCollection(): string {
  let workspace = getWorkspace('local');

  if (workspace) {
    const project = workspace.getProjectByPath(normalize(process.cwd()));
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

export function getSchematicDefaults(
  collection: string,
  schematic: string,
  project?: string | null,
): {} {
  let result = {};
  const fullName = `${collection}:${schematic}`;
  let workspace = getWorkspace('global');
  if (workspace && workspace.getSchematics()) {
    const schematicObject = workspace.getSchematics()[fullName];
    if (schematicObject) {
      result = { ...result, ...(schematicObject as {}) };
    }
    const collectionObject = workspace.getSchematics()[collection];
    if (typeof collectionObject == 'object' && !Array.isArray(collectionObject)) {
      result = { ...result, ...(collectionObject[schematic] as {}) };
    }

  }

  workspace = getWorkspace('local');

  if (workspace) {
    if (workspace.getSchematics()) {
      const schematicObject = workspace.getSchematics()[fullName];
      if (schematicObject) {
        result = { ...result, ...(schematicObject as {}) };
      }
      const collectionObject = workspace.getSchematics()[collection];
      if (typeof collectionObject == 'object' && !Array.isArray(collectionObject)) {
        result = { ...result, ...(collectionObject[schematic] as {}) };
      }
    }

    project = project || workspace.getProjectByPath(normalize(process.cwd()));
    if (project && workspace.getProjectSchematics(project)) {
      const schematicObject = workspace.getProjectSchematics(project)[fullName];
      if (schematicObject) {
        result = { ...result, ...(schematicObject as {}) };
      }
      const collectionObject = workspace.getProjectSchematics(project)[collection];
      if (typeof collectionObject == 'object' && !Array.isArray(collectionObject)) {
        result = { ...result, ...(collectionObject[schematic] as {}) };
      }
    }
  }
  return result;
}

export function isWarningEnabled(warning: string): boolean {
  let workspace = getWorkspace('local');

  if (workspace) {
    const project = workspace.getProjectByPath(normalize(process.cwd()));
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
