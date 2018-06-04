  var socket = io.connect(window.location.hostname + ':' + 3000);
  var lat = document.getElementById('lat');
  var long = document.getElementById('long');
  var alt = document.getElementById('alt');
  var heading = document.getElementById('heading');
  var bearing = document.getElementById('bearing');
  var pressure = document.getElementById('pressure');
  var detect = document.getElementById('detected');
  let locationA = {lat: 0, lng: 0};
  let map, marker;

  socket.on('connect', function(data) {
      socket.emit('join', 'Client is connected!');
  });

  socket.on('data', function(data) {
      var type = data.type;
      lat.innerHTML = `Latitude: ${data.lat}`;
      long.innerHTML = `Longitude: ${data.long}`;
      alt.innerHTML = `Altitude: ${data.alt}m`;
      heading.innerHTML = `Heading: ${data.heading}`;
      bearing.innerHTML = `Bearing: ${data.bearing}`;
      pressure.innerHTML = `Pressure: ${data.pressure}kPa`
      if(data.detected) {
        locationA.lat = Number(data.pos[0]);
        locationA.lng = Number(data.pos[1]);
        detect.innerHTML = `Laser Detected! Attacker Position is at (${data.pos[0]}, ${data.pos[1]})`;
        console.log("laser detected!");
        map.setCenter(locationA);
        map.setZoom(19);
        marker.setPosition(locationA);
        detect.style.display = '';
        setTimeout(function() {
          detect.style.display = 'none';
        }, 3000);
      }
  });

  function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 4,
      center: locationA
    });
    marker = new google.maps.Marker({
      position: locationA,
      map: map
    });
  }