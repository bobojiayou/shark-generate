"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk = require('chalk');
const log = console.log;
const info = (v) => log(chalk.green(`[shark-generate info]:${v}`));
exports.info = info;
const warn = (v) => log(chalk.yellow(`[shark-generate warn]:${v}`));
exports.warn = warn;
const error = (v) => log(chalk.red(`[shark-generate error]:${v}`));
exports.error = error;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJ1dGlsL2xvZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQTtBQUU5QixNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFBO0FBQ3ZCLE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBUyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO0FBS3RFLG9CQUFJO0FBSlIsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFTLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLHlCQUF5QixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7QUFLdkUsb0JBQUk7QUFKUixNQUFNLEtBQUssR0FBRyxDQUFDLENBQVMsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsMEJBQTBCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtBQUt0RSxzQkFBSyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGNoYWxrID0gcmVxdWlyZSgnY2hhbGsnKVxuXG5jb25zdCBsb2cgPSBjb25zb2xlLmxvZ1xuY29uc3QgaW5mbyA9ICh2OiBzdHJpbmcpID0+IGxvZyhjaGFsay5ncmVlbihgW3NoYXJrLWdlbmVyYXRlIGluZm9dOiR7dn1gKSlcbmNvbnN0IHdhcm4gPSAodjogc3RyaW5nKSA9PiBsb2coY2hhbGsueWVsbG93KGBbc2hhcmstZ2VuZXJhdGUgd2Fybl06JHt2fWApKVxuY29uc3QgZXJyb3IgPSAodjogc3RyaW5nKSA9PiBsb2coY2hhbGsucmVkKGBbc2hhcmstZ2VuZXJhdGUgZXJyb3JdOiR7dn1gKSlcblxuZXhwb3J0IHtcbiAgICBpbmZvLFxuICAgIHdhcm4sXG4gICAgZXJyb3Jcbn0iXX0=