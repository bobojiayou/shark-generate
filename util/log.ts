const chalk = require('chalk')

const log = console.log
const info = (v: string) => log(chalk.green(`[shark-generate info]:${v}`))
const warn = (v: string) => log(chalk.yellow(`[shark-generate warn]:${v}`))
const error = (v: string) => log(chalk.red(`[shark-generate error]:${v}`))

export {
    info,
    warn,
    error
}