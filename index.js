const easymidi = require('easymidi');
const audio = require('win-audio').speaker;
const colors = require('colors');

const terminal = require('./terminal');
const render = require('./render');
const ui = require('./ui');

var controller = 'Arturia MiniLab mkII';

var inputs = easymidi.getInputs();
var outputs = easymidi.getOutputs();

terminal.info('Inputs found:', inputs);
terminal.info('Outputs found:', outputs);

terminal.status('Looking for proper input/output...');
for (i = 0, input = null; input = inputs[i++];) {
    if (~input.indexOf(controller)) {
        terminal.cheer(`Found matching input "${input}" at index ${i - 1}.`);
        global.input = new easymidi.Input(input);
        break;
    }
}
for (i = 0, output = null; output = outputs[i++];) {
    if (~output.indexOf(controller)) {
        terminal.cheer(`Found matching output "${output}" at index ${i - 1}.`);
        global.output = new easymidi.Output(output);
        break;
    }
}

if (!global.input || !global.output) {
    terminal.error(`No controller matching "${controller}" was found. Quitting...`);
    process.exit();
    return;
}

input.on('noteon', args => terminal.debug('noteon', args));
input.on('poly aftertouch', args => terminal.debug('poly aftertouch', args));
input.on('cc', args => terminal.debug('cc', args));
input.on('program', args => terminal.debug('program', args));
input.on('channel aftertouch', args => terminal.debug('channel aftertouch', args));
input.on('pitch', args => terminal.debug('pitch', args));
input.on('position', args => terminal.debug('position', args));
input.on('mtc', args => terminal.debug('mtc', args));
input.on('select', args => terminal.debug('select', args));
input.on('sysex', args => terminal.debug('sysex', args));

// Knobs
input.on('cc', (params) => {
    switch (params.controller) {
        // Volume (abs)
        case 72: 
            // Calculates and sets volume
            volume = Math.round(100 * params.value / 127);
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

            // Logs
            terminal.status(`Color changed to "${color}".`);

            // Renders volume bar
            ui.renderVolume();
            break;
        default:
            console.log('cc ', params);
    }
})

ui.renderVolume();