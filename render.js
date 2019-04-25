const terminal = require('./terminal');

const render = module.exports = {
    deferred: false,
    colors: [],
    start () {
        render.deferred = true;
    },
    end () {
        render.deferred = false;
        for (var pad = 0x0; pad < 0xF; pad++) {
            render.color(pad, render.colors[pad]);
        }
    },
    color (pad, color) {
        let colors = {
            'black': 0x00,
            'red': 0x01,
            'green': 0x04,
            'yellow': 0x05,
            'blue': 0x10,
            'magenta': 0x11,
            'cyan': 0x14,
            'white': 0x7F,
        }

        // Keeps pad inside 0..F
        pad = Math.max(0x0, Math.min(0xF, pad));

        // Deferred rendering so we don't get flickering
        if (render.deferred) {
            render.colors[pad] = color;
            return;
        }

        // Defaults to white, but selects color from table
        color = colors[color] || colors['black'];

        // Adds 0x70 to current pad
        pad = 0x70 + pad;

        // Generate SysEx call (REF: https://forum.arturia.com/index.php?topic=93116.msg153137#msg153137)
        let bytes = [0xF0, 0x00, 0x20, 0x6B, 0x7F, 0x42, 0x02, 0x00, 0x10, pad, color, 0xF7];

        // Send the call
        output.send('sysex', bytes);
    },
    clear () {
        render.bar(0x0, 0xF, 'black');
    },
    bar (start, length, color) {
        for (var pad = 0x0; pad < length; pad++) {
            render.color(pad + start, color);
        }
    }
}