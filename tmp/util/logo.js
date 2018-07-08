"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const figlet = require('figlet');
function showLogoInfo(text, config) {
    figlet(text, config, (err, data) => {
        if (err) {
            console.log('Something went wrong...');
            console.dir(err);
            return;
        }
        console.log(data);
    });
}
exports.default = showLogoInfo;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nby5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsidXRpbC9sb2dvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFBO0FBRWhDLHNCQUFxQyxJQUFTLEVBQUUsTUFBVztJQUN2RCxNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDLEdBQTRCLEVBQUUsSUFBbUIsRUFBRSxFQUFFO1FBQ3ZFLElBQUksR0FBRyxFQUFFO1lBQ0wsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFBO1lBQ3RDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDaEIsT0FBTTtTQUNUO1FBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUNyQixDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUFURCwrQkFTQyIsInNvdXJjZXNDb250ZW50IjpbIlxuY29uc3QgZmlnbGV0ID0gcmVxdWlyZSgnZmlnbGV0JylcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gc2hvd0xvZ29JbmZvKHRleHQ6IGFueSwgY29uZmlnOiBhbnkpIHtcbiAgICBmaWdsZXQodGV4dCwgY29uZmlnLCAoZXJyOiBFcnJvciB8IHN0cmluZyB8IG9iamVjdCwgZGF0YTogc3RyaW5nIHwgbnVsbCkgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnU29tZXRoaW5nIHdlbnQgd3JvbmcuLi4nKVxuICAgICAgICAgICAgY29uc29sZS5kaXIoZXJyKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICB9KTtcbn0iXX0=