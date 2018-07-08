"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const fs = require("fs");
const os = require("os");
const path = require("path");
const find_up_1 = require("./find-up");
function insideProject() {
    return getProjectDetails() !== null;
}
exports.insideProject = insideProject;
// 获取项目的细节
function getProjectDetails() {
    // 当前目录路径
    const currentDir = process.cwd();
    // 可能存在的配置文件列表
    const possibleConfigFiles = [
        'shark-generate-conf.json',
        '.shark-generate-conf.json'
    ];
    // 在当前路径下寻找可能存在的配置文件 possibleConfigFiles
    const configFilePath = find_up_1.findUp(possibleConfigFiles, currentDir);
    if (configFilePath === null) {
        return null;
    }
    const configFileName = path.basename(configFilePath);
    const possibleDir = path.dirname(configFilePath);
    const homedir = os.homedir();
    if (core_1.normalize(possibleDir) === core_1.normalize(homedir)) {
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
exports.getProjectDetails = getProjectDetails;
// 是否已安排 shark-generate 依赖
function containsCliDep(obj) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdC5qcyIsInNvdXJjZVJvb3QiOiIvVXNlcnMvYm9iby9Xb3JrL3NoYXJrLWdlbmVyYXRlLyIsInNvdXJjZXMiOlsidXRpbC9wcm9qZWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsK0NBQWlEO0FBQ2pELHlCQUF5QjtBQUN6Qix5QkFBeUI7QUFDekIsNkJBQTZCO0FBQzdCLHVDQUFtQztBQUVuQztJQUNJLE9BQU8saUJBQWlCLEVBQUUsS0FBSyxJQUFJLENBQUM7QUFDeEMsQ0FBQztBQUZELHNDQUVDO0FBT0QsVUFBVTtBQUNWO0lBQ0ksU0FBUztJQUNULE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUNqQyxjQUFjO0lBQ2QsTUFBTSxtQkFBbUIsR0FBRztRQUN4QiwwQkFBMEI7UUFDMUIsMkJBQTJCO0tBQzlCLENBQUM7SUFDRix3Q0FBd0M7SUFDeEMsTUFBTSxjQUFjLEdBQUcsZ0JBQU0sQ0FBQyxtQkFBbUIsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUMvRCxJQUFJLGNBQWMsS0FBSyxJQUFJLEVBQUU7UUFDekIsT0FBTyxJQUFJLENBQUM7S0FDZjtJQUNELE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLENBQUM7SUFFckQsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUVqRCxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDN0IsSUFBSSxnQkFBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLLGdCQUFTLENBQUMsT0FBTyxDQUFDLEVBQUU7UUFDL0MsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDL0QsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLEVBQUU7WUFDakMsa0JBQWtCO1lBQ2xCLE9BQU8sSUFBSSxDQUFDO1NBQ2Y7UUFDRCxNQUFNLGlCQUFpQixHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDM0QsTUFBTSxlQUFlLEdBQUcsaUJBQWlCLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3pGLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDaEQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsRUFBRTtZQUM5QixzQkFBc0I7WUFDdEIsT0FBTyxJQUFJLENBQUM7U0FDZjtLQUNKO0lBRUQsbUJBQW1CO0lBQ25CLE9BQU87UUFDSCxJQUFJLEVBQUUsV0FBVztRQUNqQixVQUFVLEVBQUUsY0FBYztLQUM3QixDQUFDO0FBQ04sQ0FBQztBQXRDRCw4Q0FzQ0M7QUFFRCwwQkFBMEI7QUFDMUIsd0JBQXdCLEdBQVE7SUFDNUIsTUFBTSxPQUFPLEdBQUcsZ0JBQWdCLENBQUM7SUFDakMsSUFBSSxHQUFHLEVBQUU7UUFDTCxJQUFJLEdBQUcsQ0FBQyxZQUFZLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUMvQyxPQUFPLElBQUksQ0FBQztTQUNmO1FBQ0QsSUFBSSxHQUFHLENBQUMsZUFBZSxJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDckQsT0FBTyxJQUFJLENBQUM7U0FDZjtLQUNKO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDakIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IG5vcm1hbGl6ZSB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIG9zIGZyb20gJ29zJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBmaW5kVXAgfSBmcm9tICcuL2ZpbmQtdXAnO1xuXG5leHBvcnQgZnVuY3Rpb24gaW5zaWRlUHJvamVjdCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gZ2V0UHJvamVjdERldGFpbHMoKSAhPT0gbnVsbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQcm9qZWN0RGV0YWlscyB7XG4gICAgcm9vdDogc3RyaW5nO1xuICAgIGNvbmZpZ0ZpbGU/OiBzdHJpbmc7XG59XG5cbi8vIOiOt+WPlumhueebrueahOe7huiKglxuZXhwb3J0IGZ1bmN0aW9uIGdldFByb2plY3REZXRhaWxzKCk6IFByb2plY3REZXRhaWxzIHwgbnVsbCB7XG4gICAgLy8g5b2T5YmN55uu5b2V6Lev5b6EXG4gICAgY29uc3QgY3VycmVudERpciA9IHByb2Nlc3MuY3dkKCk7XG4gICAgLy8g5Y+v6IO95a2Y5Zyo55qE6YWN572u5paH5Lu25YiX6KGoXG4gICAgY29uc3QgcG9zc2libGVDb25maWdGaWxlcyA9IFtcbiAgICAgICAgJ3NoYXJrLWdlbmVyYXRlLWNvbmYuanNvbicsXG4gICAgICAgICcuc2hhcmstZ2VuZXJhdGUtY29uZi5qc29uJ1xuICAgIF07XG4gICAgLy8g5Zyo5b2T5YmN6Lev5b6E5LiL5a+75om+5Y+v6IO95a2Y5Zyo55qE6YWN572u5paH5Lu2IHBvc3NpYmxlQ29uZmlnRmlsZXNcbiAgICBjb25zdCBjb25maWdGaWxlUGF0aCA9IGZpbmRVcChwb3NzaWJsZUNvbmZpZ0ZpbGVzLCBjdXJyZW50RGlyKTtcbiAgICBpZiAoY29uZmlnRmlsZVBhdGggPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IGNvbmZpZ0ZpbGVOYW1lID0gcGF0aC5iYXNlbmFtZShjb25maWdGaWxlUGF0aCk7XG5cbiAgICBjb25zdCBwb3NzaWJsZURpciA9IHBhdGguZGlybmFtZShjb25maWdGaWxlUGF0aCk7XG5cbiAgICBjb25zdCBob21lZGlyID0gb3MuaG9tZWRpcigpO1xuICAgIGlmIChub3JtYWxpemUocG9zc2libGVEaXIpID09PSBub3JtYWxpemUoaG9tZWRpcikpIHtcbiAgICAgICAgY29uc3QgcGFja2FnZUpzb25QYXRoID0gcGF0aC5qb2luKHBvc3NpYmxlRGlyLCAncGFja2FnZS5qc29uJyk7XG4gICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhwYWNrYWdlSnNvblBhdGgpKSB7XG4gICAgICAgICAgICAvLyBObyBwYWNrYWdlLmpzb25cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBhY2thZ2VKc29uQnVmZmVyID0gZnMucmVhZEZpbGVTeW5jKHBhY2thZ2VKc29uUGF0aCk7XG4gICAgICAgIGNvbnN0IHBhY2thZ2VKc29uVGV4dCA9IHBhY2thZ2VKc29uQnVmZmVyID09PSBudWxsID8gJ3t9JyA6IHBhY2thZ2VKc29uQnVmZmVyLnRvU3RyaW5nKCk7XG4gICAgICAgIGNvbnN0IHBhY2thZ2VKc29uID0gSlNPTi5wYXJzZShwYWNrYWdlSnNvblRleHQpO1xuICAgICAgICBpZiAoIWNvbnRhaW5zQ2xpRGVwKHBhY2thZ2VKc29uKSkge1xuICAgICAgICAgICAgLy8g5LiN5a2Y5Zyoc2hhcmstZ2VuZXJhdGXkvp3otZZcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g6L+U5ZueIOmhueebruaguei3r+W+hCDlkowg6YWN572u5paH5Lu25ZCNXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcm9vdDogcG9zc2libGVEaXIsXG4gICAgICAgIGNvbmZpZ0ZpbGU6IGNvbmZpZ0ZpbGVOYW1lLFxuICAgIH07XG59XG5cbi8vIOaYr+WQpuW3suWuieaOkiBzaGFyay1nZW5lcmF0ZSDkvp3otZZcbmZ1bmN0aW9uIGNvbnRhaW5zQ2xpRGVwKG9iajogYW55KTogYm9vbGVhbiB7XG4gICAgY29uc3QgcGtnTmFtZSA9ICdzaGFyay1nZW5lcmF0ZSc7XG4gICAgaWYgKG9iaikge1xuICAgICAgICBpZiAob2JqLmRlcGVuZGVuY2llcyAmJiBvYmouZGVwZW5kZW5jaWVzW3BrZ05hbWVdKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLmRldkRlcGVuZGVuY2llcyAmJiBvYmouZGV2RGVwZW5kZW5jaWVzW3BrZ05hbWVdKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG4iXX0=