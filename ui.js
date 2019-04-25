const terminal = require('./terminal');
const render = require('./render');
const audio = require('win-audio').speaker;

const ui = module.exports = {
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

        // Logs
        terminal.status(`Volume currently at ${ audio.get() }%, ${ (audio.isMuted() ? 'muted' : 'not muted') }`.green);

        // Set a clear UI timeout
        if (ui.renderVolume.timeout) clearTimeout(ui.renderVolume.timeout);
        ui.renderVolume.timeout = setTimeout(render.clear, ui.timeout);
    }
}