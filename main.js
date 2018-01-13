const five = require('johnny-five');

const board = new five.Board({
    //bluetooth port
    port: '/dev/rfcomm0',
});

board.on('ready'. function() {

    const led = new five.Led(13);

    this.repl.inject({
        led,
    });
});