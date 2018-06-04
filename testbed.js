const five = require('johnny-five');

const board = new five.Board();

board.on('ready', function() {
  let barometer = new five.Barometer({
    controller: "BMP180",
  });

  // const compass = new five.Compass({
  //   controller: 'HMC5883L',
  //   address: 0x1E,
  //   freq: 1000,
  // });

  barometer.on("data", function() {
    console.log("Barometer");
    console.log("  pressure     : ", this.pressure);
    console.log("--------------------------------------");
  });

  // compass.on('change', function () {
  //   console.log('Compass');
  //   console.log('  heading : ', Math.floor(this.heading));
  //   console.log('  bearing : ', this.bearing.abbr);
  //   console.log('--------------------------------------');
  // });
  
});
