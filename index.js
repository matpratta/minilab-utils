const easymidi = require('easymidi');
const audio = require('win-audio').speaker;

var controller = 'MiniLab';

var inputs = easymidi.getInputs();
var outputs = easymidi.getOutputs();

console.log('inputs found:', inputs);
console.log('outputs found:', outputs);

// TODO: loop through both inputs and outputs and select the MiniLab

var input = new easymidi.Input(inputs[0]);
var output = new easymidi.Output(outputs[1]);

input.on('noteon', args => console.log('noteon', args));
input.on('poly aftertouch', args => console.log('poly aftertouch', args));
input.on('cc', args => console.log('cc', args));
input.on('program', args => console.log('program', args));
input.on('channel aftertouch', args => console.log('channel aftertouch', args));
input.on('pitch', args => console.log('pitch', args));
input.on('position', args => console.log('position', args));
input.on('mtc', args => console.log('mtc', args));
input.on('select', args => console.log('select', args));
input.on('sysex', args => console.log('sysex', args));

const render = {
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

        // Generate SysEx call
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

const ui = {
    colors: {
        volume: 'magenta'
    },
    timeout: 2000,
    renderVolume () {
        // Get current volume and draw as a single bar (half the pads)
        let volumeBars = Math.round(0xF * (audio.get() / 100) / 2);

        // Detect if we're muted
        if (audio.isMuted()) volumeBars = 0;
        
        // Renders
        render.start();
        render.clear();
        render.bar(0x0, volumeBars, ui.colors.volume);
        render.end();

        // Set a clear UI timeout
        if (ui.renderVolume.timeout) clearTimeout(ui.renderVolume.timeout);
        ui.renderVolume.timeout = setTimeout(render.clear, ui.timeout);
    }
}

// Knobs
input.on('cc', (params) => {
    switch (params.controller) {
        // Volume (abs)
        case 72: 
            // Calculates and sets volume
            volume = Math.round(100 * params.value / 127);
            console.log('volume', volume);
            audio.set(volume);

            // Render volume bar
            ui.renderVolume();
            break;
        // Volume (relative)
        case 112:
            // Calculates if we should increase or decrease volume
            let volumeDirection = 0;
            if (params.value > 64) volumeDirection = +1;
            if (params.value < 64) volumeDirection = -1;

            // Gets current volume and changes it
            audio.set(audio.get() + volumeDirection)

            // Render volume bar
            ui.renderVolume();
            break;
        // Mute
        case 113:
            if (params.value == 127) {
                // Toggle mute
                audio.toggle();

                // Render volume bar
                ui.renderVolume();
            }
            break;
        case 22:
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 28:
        case 29:
            // Quick color change thingy
            let colors = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
            let color = colors[params.controller - 22];
            ui.colors.volume = color;

            // Renders volume bar
            ui.renderVolume();
            break;
        default:
            console.log('cc ', params);
    }
})

ui.renderVolume();