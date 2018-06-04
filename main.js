const five = require('johnny-five');
const express = require('express');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const geo = require('geographiclib');
let geod = geo.Geodesic.WGS84;

//LDR angles
let ldrAnglesAlpha = [[0,0,0],
                      [0,0,0],
                      [0,0,0]];
let ldrAnglesBeta =  [[-3.69,0,0],
                      [0,0,0],
                      [0,0,0]];
let ldrs;

app.use(express.static(`${__dirname}/public`));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
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
    freq: 200,
  });

  const sensorLDR2 = new five.Sensor({
    pin: 'A1',
    freq: 200,
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

  const sensorLDR7 = new five.Sensor({
    pin: 'A6',
    freq: 200,
  });

  const sensorLDR8 = new five.Sensor({
    pin: 'A7',
    freq: 200,
  });

  const sensorLDR9 = new five.Sensor({
    pin: 'A8',
    freq: 200,
  });

  ldrs = [[sensorLDR1, sensorLDR2, sensorLDR3],
              [sensorLDR4, sensorLDR5, sensorLDR6],
              [sensorLDR7, sensorLDR8, sensorLDR9]];

  const data = {
    lat: 0,
    long: 0,
    alt: 0,
    heading: 0,
    bearing: 0,
    pressure: 0,
    detected: false,
    pos: []
  };

  function sendData() {
    io.emit('data', data);
  }

  const led = new five.Led(13);
  const compass = new five.Compass({
    controller: 'HMC5883L',
    address: 0x1E,
    freq: 2000,
  });
  const gps = new five.GPS({
    port: this.io.SERIAL_PORT_IDs.HW_SERIAL3,
    baud: 9600,
  });
  const barometer = new five.Barometer({
    controller: 'BMP280',
    address: 0x76,
    freq: 2000,
  });

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
    if (this.raw > 20) {
      console.log(this.raw);
      data.detected = true;
      data.pos = calculateAttacker(sensorLDR1, data);
    }
    if (this.raw < 20) data.detected = false;
    sendData();
  });

  io.on('connection', (client) => {
    client.on('join', handshake => console.log(handshake));
  });
  
  compass.on('change', function() {
    console.log('Compass');
    console.log('  heading : ', Math.floor(this.heading));
    console.log('  bearing : ', this.bearing.abbr);
    console.log('--------------------------------------');
    data.heading = this.heading;
    data.bearing = this.bearing.abbr;
    sendData();
  });

  barometer.on('data', function () {
    console.log('Barometer');
    console.log('  pressure     : ', this.pressure);
    console.log('--------------------------------------');
    data.pressure = this.pressure;
    data.alt = getHeight(101.325,this.pressure,27);
    sendData();
  });

  gps.on('change', function () {
    console.log('Position');
    console.log('  latitude   : ', this.latitude);
    console.log('  longitude  : ', this.longitude);
    // console.log('  altitude   : ', this.altitude);
    console.log('--------------------------------------');
    data.lat = this.latitude;
    data.long = this.longitude;
    // data.alt = this.altitude;
    sendData();
  });

  this.repl.inject({
    led,
  });

  sendData();
});

function getHeight(pressureOriginal, pressure, temp) {
  //using the hypsometric formula
  return ((Math.pow((pressureOriginal/pressure),(1/5.257))-1)*(temp+273.15))/0.0065;
}

// we need to get the alpha or the incident angle in which
// the laser hit the LDR
// for now we will hardcode it
function getAlpha(ldrID) {
  let ldrIndex = getIndexOfK(ldrs, ldrID);
  return ldrAnglesAlpha[ldrIndex[0]][ldrIndex[1]];
}

function getBeta(ldrID) {
  let ldrIndex = getIndexOfK(ldrs, ldrID);
  return ldrAnglesBeta[ldrIndex[0]][ldrIndex[1]];  
}

function getGamma(alpha, bearing) {
  let gamma;
  if(bearing <= 90) {
    gamma = bearing + alpha;
  }
  else if(bearing <= 180) {
    gamma = 180 - (bearing + alpha);
  }
  else if(bearing <= 270) {
    gamma = (bearing + alpha) - 180;
  }
  else if(bearing <= 360) {
    gamma = 360 - (bearing + alpha);
  }
  return gamma;
}

function calculatePosition(ldrID, data) {
  let {heading, alt, lat, long} = data;
  // described in the text
  let alpha = getAlpha(ldrID);
  let beta = getBeta(ldrID);
  let gamma = getGamma(alpha, heading);
  console.log(alpha,beta,gamma, heading);
  //calculate horizontal distance d
  let d = alt/(Math.tan(beta));
  //calculate x and y of attacker relative to north
  let x = d*Math.sin(gamma);
  let y = d*Math.cos(gamma);
  console.log(d,x,y);
  //calculate delta lat and long
  let deltaLatitude = y/110567;
  let deltaLongitude = x/111321;
  // calc actual lat and long of attacker
  let pos = [lat + deltaLatitude, long + deltaLongitude];
  return pos;
}

function calculateAttacker(ldrID, data) {
  const R = 6371;

  let {heading, alt, lat, long} = data;
  let alpha = getAlpha(ldrID);
  let beta = getBeta(ldrID) *(Math.PI/180);
  let gamma = getGamma(alpha, heading) *(Math.PI/180);

  //calculate d
  let euclideanDistance = alt/Math.tan(beta);
  let dist = 2*R*Math.asin(euclideanDistance/(2*R))/1000;

  // from http://www.movable-type.co.uk/scripts/latlong.html
  // φ2 = asin( sin φ1 ⋅ cos δ + cos φ1 ⋅ sin δ ⋅ cos θ )
  // λ2 = λ1 + atan2( sin θ ⋅ sin δ ⋅ cos φ1, cos δ − sin φ1 ⋅ sin φ2 )
  // let lat2 = Math.asin( Math.sin(lat)*Math.cos(dist/R) +
  // Math.cos(lat)*Math.sin(dist/R)*Math.cos(gamma) );
  // let lon2 = long + Math.atan2(Math.sin(gamma)*Math.sin(dist/R)*Math.cos(lat),
  //      Math.cos(dist/R)-Math.sin(lat)*Math.sin(lat2));
  
  //just use the geod library
  let r = geod.Direct(lat, long,heading, dist);
  console.log(euclideanDistance,dist, r);
  return [r.lat2.toFixed(8), r.lon2.toFixed(8)];
}


const port = process.env.PORT || 3000;

server.listen(port);
console.log(`LASOR Server listening on http://localhost:${port}`);
