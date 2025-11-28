const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Locations: slug -> { name, stationId, lat, lon }
const locations = {
  // South Wales
  barry: { name: "Barry Island", stationId: "0513", lat: 51.39, lon: -3.26 },
  penarth: { name: "Penarth", stationId: "0514", lat: 51.43, lon: -3.17 },
  porthcawl: { name: "Porthcawl", stationId: "0512", lat: 51.48, lon: -3.70 },
  restbay: { name: "Rest Bay", stationId: "0512", lat: 51.49, lon: -3.72 },
  ogmore: { name: "Ogmore-by-Sea", stationId: "0512", lat: 51.46, lon: -3.64 },
  southerndown: { name: "Southerndown", stationId: "0512", lat: 51.45, lon: -3.60 },
  
  // Gower
  mumbles: { name: "Mumbles", stationId: "0508", lat: 51.57, lon: -3.98 },
  langland: { name: "Langland Bay", stationId: "0508", lat: 51.57, lon: -3.98 },
  caswell: { name: "Caswell Bay", stationId: "0508", lat: 51.57, lon: -3.97 },
  rhossili: { name: "Rhossili", stationId: "0508", lat: 51.57, lon: -4.29 },
  
  // Pembrokeshire
  tenby: { name: "Tenby", stationId: "0502", lat: 51.67, lon: -4.70 },
  saundersfoot: { name: "Saundersfoot", stationId: "0502", lat: 51.71, lon: -4.69 },
  barafundle: { name: "Barafundle Bay", stationId: "0501", lat: 51.62, lon: -4.90 },
  freshwaterwest: { name: "Freshwater West", stationId: "0501", lat: 51.64, lon: -5.06 },
  broadhaven: { name: "Broad Haven", stationId: "0492B", lat: 51.78, lon: -5.11 },
  marloes: { name: "Marloes Sands", stationId: "0495", lat: 51.73, lon: -5.21 },
  whitesands: { name: "Whitesands Bay", stationId: "0492", lat: 51.88, lon: -5.30 },
  newportsands: { name: "Newport Sands", stationId: "0490", lat: 52.02, lon: -4.88 },
  poppit: { name: "Poppit Sands", stationId: "0489", lat: 52.12, lon: -4.68 },
  
  // Mid Wales Coast
  aberporth: { name: "Aberporth", stationId: "0488A", lat: 52.13, lon: -4.55 },
  newquay: { name: "New Quay", stationId: "0488", lat: 52.22, lon: -4.35 },
  aberystwyth: { name: "Aberystwyth", stationId: "0487", lat: 52.42, lon: -4.08 },
  aberdovey: { name: "Aberdovey", stationId: "0486", lat: 52.54, lon: -4.05 },
  barmouth: { name: "Barmouth", stationId: "0485", lat: 52.72, lon: -4.05 },
  
  // Llŷn Peninsula
  criccieth: { name: "Criccieth", stationId: "0483A", lat: 52.92, lon: -4.23 },
  pwllheli: { name: "Pwllheli", stationId: "0483", lat: 52.89, lon: -4.40 },
  abersoch: { name: "Abersoch", stationId: "0482B", lat: 52.82, lon: -4.50 },
  aberdaron: { name: "Aberdaron", stationId: "0482A", lat: 52.80, lon: -4.72 },
  porthdinllaen: { name: "Porth Dinllaen", stationId: "0481", lat: 52.94, lon: -4.56 },
  
  // Anglesey
  trearddur: { name: "Trearddur Bay", stationId: "0479", lat: 53.27, lon: -4.62 },
  rhosneigr: { name: "Rhosneigr", stationId: "0479A", lat: 53.23, lon: -4.51 },
  llanddwyn: { name: "Llanddwyn", stationId: "0480", lat: 53.13, lon: -4.41 },
  benllech: { name: "Benllech", stationId: "0476A", lat: 53.32, lon: -4.22 },
  cemaes: { name: "Cemaes Bay", stationId: "0477A", lat: 53.41, lon: -4.44 },
  beaumaris: { name: "Beaumaris", stationId: "0472", lat: 53.26, lon: -4.09 },
  
  // North Wales Coast
  llandudno: { name: "Llandudno", stationId: "0471", lat: 53.32, lon: -3.83 },
  colwynbay: { name: "Colwyn Bay", stationId: "0470", lat: 53.29, lon: -3.72 },
  
  // Southwest England
  sennen: { name: "Sennen Cove", stationId: "0002", lat: 50.07, lon: -5.70 },
  falmouth: { name: "Falmouth", stationId: "0005", lat: 50.15, lon: -5.05 },
  looe: { name: "Looe", stationId: "0011", lat: 50.35, lon: -4.45 },
  salcombe: { name: "Salcombe", stationId: "0020", lat: 50.22, lon: -3.78 },
  torquay: { name: "Torquay", stationId: "0025", lat: 50.47, lon: -3.53 },
  exmouth: { name: "Exmouth", stationId: "0027", lat: 50.62, lon: -3.42 },
  lymeregis: { name: "Lyme Regis", stationId: "0028", lat: 50.72, lon: -2.93 },
  lulworth: { name: "Lulworth Cove", stationId: "0034", lat: 50.62, lon: -2.25 },
  swanage: { name: "Swanage", stationId: "0035", lat: 50.61, lon: -1.95 },
  bournemouth: { name: "Bournemouth", stationId: "0037", lat: 50.72, lon: -1.87 },
  brighton: { name: "Brighton", stationId: "0082", lat: 50.82, lon: -0.10 }
};

// =============================================================================
// SEWAGE ALERTS - Welsh Water API
// =============================================================================

const WELSH_WATER_ENDPOINT = 'https://services3.arcgis.com/KLNF7YxtENPLYVey/arcgis/rest/services/Spill_Prod__view/FeatureServer/0/query';

// Map Shorecast beach names to Welsh Water Linked_Bathing_Water values
const BEACH_TO_WELSH_WATER = {
  "Rhossili": "Rhossili",
  "Langland Bay": "Langland Bay",
  "Caswell Bay": "Caswell Bay",
  "Barafundle Bay": "Barafundle",
  "Tenby": "Tenby North",
  "Saundersfoot": "Saundersfoot",
  "Aberdovey": "Aberdyfi",
  "Barmouth": "Barmouth",
  "Harlech": "Harlech",
  "Abersoch": "Abersoch",
  "Benllech": "Benllech",
  "Trearddur Bay": "Trearddur Bay",
  "Rhosneigr": "Rhosneigr",
  "Llandudno": "Llandudno West Shore",
  "Colwyn Bay": "Colwyn Bay",
  "Pwllheli": "Glan Don Beach",
  "Criccieth": "Criccieth",
  "Aberporth": "Aberporth",
  "New Quay": "New Quay",
  "Aberystwyth": "Aberystwyth North",
  "Porthcawl": "Sandy Bay Porthcawl",
  "Mumbles": "Bracelet Bay",
  "Barry Island": "Whitmore Bay Barry Island",
  "Penarth": "Penarth Beach",
  "Broad Haven": "Broad Haven (Central)",
  "Poppit Sands": "Poppit Sands"
};

async function fetchSewageStatus(beachName) {
  // Get Welsh Water name for this beach
  const wwName = BEACH_TO_WELSH_WATER[beachName];
  
  if (!wwName) {
    return { status: 'no_data', message: 'No sewage monitoring for this beach' };
  }
  
  try {
    const safeName = wwName.replace(/'/g, "''");
    const params = new URLSearchParams({
      where: `Linked_Bathing_Water LIKE '%${safeName}%'`,
      outFields: 'asset_name,status,discharge_duration_last_7_daysH,Receiving_Water',
      returnGeometry: 'false',
      f: 'json'
    });
    
    const response = await fetch(`${WELSH_WATER_ENDPOINT}?${params}`);
    if (!response.ok) throw new Error('Welsh Water API error');
    
    const data = await response.json();
    const features = data.features || [];
    
    if (features.length === 0) {
      return { status: 'no_data', message: 'No monitors found' };
    }
    
    // Check for active discharges
    const active = features.filter(f => f.attributes.status === 'Overflow Operating');
    const recent24h = features.filter(f => (f.attributes.status || '').includes('Has in the last 24 hours'));
    const investigating = features.filter(f => f.attributes.status === 'Under Investigation');
    
    const total7dHours = features.reduce((sum, f) => 
      sum + (f.attributes.discharge_duration_last_7_daysH || 0), 0);
    
    if (active.length > 0) {
      return {
        status: 'warning',
        message: `${active.length} active sewage discharge${active.length > 1 ? 's' : ''}`,
        hours7d: total7dHours
      };
    }
    
    if (recent24h.length > 0) {
      return {
        status: 'recent',
        message: 'Discharge in last 24 hours',
        hours7d: total7dHours
      };
    }
    
    if (investigating.length > 0) {
      return {
        status: 'caution',
        message: 'Monitor under investigation',
        hours7d: total7dHours
      };
    }
    
    if (total7dHours > 12) {
      return {
        status: 'recent_week',
        message: `${Math.round(total7dHours)} hours discharge in last 7 days`,
        hours7d: total7dHours
      };
    }
    
    return {
      status: 'clear',
      message: 'No recent discharge',
      hours7d: total7dHours
    };
    
  } catch (err) {
    console.error('Sewage fetch error:', err.message);
    return { status: 'error', message: 'Could not check sewage status' };
  }
}

function formatSewageForAlexa(beachName, sewage) {
  if (sewage.status === 'warning') {
    return `Warning: There is an active sewage discharge near ${beachName}. Swimming is not recommended.`;
  }
  if (sewage.status === 'recent') {
    return `Note: There was sewage discharge near ${beachName} in the last 24 hours.`;
  }
  if (sewage.status === 'caution') {
    return `Note: Sewage monitors near ${beachName} are under investigation.`;
  }
  if (sewage.status === 'recent_week' && sewage.hours7d > 24) {
    return `Note: There were ${Math.round(sewage.hours7d)} hours of sewage discharge near ${beachName} in the last 7 days.`;
  }
  // For 'clear' or 'no_data', say nothing
  return null;
}

// =============================================================================
// EXISTING FUNCTIONS
// =============================================================================

function getSunTimes(lat, lon, date = new Date()) {
  const rad = Math.PI / 180;
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  const declination = -23.45 * Math.cos(rad * (360 / 365) * (dayOfYear + 10));
  const cosHourAngle = -Math.tan(lat * rad) * Math.tan(declination * rad);
  const hourAngle = Math.acos(Math.max(-1, Math.min(1, cosHourAngle))) / rad;
  const solarNoon = 12 - (lon / 15);
  const sunrise = solarNoon - (hourAngle / 15);
  const sunset = solarNoon + (hourAngle / 15);
  
  const formatTime = (decimalHours) => {
    const h = Math.floor(decimalHours);
    const m = Math.round((decimalHours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };
  
  return { sunrise: formatTime(sunrise), sunset: formatTime(sunset) };
}

async function fetchTideData(stationId) {
  const apiKey = process.env.ADMIRALTY_API_KEY;
  if (!apiKey) throw new Error('ADMIRALTY_API_KEY not set');
  
  const url = `https://admiraltyapi.azure-api.net/uktidalapi/api/V1/Stations/${stationId}/TidalEvents`;
  const response = await fetch(url, { headers: { 'Ocp-Apim-Subscription-Key': apiKey } });
  
  if (!response.ok) throw new Error(`Admiralty API error: ${response.status}`);
  
  const data = await response.json();
  const now = new Date();
  const upcomingEvents = data.filter(event => new Date(event.DateTime) > now);
  const nextHigh = upcomingEvents.find(e => e.EventType === 'HighWater');
  const nextLow = upcomingEvents.find(e => e.EventType === 'LowWater');
  
  const formatTideTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  };
  
  return {
    nextHighTide: nextHigh ? { time: formatTideTime(nextHigh.DateTime), height: nextHigh.Height ? `${nextHigh.Height.toFixed(1)}m` : null } : null,
    nextLowTide: nextLow ? { time: formatTideTime(nextLow.DateTime), height: nextLow.Height ? `${nextLow.Height.toFixed(1)}m` : null } : null
  };
}

async function fetchMarineData(lat, lon) {
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,wave_period,swell_wave_height,sea_surface_temperature&timezone=Europe/London`;
  const response = await fetch(url);
  
  if (!response.ok) throw new Error(`Open-Meteo API error: ${response.status}`);
  
  const data = await response.json();
  const current = data.current;
  
  return {
    seaTemp: current.sea_surface_temperature ? `${Math.round(current.sea_surface_temperature)}°C` : null,
    waveHeight: current.wave_height ? `${current.wave_height.toFixed(1)}m` : null,
    wavePeriod: current.wave_period ? `${Math.round(current.wave_period)}s` : null,
    swellHeight: current.swell_wave_height ? `${current.swell_wave_height.toFixed(1)}m` : null
  };
}

async function getConditions(locationSlug) {
  const location = locations[locationSlug];
  if (!location) return null;
  
  const [tideData, marineData, sewageData] = await Promise.all([
    fetchTideData(location.stationId).catch(err => {
      console.error('Tide fetch error:', err.message);
      return { nextHighTide: null, nextLowTide: null };
    }),
    fetchMarineData(location.lat, location.lon).catch(err => {
      console.error('Marine fetch error:', err.message);
      return { seaTemp: null, waveHeight: null, wavePeriod: null, swellHeight: null };
    }),
    fetchSewageStatus(location.name).catch(err => {
      console.error('Sewage fetch error:', err.message);
      return { status: 'error', message: 'Could not check' };
    })
  ]);
  
  const sunTimes = getSunTimes(location.lat, location.lon);
  
  return {
    location: location.name,
    timestamp: new Date().toISOString(),
    sunrise: sunTimes.sunrise,
    sunset: sunTimes.sunset,
    ...tideData,
    ...marineData,
    sewage: sewageData
  };
}

// =============================================================================
// ROUTES
// =============================================================================

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
    return res.status(404).json({ error: 'Location not found', available: Object.keys(locations) });
  }
  
  try {
    const conditions = await getConditions(slug);
    res.json(conditions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/locations', (req, res) => {
  const list = Object.entries(locations).map(([slug, data]) => ({ slug, name: data.name }));
  res.json(list);
});

app.get('/stations', async (req, res) => {
  const apiKey = process.env.ADMIRALTY_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ADMIRALTY_API_KEY not set' });
  
  try {
    const url = 'https://admiraltyapi.azure-api.net/uktidalapi/api/V1/Stations';
    const response = await fetch(url, { headers: { 'Ocp-Apim-Subscription-Key': apiKey } });
    if (!response.ok) throw new Error(`Admiralty API error: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// ALEXA ENDPOINT
// =============================================================================

app.post('/alexa', express.json(), async (req, res) => {
  const requestType = req.body.request.type;
  
  if (requestType === 'LaunchRequest') {
    return res.json({
      version: '1.0',
      response: {
        outputSpeech: { type: 'PlainText', text: 'Welcome to Shorecast. Ask me about conditions at a beach, like Porthcawl or Barry Island.' },
        shouldEndSession: false
      }
    });
  }
  
  if (requestType === 'IntentRequest') {
    const intentName = req.body.request.intent.name;
    
    if (intentName === 'GetConditionsIntent') {
      const locationSlot = req.body.request.intent.slots?.location?.value;
      
      if (!locationSlot) {
        return res.json({
          version: '1.0',
          response: {
            outputSpeech: { type: 'PlainText', text: 'Which beach would you like conditions for? Try saying Porthcawl or Barry Island.' },
            shouldEndSession: false
          }
        });
      }
      
      const slug = locationSlot.toLowerCase()
        .replace(' island', '').replace(' bay', '').replace(' cove', '').replace(' sands', '')
        .replace('lyme regis', 'lymeregis').replace('rest bay', 'restbay').replace('colwyn bay', 'colwynbay')
        .replace('new quay', 'newquay').replace('newport sands', 'newportsands').replace('broad haven', 'broadhaven')
        .replace('freshwater west', 'freshwaterwest').replace('porth dinllaen', 'porthdinllaen')
        .replace('trearddur bay', 'trearddur').replace('cemaes bay', 'cemaes')
        .replace(/ /g, '');
      
      const conditions = await getConditions(slug);
      
      if (!conditions) {
        return res.json({
          version: '1.0',
          response: {
            outputSpeech: { type: 'PlainText', text: `Sorry, I don't have data for ${locationSlot}. Try Barry, Porthcawl, Tenby, or Rhossili.` },
            shouldEndSession: false
          }
        });
      }
      
      // Build speech response
      let speech = `Here are conditions at ${conditions.location}. `;
      
      // SEWAGE WARNING FIRST if active
      if (conditions.sewage && conditions.sewage.status === 'warning') {
        speech = formatSewageForAlexa(conditions.location, conditions.sewage) + ' ';
      } else {
        speech += `Sunrise is at ${conditions.sunrise}. `;
        if (conditions.nextHighTide) {
          speech += `High tide is at ${conditions.nextHighTide.time}`;
          if (conditions.nextHighTide.height) speech += ` reaching ${conditions.nextHighTide.height}`;
          speech += '. ';
        }
        if (conditions.seaTemp) speech += `Sea temperature is ${conditions.seaTemp}. `;
        if (conditions.waveHeight) speech += `Wave height is ${conditions.waveHeight}. `;
        
        // Add sewage note at end if recent activity
        const sewageNote = formatSewageForAlexa(conditions.location, conditions.sewage);
        if (sewageNote) speech += sewageNote;
      }
      
      return res.json({
        version: '1.0',
        response: { outputSpeech: { type: 'PlainText', text: speech }, shouldEndSession: true }
      });
    }
    
    if (intentName === 'ListLocationsIntent') {
      const names = Object.values(locations).map(l => l.name).join(', ');
      return res.json({
        version: '1.0',
        response: { outputSpeech: { type: 'PlainText', text: `I have conditions for: ${names}.` }, shouldEndSession: false }
      });
    }
    
    if (intentName === 'AMAZON.HelpIntent') {
      return res.json({
        version: '1.0',
        response: {
          outputSpeech: { type: 'PlainText', text: 'Ask me for conditions at a beach. For example, say: conditions at Porthcawl. Or ask what locations I cover.' },
          shouldEndSession: false
        }
      });
    }
    
    if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
      return res.json({
        version: '1.0',
        response: { outputSpeech: { type: 'PlainText', text: 'Happy swimming!' }, shouldEndSession: true }
      });
    }
  }
  
  res.json({
    version: '1.0',
    response: { outputSpeech: { type: 'PlainText', text: "Sorry, I didn't understand that. Ask me about conditions at a beach." }, shouldEndSession: false }
  });
});

app.listen(PORT, () => {
  console.log(`Shorecast running on port ${PORT}`);
});
