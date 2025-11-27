const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3000;
const ADMIRALTY_API_KEY = process.env.ADMIRALTY_API_KEY;

// Curated locations database
const locations = {
  barry: {
    name: 'Barry Island',
    stationId: '0113',
    lat: 51.3888,
    lng: -3.2683
  },
  penarth: {
    name: 'Penarth',
    stationId: '0514',
    lat: 51.4350,
    lng: -3.1681
  }
};

function fetchMarineData(lat, lng) {
  return new Promise((resolve, reject) => {
    const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height,wave_period,swell_wave_height,sea_surface_temperature&timezone=Europe/London`;
    
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
  const rad = Math.PI / 180;
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  
  const declination = -23.45 * Math.cos(rad * (360 / 365) * (dayOfYear + 10));
  
  const hourAngle = Math.acos(
    -Math.tan(lat * rad) * Math.tan(declination * rad)
  ) / rad;
  
  const noon = 12 - lng / 15;
  const sunriseUTC = noon - hourAngle / 15;
  const sunsetUTC = noon + hourAngle / 15;
  
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

async function getConditions(location) {
  const [marine, tides] = await Promise.all([
    fetchMarineData(location.lat, location.lng),
    fetchTideData(location.stationId)
  ]);
  
  const sun = getSunTimes(location.lat, location.lng, new Date());
  
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
  
  return `
=== SHORECAST: ${location.name} ===

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
}

const server = http.createServer(async (req, res) => {
  
  // List all Admiralty stations
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
  
  // List available locations
  if (req.url === '/locations') {
    const available = Object.keys(locations).map(key => ({
      slug: key,
      name: locations[key].name
    }));
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(available, null, 2));
    return;
  }
  
  // Root - show Barry by default
  if (req.url === '/' || req.url === '/conditions') {
    try {
      const output = await getConditions(locations.barry);
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(output);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Error fetching data: ' + error.message);
    }
    return;
  }
  
  // Specific location: /conditions/penarth
  const match = req.url.match(/^\/conditions\/(\w+)$/);
  if (match) {
    const slug = match[1].toLowerCase();
    const location = locations[slug];
    
    if (location) {
      try {
        const output = await getConditions(location);
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(output);
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Error fetching data: ' + error.message);
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Location "${slug}" not found.\n\nAvailable locations: ${Object.keys(locations).join(', ')}`);
    }
    return;
  }
  
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Shorecast server running on port ${PORT}`);
});
