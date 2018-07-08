
const figlet = require('figlet')

export default function showLogoInfo(text: any, config: any) {
    figlet(text, config, (err: Error | string | object, data: string | null) => {
        if (err) {
            console.log('Something went wrong...')
            console.dir(err)
            return
        }
        console.log(data)
    });
}