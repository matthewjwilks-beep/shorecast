const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Locations: slug -> { name, stationId, lat, lon }
const locations = {
  // South Wales
  barry: { 
    name: "Barry Island", 
    stationId: "0113", 
    lat: 51.39, 
    lon: -3.26 
  },
  penarth: { 
    name: "Penarth", 
    stationId: "0514", 
    lat: 51.43, 
    lon: -3.17 
  },
  porthcawl: { 
    name: "Porthcawl", 
    stationId: "0512", 
    lat: 51.48, 
    lon: -3.70 
  },
  mumbles: { 
    name: "Mumbles", 
    stationId: "0508", 
    lat: 51.57, 
    lon: -3.98 
  },
  tenby: { 
    name: "Tenby", 
    stationId: "0502", 
    lat: 51.67, 
    lon: -4.70 
  },
  
  // Southwest England
  sennen: { 
    name: "Sennen Cove", 
    stationId: "0002", 
    lat: 50.07, 
    lon: -5.70 
  },
  falmouth: { 
    name: "Falmouth", 
    stationId: "0005", 
    lat: 50.15, 
    lon: -5.05 
  },
  looe: { 
    name: "Looe", 
    stationId: "0011", 
    lat: 50.35, 
    lon: -4.45 
  },
  salcombe: { 
    name: "Salcombe", 
    stationId: "0020", 
    lat: 50.22, 
    lon: -3.78 
  },
  torquay: { 
    name: "Torquay", 
    stationId: "0025", 
    lat: 50.47, 
    lon: -3.53 
  },
  exmouth: { 
    name: "Exmouth", 
    stationId: "0027", 
    lat: 50.62, 
    lon: -3.42 
  },
  lymeregis: { 
    name: "Lyme Regis", 
    stationId: "0028", 
    lat: 50.72, 
    lon: -2.93 
  },
  lulworth: { 
    name: "Lulworth Cove", 
    stationId: "0034", 
    lat: 50.62, 
    lon: -2.25 
  },
  swanage: { 
    name: "Swanage", 
    stationId: "0035", 
    lat: 50.61, 
    lon: -1.95 
  },
  bournemouth: { 
    name: "Bournemouth", 
    stationId: "0037", 
    lat: 50.72, 
    lon: -1.87 
  },
  brighton: { 
    name: "Brighton", 
    stationId: "0082", 
    lat: 50.82, 
    lon: -0.10 
  }
};

// Calculate sunrise and sunset times
function getSunTimes(lat, lon, date = new Date()) {
  const rad = Math.PI / 180;
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  
  // Solar declination
  const declination = -23.45 * Math.cos(rad * (360 / 365) * (dayOfYear + 10));
  
  // Hour angle
  const cosHourAngle = -Math.tan(lat * rad) * Math.tan(declination * rad);
  const hourAngle = Math.acos(Math.max(-1, Math.min(1, cosHourAngle))) / rad;
  
  // Solar noon (approximate, ignoring equation of time for simplicity)
  const solarNoon = 12 - (lon / 15);
  
  const sunrise = solarNoon - (hourAngle / 15);
  const sunset = solarNoon + (hourAngle / 15);
  
  const formatTime = (decimalHours) => {
    const h = Math.floor(decimalHours);
    const m = Math.round((decimalHours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };
  
  return {
    sunrise: formatTime(sunrise),
    sunset: formatTime(sunset)
  };
}

// Fetch tide data from Admiralty API
async function fetchTideData(stationId) {
  const apiKey = process.env.ADMIRALTY_API_KEY;
  if (!apiKey) {
    throw new Error('ADMIRALTY_API_KEY not set');
  }
  
  const url = `https://admiraltyapi.azure-api.net/uktidalapi/api/V1/Stations/${stationId}/TidalEvents`;
  
  const response = await fetch(url, {
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey
    }
  });
  
  if (!response.ok) {
    throw new Error(`Admiralty API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Find next high and low tides
  const now = new Date();
  const upcomingEvents = data.filter(event => new Date(event.DateTime) > now);
  
  const nextHigh = upcomingEvents.find(e => e.EventType === 'HighWater');
  const nextLow = upcomingEvents.find(e => e.EventType === 'LowWater');
  
  const formatTideTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  };
  
  return {
    nextHighTide: nextHigh ? {
      time: formatTideTime(nextHigh.DateTime),
      height: nextHigh.Height ? `${nextHigh.Height.toFixed(1)}m` : null
    } : null,
    nextLowTide: nextLow ? {
      time: formatTideTime(nextLow.DateTime),
      height: nextLow.Height ? `${nextLow.Height.toFixed(1)}m` : null
    } : null
  };
}

// Fetch marine data from Open-Meteo
async function fetchMarineData(lat, lon) {
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,wave_period,swell_wave_height,sea_surface_temperature&timezone=Europe/London`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status}`);
  }
  
  const data = await response.json();
  const current = data.current;
  
  return {
    seaTemp: current.sea_surface_temperature ? `${Math.round(current.sea_surface_temperature)}°C` : null,
    waveHeight: current.wave_height ? `${current.wave_height.toFixed(1)}m` : null,
    wavePeriod: current.wave_period ? `${Math.round(current.wave_period)}s` : null,
    swellHeight: current.swell_wave_height ? `${current.swell_wave_height.toFixed(1)}m` : null
  };
}

// Get full conditions for a location
async function getConditions(locationSlug) {
  const location = locations[locationSlug];
  if (!location) {
    return null;
  }
  
  const [tideData, marineData] = await Promise.all([
    fetchTideData(location.stationId).catch(err => {
      console.error('Tide fetch error:', err.message);
      return { nextHighTide: null, nextLowTide: null };
    }),
    fetchMarineData(location.lat, location.lon).catch(err => {
      console.error('Marine fetch error:', err.message);
      return { seaTemp: null, waveHeight: null, wavePeriod: null, swellHeight: null };
    })
  ]);
  
  const sunTimes = getSunTimes(location.lat, location.lon);
  
  return {
    location: location.name,
    timestamp: new Date().toISOString(),
    sunrise: sunTimes.sunrise,
    sunset: sunTimes.sunset,
    ...tideData,
    ...marineData
  };
}

// Routes
app.get('/', async (req, res) => {
  try {
    const conditions = await getConditions('barry');
    res.json(conditions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/conditions', async (req, res) => {
  try {
    const conditions = await getConditions('barry');
    res.json(conditions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/conditions/:location', async (req, res) => {
  const slug = req.params.location.toLowerCase();
  
  if (!locations[slug]) {
    return res.status(404).json({ 
      error: 'Location not found',
      available: Object.keys(locations)
    });
  }
  
  try {
    const conditions = await getConditions(slug);
    res.json(conditions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/locations', (req, res) => {
  const list = Object.entries(locations).map(([slug, data]) => ({
    slug,
    name: data.name
  }));
  res.json(list);
});

app.get('/stations', async (req, res) => {
  const apiKey = process.env.ADMIRALTY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ADMIRALTY_API_KEY not set' });
  }
  
  try {
    const url = 'https://admiraltyapi.azure-api.net/uktidalapi/api/V1/Stations';
    const response = await fetch(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`Admiralty API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Shorecast running on port ${PORT}`);
});
