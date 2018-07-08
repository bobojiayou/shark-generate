
export default function showHelpInfo() {
    process.stdout.write('\n' + [
        'Usage: shark-generate [Command] [Options]',
        '',
        'Options',
        '',
        '-h, --help                   show the help info',
        '-v, --version                show the version info',
        '',
        '--module, -m      <dir>    generate module template to the dir',
        '--directive, -d   <dir>    generate directive template file to the dir',
        '--router, -r      <dir>    generate router template to the dir',
        '--component, -m   <dir>    generate component template to the dir'
    ].join('\n') + '\n')
}
