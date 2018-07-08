import { normalize } from '@angular-devkit/core';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { findUp } from './find-up';

export function insideProject(): boolean {
    return getProjectDetails() !== null;
}

export interface ProjectDetails {
    root: string;
    configFile?: string;
}

// 获取项目的细节
export function getProjectDetails(): ProjectDetails | null {
    // 当前目录路径
    const currentDir = process.cwd();
    // 可能存在的配置文件列表
    const possibleConfigFiles = [
        'shark-generate-conf.json',
        '.shark-generate-conf.json'
    ];
    // 在当前路径下寻找可能存在的配置文件 possibleConfigFiles
    const configFilePath = findUp(possibleConfigFiles, currentDir);
    if (configFilePath === null) {
        return null;
    }
    const configFileName = path.basename(configFilePath);

    const possibleDir = path.dirname(configFilePath);

    const homedir = os.homedir();
    if (normalize(possibleDir) === normalize(homedir)) {
        const packageJsonPath = path.join(possibleDir, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            // No package.json
            return null;
        }
        const packageJsonBuffer = fs.readFileSync(packageJsonPath);
        const packageJsonText = packageJsonBuffer === null ? '{}' : packageJsonBuffer.toString();
        const packageJson = JSON.parse(packageJsonText);
        if (!containsCliDep(packageJson)) {
            // 不存在shark-generate依赖
            return null;
        }
    }

    // 返回 项目根路径 和 配置文件名
    return {
        root: possibleDir,
        configFile: configFileName,
    };
}

// 是否已安排 shark-generate 依赖
function containsCliDep(obj: any): boolean {
    const pkgName = 'shark-generate';
    if (obj) {
        if (obj.dependencies && obj.dependencies[pkgName]) {
            return true;
        }
        if (obj.devDependencies && obj.devDependencies[pkgName]) {
            return true;
        }
    }
    return false;
}
