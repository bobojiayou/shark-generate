"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function showHelpInfo() {
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
    ].join('\n') + '\n');
}
exports.default = showHelpInfo;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscC5qcyIsInNvdXJjZVJvb3QiOiIvVXNlcnMvYm9iby9Xb3JrL3NoYXJrLWdlbmVyYXRlLyIsInNvdXJjZXMiOlsidXRpbC9oZWxwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0E7SUFDSSxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUc7UUFDeEIsMkNBQTJDO1FBQzNDLEVBQUU7UUFDRixTQUFTO1FBQ1QsRUFBRTtRQUNGLGlEQUFpRDtRQUNqRCxvREFBb0Q7UUFDcEQsRUFBRTtRQUNGLGdFQUFnRTtRQUNoRSx3RUFBd0U7UUFDeEUsZ0VBQWdFO1FBQ2hFLG1FQUFtRTtLQUN0RSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQTtBQUN4QixDQUFDO0FBZEQsK0JBY0MiLCJzb3VyY2VzQ29udGVudCI6WyJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHNob3dIZWxwSW5mbygpIHtcbiAgICBwcm9jZXNzLnN0ZG91dC53cml0ZSgnXFxuJyArIFtcbiAgICAgICAgJ1VzYWdlOiBzaGFyay1nZW5lcmF0ZSBbQ29tbWFuZF0gW09wdGlvbnNdJyxcbiAgICAgICAgJycsXG4gICAgICAgICdPcHRpb25zJyxcbiAgICAgICAgJycsXG4gICAgICAgICctaCwgLS1oZWxwICAgICAgICAgICAgICAgICAgIHNob3cgdGhlIGhlbHAgaW5mbycsXG4gICAgICAgICctdiwgLS12ZXJzaW9uICAgICAgICAgICAgICAgIHNob3cgdGhlIHZlcnNpb24gaW5mbycsXG4gICAgICAgICcnLFxuICAgICAgICAnLS1tb2R1bGUsIC1tICAgICAgPGRpcj4gICAgZ2VuZXJhdGUgbW9kdWxlIHRlbXBsYXRlIHRvIHRoZSBkaXInLFxuICAgICAgICAnLS1kaXJlY3RpdmUsIC1kICAgPGRpcj4gICAgZ2VuZXJhdGUgZGlyZWN0aXZlIHRlbXBsYXRlIGZpbGUgdG8gdGhlIGRpcicsXG4gICAgICAgICctLXJvdXRlciwgLXIgICAgICA8ZGlyPiAgICBnZW5lcmF0ZSByb3V0ZXIgdGVtcGxhdGUgdG8gdGhlIGRpcicsXG4gICAgICAgICctLWNvbXBvbmVudCwgLW0gICA8ZGlyPiAgICBnZW5lcmF0ZSBjb21wb25lbnQgdGVtcGxhdGUgdG8gdGhlIGRpcidcbiAgICBdLmpvaW4oJ1xcbicpICsgJ1xcbicpXG59XG4iXX0=