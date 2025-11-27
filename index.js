const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3000;
const ADMIRALTY_API_KEY = process.env.ADMIRALTY_API_KEY;

// Barry Island coordinates
const latitude = 51.3888;
const longitude = -3.2683;

function fetchMarineData() {
  return new Promise((resolve, reject) => {
    const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}&current=wave_height,wave_period,swell_wave_height,sea_surface_temperature&timezone=Europe/London`;
    
    https.get(url, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function fetchTideData(stationId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'admiraltyapi.azure-api.net',
      path: `/uktidalapi/api/V1/Stations/${stationId}/TidalEvents`,
      headers: {
        'Ocp-Apim-Subscription-Key': ADMIRALTY_API_KEY
      }
    };
    
    https.get(options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse tide data: ' + data));
        }
      });
    }).on('error', reject);
  });
}

function fetchStations() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'admiraltyapi.azure-api.net',
      path: '/uktidalapi/api/V1/Stations',
      headers: {
        'Ocp-Apim-Subscription-Key': ADMIRALTY_API_KEY
      }
    };
    
    https.get(options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse stations: ' + data));
        }
      });
    }).on('error', reject);
  });
}

function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Europe/London'
  });
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { 
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/London'
  });
}

function getSunTimes(lat, lng, date) {
  // Calculate sunrise and sunset times
  const rad = Math.PI / 180;
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  
  // Solar declination
  const declination = -23.45 * Math.cos(rad * (360 / 365) * (dayOfYear + 10));
  
  // Hour angle
  const hourAngle = Math.acos(
    -Math.tan(lat * rad) * Math.tan(declination * rad)
  ) / rad;
  
  // Sunrise and sunset in hours (UTC)
  const noon = 12 - lng / 15;
  const sunriseUTC = noon - hourAngle / 15;
  const sunsetUTC = noon + hourAngle / 15;
  
  // Adjust for UK time (GMT/BST)
  const isBST = date.getMonth() > 2 && date.getMonth() < 10;
  const offset = isBST ? 1 : 0;
  
  const formatHour = (h) => {
    h = h + offset;
    const hours = Math.floor(h);
    const mins = Math.round((h - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };
  
  return {
    sunrise: formatHour(sunriseUTC),
    sunset: formatHour(sunsetUTC)
  };
}

const server = http.createServer(async (req, res) => {
  
  // List all stations
  if (req.url === '/stations') {
    try {
      const stations = await fetchStations();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(stations, null, 2));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Error fetching stations: ' + error.message);
    }
    return;
  }
  
  // Main conditions page
  if (req.url === '/' || req.url === '/conditions') {
    try {
      // Barry Island station ID
      const stationId = '0113';
      
      const [marine, tides] = await Promise.all([
        fetchMarineData(),
        fetchTideData(stationId)
      ]);
      
      // Get sun times
      const sun = getSunTimes(latitude, longitude, new Date());
      
      // Get next few tidal events
      const now = new Date();
      const upcomingTides = tides
        .filter(t => new Date(t.DateTime) > now)
        .slice(0, 4);
      
      let tideText = '';
      upcomingTides.forEach(tide => {
        const type = tide.EventType === 'HighWater' ? 'High' : 'Low';
        const time = formatTime(tide.DateTime);
        const date = formatDate(tide.DateTime);
        const height = tide.Height ? tide.Height.toFixed(1) + 'm' : '';
        tideText += `  ${type} tide: ${time} (${date}) ${height}\n`;
      });
      
      const output = `
=== SHORECAST: Barry Island ===

SUN
  Sunrise: ${sun.sunrise}
  Sunset: ${sun.sunset}

TIDES
${tideText}
MARINE CONDITIONS
  Sea temperature: ${marine.current.sea_surface_temperature}°C
  Wave height: ${marine.current.wave_height}m
  Wave period: ${marine.current.wave_period}s
  Swell height: ${marine.current.swell_wave_height}m

Shorecast is alive!
      `;
      
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(output);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Error fetching data: ' + error.message);
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Shorecast server running on port ${PORT}`);
});
