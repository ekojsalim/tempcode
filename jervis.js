const five = require('johnny-five');
const express = require('express');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static(`${__dirname}/public`));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/jarvis.html');
});

const board = new five.Board({
  // bluetooth port
  // port: '/dev/rfcomm0',
});

function flatten(arr) {
  return arr.reduce(function (flat, toFlatten) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
  }, []);
}

function getIndexOfK(arr, k) {
  for (let i = 0; i < arr.length; i++) {
    let index = arr[i].indexOf(k);
    if (index > -1) {
      return [i, index];
    }
  }
}

board.on('ready', function () {

  const sensorLDR1 = new five.Sensor({
    pin: 'A0',
    freq: 700,
  });

  const sensorLDR2 = new five.Sensor({
    pin: 'A1',
    freq: 700,
  });

  const sensorLDR3 = new five.Sensor({
    pin: 'A2',
    freq: 200,
  });

  const sensorLDR4 = new five.Sensor({
    pin: 'A3',
    freq: 200,
  });

  const sensorLDR5 = new five.Sensor({
    pin: 'A4',
    freq: 200,
  });

  const sensorLDR6 = new five.Sensor({
    pin: 'A5',
    freq: 200,
  });

  let data = {
    lasers: {
      one: true,
      two: true
    },
    pastp3: [true, true, true],
    pastq3: [true, true, true]
  };

  ldrs = [[sensorLDR1, sensorLDR2, sensorLDR3],
              [sensorLDR4, sensorLDR5, sensorLDR6]];

  let datasend = {
    l1: false,
    l2: false,
  };

function ref() {
  datasend.l1 = false;
  datasend.l2 = false;
  let p = data.pastp3.join("");
  let q = data.pastq3.join("");
  if(p.search("truefalsetrue") !== -1) {
    console.log("pattern 1 detected");
    datasend.l1 = true;
    sendData();
    sensorLDR1.disable();
    setTimeout(function() {
      sensorLDR1.enable({
        freq: 700
      });
    }, 4000);
  }
  if(q.search("truefalsetrue") !== -1) {
    console.log("pattern 2 detected");
    datasend.l2 = true; 
    sendData();
    sensorLDR2.disable();
    setTimeout(function() {
      sensorLDR2.enable({
        freq: 700
      });
    }, 4000);
  }
}

  function sendData() {
    io.emit('data', datasend);
  } 

  const led = new five.Led(13);

  // flatten(ldrs).forEach(function(a) {
  //   a.on('data', function() {
  //     if (this.raw > 20) {
  //       console.log(this.raw);
  //       data.detected = true;
  //       data.pos = calculatePosition(a, data);
  //     }
  //     if (this.raw < 20) data.detected = false;
  //     sendData();
  //   });
  // });

  sensorLDR1.on('data', function() {
    // console.log(this.raw);
    if (this.raw < 300) {
      // console.log(this.raw);
      // console.log("Laser 1 on");
      // console.log("Term 1 laser is on!");
      data.lasers.one = true;
      data.pastp3.shift();
      data.pastp3.push(true);
    }
    if (this.raw > 300) {
      // console.log(this.raw);
      // console.log("laser 1 off");
      // console.log("Term 1 laser is off!");
      data.lasers.one = false;
      data.pastp3.shift();
      data.pastp3.push(false);
      ref();
    }
  });

  sensorLDR2.on('data', function() {
    console.log(this.raw);
    if (this.raw > 750) {
      // console.log(this.raw);
      // console.log("Laser 1 on");
      console.log("Term 2 laser is on!");
      data.lasers.one = true;
      data.pastq3.shift();
      data.pastq3.push(true);
    }
    if (this.raw < 750) {
      // console.log(this.raw);
      // console.log("laser 1 off");
      console.log("Term 2 laser is off!");
      data.lasers.one = false;
      data.pastq3.shift();
      data.pastq3.push(false);
      ref();
    }
  });

  // sensorLDR2.on('data', function() {
  //   // console.log(this.raw);
  //   if (this.raw < 300) {
  //     console.log(this.raw);
  //     console.log("Laser 2 on");
  //   }
  //   if (this.raw > 300) {
  //     console.log(this.raw);
  //     console.log("laser 2 off");
  //   }
  // });

  io.on('connection', (client) => {
    client.on('join', handshake => console.log(handshake));
  });
  this.repl.inject({
    led,
  });

  sendData();
});


const port = process.env.PORT || 3000;

server.listen(port);
console.log(`LASOR Server listening on http://localhost:${port}`);
