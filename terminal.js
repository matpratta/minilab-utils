const terminal = module.exports = {
    debug: (...args) => terminal.render('gray', ...args),
    info: (...args) => terminal.render('blue', ...args),
    status: (...args) => terminal.render('green', ...args),
    warn: (...args) => terminal.render('yellow', ...args),
    error: (...args) => terminal.render('red', ...args),
    cheer: (...args) => terminal.render('magenta', ...args),
    render (color, ...args) {
        args = args.map(x => {
            switch (typeof x) {
                case 'string': break;
                case 'object': x = JSON.stringify(x); break;
                default: x = x.toString(); break;
            }
            return x[color];
            return JSON.stringify(x)[color];
        });
        console.log(...args);
    }
}