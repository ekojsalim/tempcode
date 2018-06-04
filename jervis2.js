const five = require('johnny-five');
const express = require('express');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static(`${__dirname}/public`));
app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/jarvis.html`);
});

const board = new five.Board({
  // bluetooth port
  // port: '/dev/rfcomm0',
});

board.on('ready', () => {
  // Initialize the LDRs
  const sensorLDR1 = new five.Sensor({
    pin: 'A0',
    freq: 700,
    threshold: 300,
    enabled: true,
  });

  const sensorLDR2 = new five.Sensor({
    pin: 'A1',
    freq: 700,
    threshold: 70,
    enabled: true,
  });

  const sensorLDR3 = new five.Sensor({
    pin: 'A2',
    freq: 700,
    threshold: 500,
  });

  const sensorLDR4 = new five.Sensor({
    pin: 'A3',
    freq: 700,
    threshold: 500,
  });

  const sensorLDR5 = new five.Sensor({
    pin: 'A4',
    freq: 700,
    threshold: 500,
  });

  const sensorLDR6 = new five.Sensor({
    pin: 'A5',
    freq: 700,
    threshold: 500,
  });

  // , sensorLDR3, sensorLDR4, sensorLDR5, sensorLDR6
  const sensorLDRs = new five.Sensors([sensorLDR1, sensorLDR2]);

  // create Store for the foods
  // so, it is not client sided

  const store = {
    ketoprak: {
      name: 'Ketoprak',
      qty: -1,
      price: 5000,
    },
    gado: {
      name: 'Gado-Gado',
      qty: -1,
      price: 10000,
    },
    ayam: {
      name: 'Ayam Goreng',
      qty: -1,
      price: 12000,
    },
    bebek: {
      name: 'Bebek Goreng',
      qty: -1,
      price: 15000,
    },
    tahu: {
      name: 'Tahu',
      qty: -1,
      price: 3000,
    },
    teh: {
      name: 'Es Teh Manis',
      qty: -1,
      price: 4000,
    },
  };

  function sendData() {
    io.emit('data', store);
  }

  // create a Map to associate each ldrs with a specific value
  const ldrMap = new Map([[sensorLDR1, store.ketoprak],
    [sensorLDR2, store.gado],
    [sensorLDR3, store.ayam],
    [sensorLDR4, store.bebek],
    [sensorLDR5, store.tahu],
    [sensorLDR6, store.teh]]);

  // Dealing with the scope here is a mess

  function getHandler(instance) {
    let z =  function() {
      const ldrVal = ldrMap.get(instance);
      console.log(`${ldrVal.name}'s LDR has been triggered`);
      // increment the store
      ldrVal.qty += 1;
      // send the store
      sendData();
      // disable the listener for 4 seconds
      // and enable it right back
      instance.removeListener('change', z);
      setTimeout(() => {
        instance.on('change', z);
      }, 4000);
    };
    return z;
  }

  function changeHandler(instance) {
    const ldrVal = ldrMap.get(instance);
    console.log(instance.value);
    console.log(`${ldrVal.name}'s LDR has been triggered`);
    // increment the store
    ldrVal.qty += 1;
    // send the store
    sendData();
    // disable the listener for 4 seconds
    // and enable it right back
    instance.removeAllListeners('change', changeHandler);
    setTimeout(() => {
      instance.on('change', getHandler(instance));
    }, 4000);
  };

  sensorLDRs.on('change', changeHandler);

  // If the LDR detected a significant change(laser on/off)
  // sensorLDRs.forEach((a) => {
  //   // console.log(a);
  //   a.on('change', changeHandler(a));
  // });

  // sensorLDR2.on('change', () => {
  //   console.log(sensorLDR2.value);
  //   const ldrVal = ldrMap.get(sensorLDR2);
  //   console.log(`${ldrVal.name}'s LDR has been triggered`);
  //   // increment the store
  //   ldrVal.qty += 1;
  //   // send the store
  //   sendData();
  //   // disable the listener for 4 seconds
  //   // and enable it right back
  //   sensorLDR2.disable();
  //   setTimeout(() => {
  //     sensorLDR2.enable({
  //       freq: 700,
  //       threshold: 500,
  //     });
  //   }, 4000);
  // });

  // sensorLDR1.on('change', () => {
  //   console.log(sensorLDR1.value);
  //   const ldrVal = ldrMap.get(sensorLDR1);
  //   console.log(`${ldrVal.name}'s LDR has been triggered`);
  //   // increment the store
  //   ldrVal.qty += 1;
  //   // send the store
  //   sendData();
  //   // disable the listener for 4 seconds
  //   // and enable it right back
  //   sensorLDR1.disable();
  //   setTimeout(() => {
  //     sensorLDR1.enable({
  //       freq: 700,
  //       threshold: 500,
  //     });
  //   }, 4000);
  // });

  io.on('connection', (client) => {
    client.on('join', handshake => console.log(handshake));
    sendData();
  });
  // send initial store
  sendData();

  board.repl.inject({
    sensorLDR2,
    sensorLDR1,
  });
});

const port = process.env.PORT || 3000;

server.listen(port);
console.log(`LASOR Server listening on http://localhost:${port}`);
