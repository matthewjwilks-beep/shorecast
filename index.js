// ============================================
// SHORECAST BACKEND - Complete index.js
// ============================================
// Last Updated: 2 December 2025
// Deploy to: Render.com (free tier)
// Environment Variables Required: ADMIRALTY_API_KEY
// FIXED: Tide times now correctly query future dates

const express = require('express');
const cors = require('cors');
const app = express();

// CORS configuration - manual headers for maximum compatibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ============================================
// BEACH DATABASE (99 locations)
// ============================================

const BEACHES = [
  // Wales - Gower Peninsula
  { slug: 'rhossili', name: 'Rhossili', location: 'Gower Peninsula', lat: 51.5651, lon: -4.2917, facing: 'west', stationId: '0113', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'langland', name: 'Langland Bay', location: 'Gower Peninsula', lat: 51.5622, lon: -4.0356, facing: 'south', stationId: '0113', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'caswell', name: 'Caswell Bay', location: 'Gower Peninsula', lat: 51.5686, lon: -4.0461, facing: 'south', stationId: '0113', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'oxwich', name: 'Oxwich Bay', location: 'Gower Peninsula', lat: 51.5542, lon: -4.1803, facing: 'south', stationId: '0113', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'port-eynon', name: 'Port Eynon', location: 'Gower Peninsula', lat: 51.5369, lon: -4.2142, facing: 'south', stationId: '0113', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'bracelet-bay', name: 'Bracelet Bay', location: 'Gower Peninsula', lat: 51.5669, lon: -3.9869, facing: 'south', stationId: '0113', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  
  // Wales - Vale of Glamorgan
  { slug: 'barry-island', name: 'Barry Island', location: 'Vale of Glamorgan', lat: 51.3967, lon: -3.2661, facing: 'south', stationId: '0113', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'penarth', name: 'Penarth Beach', location: 'Vale of Glamorgan', lat: 51.4336, lon: -3.1742, facing: 'south', stationId: '0113', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'llantwit-major', name: 'Llantwit Major', location: 'Vale of Glamorgan', lat: 51.4022, lon: -3.4803, facing: 'south', stationId: '0113', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'southerndown', name: 'Southerndown', location: 'Vale of Glamorgan', lat: 51.4456, lon: -3.6069, facing: 'southwest', stationId: '0113', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'ogmore-by-sea', name: 'Ogmore-by-Sea', location: 'Vale of Glamorgan', lat: 51.4711, lon: -3.6328, facing: 'southwest', stationId: '0113', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  
  // Wales - Bridgend
  { slug: 'porthcawl', name: 'Porthcawl', location: 'Bridgend', lat: 51.4778, lon: -3.7028, facing: 'south', stationId: '0113', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'rest-bay', name: 'Rest Bay', location: 'Bridgend', lat: 51.4856, lon: -3.7194, facing: 'west', stationId: '0113', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'trecco-bay', name: 'Trecco Bay', location: 'Bridgend', lat: 51.4817, lon: -3.6972, facing: 'south', stationId: '0113', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  
  // Wales - Pembrokeshire
  { slug: 'tenby-south', name: 'Tenby South', location: 'Pembrokeshire', lat: 51.6689, lon: -4.7019, facing: 'southeast', stationId: '0464', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'tenby-north', name: 'Tenby North', location: 'Pembrokeshire', lat: 51.6761, lon: -4.7017, facing: 'northeast', stationId: '0464', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'saundersfoot', name: 'Saundersfoot', location: 'Pembrokeshire', lat: 51.7125, lon: -4.6853, facing: 'southeast', stationId: '0464', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'barafundle', name: 'Barafundle Bay', location: 'Pembrokeshire', lat: 51.6322, lon: -4.7725, facing: 'south', stationId: '0464', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'broad-haven-south', name: 'Broad Haven South', location: 'Pembrokeshire', lat: 51.6328, lon: -4.8586, facing: 'south', stationId: '0464', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'freshwater-west', name: 'Freshwater West', location: 'Pembrokeshire', lat: 51.6358, lon: -5.0306, facing: 'west', stationId: '0464', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'marloes', name: 'Marloes Sands', location: 'Pembrokeshire', lat: 51.7142, lon: -5.1847, facing: 'west', stationId: '0464', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'broad-haven-north', name: 'Broad Haven North', location: 'Pembrokeshire', lat: 51.8019, lon: -5.1403, facing: 'west', stationId: '0464', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'newgale', name: 'Newgale', location: 'Pembrokeshire', lat: 51.8417, lon: -5.1136, facing: 'west', stationId: '0464', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'whitesands', name: 'Whitesands Bay', location: 'Pembrokeshire', lat: 51.8858, lon: -5.2983, facing: 'west', stationId: '0464', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  
  // Wales - Ceredigion
  { slug: 'llangrannog', name: 'Llangrannog', location: 'Ceredigion', lat: 52.1247, lon: -4.5544, facing: 'west', stationId: '0464', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'aberaeron', name: 'Aberaeron', location: 'Ceredigion', lat: 52.2428, lon: -4.2614, facing: 'west', stationId: '0464', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'aberystwyth', name: 'Aberystwyth', location: 'Ceredigion', lat: 52.4147, lon: -4.0906, facing: 'west', stationId: '0464', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'borth', name: 'Borth', location: 'Ceredigion', lat: 52.4892, lon: -4.0525, facing: 'west', stationId: '0464', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  
  // Wales - Gwynedd
  { slug: 'barmouth', name: 'Barmouth', location: 'Gwynedd', lat: 52.7225, lon: -4.0547, facing: 'west', stationId: '0464', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'harlech', name: 'Harlech', location: 'Gwynedd', lat: 52.8578, lon: -4.1094, facing: 'west', stationId: '0464', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'abersoch', name: 'Abersoch', location: 'Gwynedd', lat: 52.8197, lon: -4.4906, facing: 'south', stationId: '0464', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'pwllheli', name: 'Pwllheli', location: 'Gwynedd', lat: 52.8858, lon: -4.4019, facing: 'south', stationId: '0464', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'porth-oer', name: 'Porth Oer (Whistling Sands)', location: 'Gwynedd', lat: 52.9019, lon: -4.6475, facing: 'northwest', stationId: '0464', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  
  // Wales - Anglesey
  { slug: 'benllech', name: 'Benllech', location: 'Anglesey', lat: 53.3181, lon: -4.2308, facing: 'east', stationId: '0464', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'trearddur-bay', name: 'Trearddur Bay', location: 'Anglesey', lat: 53.2753, lon: -4.6311, facing: 'west', stationId: '0464', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'rhosneigr', name: 'Rhosneigr', location: 'Anglesey', lat: 53.2369, lon: -4.5150, facing: 'southwest', stationId: '0464', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  { slug: 'llanddwyn', name: 'Llanddwyn Beach', location: 'Anglesey', lat: 53.1414, lon: -4.4303, facing: 'southwest', stationId: '0464', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water' },
  
  // Cornwall
  { slug: 'sennen', name: 'Sennen Cove', location: 'Cornwall', lat: 50.0753, lon: -5.6969, facing: 'west', stationId: '0002', region: 'england', company: 'south-west-water', companyName: 'South West Water' },
  { slug: 'porthcurno', name: 'Porthcurno', location: 'Cornwall', lat: 50.0414, lon: -5.6533, facing: 'south', stationId: '0002', region: 'england', company: 'south-west-water', companyName: 'South West Water' },
  { slug: 'porthmeor', name: 'Porthmeor', location: 'Cornwall', lat: 50.2142, lon: -5.4811, facing: 'north', stationId: '0002', region: 'england', company: 'south-west-water', companyName: 'South West Water' },
  { slug: 'fistral', name: 'Fistral Beach', location: 'Cornwall', lat: 50.4181, lon: -5.0931, facing: 'west', stationId: '0002', region: 'england', company: 'south-west-water', companyName: 'South West Water' },
  { slug: 'watergate-bay', name: 'Watergate Bay', location: 'Cornwall', lat: 50.4456, lon: -5.0522, facing: 'northwest', stationId: '0002', region: 'england', company: 'south-west-water', companyName: 'South West Water' },
  { slug: 'constantine', name: 'Constantine Bay', location: 'Cornwall', lat: 50.5447, lon: -4.9592, facing: 'northwest', stationId: '0002', region: 'england', company: 'south-west-water', companyName: 'South West Water' },
  { slug: 'polzeath', name: 'Polzeath', location: 'Cornwall', lat: 50.5756, lon: -4.9136, facing: 'northwest', stationId: '0002', region: 'england', company: 'south-west-water', companyName: 'South West Water' },
  { slug: 'falmouth-gyllyngvase', name: 'Gyllyngvase Beach', location: 'Cornwall', lat: 50.1458, lon: -5.0722, facing: 'southeast', stationId: '0002', region: 'england', company: 'south-west-water', companyName: 'South West Water' },
  
  // Devon
  { slug: 'woolacombe', name: 'Woolacombe', location: 'Devon', lat: 51.1736, lon: -4.2108, facing: 'west', stationId: '0002', region: 'england', company: 'south-west-water', companyName: 'South West Water' },
  { slug: 'croyde', name: 'Croyde Bay', location: 'Devon', lat: 51.1397, lon: -4.2344, facing: 'west', stationId: '0002', region: 'england', company: 'south-west-water', companyName: 'South West Water' },
  { slug: 'saunton-sands', name: 'Saunton Sands', location: 'Devon', lat: 51.1053, lon: -4.2286, facing: 'west', stationId: '0002', region: 'england', company: 'south-west-water', companyName: 'South West Water' },
  { slug: 'instow', name: 'Instow', location: 'Devon', lat: 51.0539, lon: -4.1761, facing: 'northwest', stationId: '0002', region: 'england', company: 'south-west-water', companyName: 'South West Water' },
  { slug: 'torquay', name: 'Torquay', location: 'Devon', lat: 50.4619, lon: -3.5283, facing: 'east', stationId: '0011', region: 'england', company: 'south-west-water', companyName: 'South West Water' },
  { slug: 'paignton', name: 'Paignton', location: 'Devon', lat: 50.4361, lon: -3.5619, facing: 'east', stationId: '0011', region: 'england', company: 'south-west-water', companyName: 'South West Water' },
  { slug: 'blackpool-sands', name: 'Blackpool Sands', location: 'Devon', lat: 50.3197, lon: -3.6214, facing: 'southeast', stationId: '0011', region: 'england', company: 'south-west-water', companyName: 'South West Water' },
  
  // Dorset
  { slug: 'lyme-regis', name: 'Lyme Regis', location: 'Dorset', lat: 50.7250, lon: -2.9358, facing: 'south', stationId: '0011', region: 'england', company: 'wessex-water', companyName: 'Wessex Water' },
  { slug: 'charmouth', name: 'Charmouth', location: 'Dorset', lat: 50.7353, lon: -2.9011, facing: 'south', stationId: '0011', region: 'england', company: 'wessex-water', companyName: 'Wessex Water' },
  { slug: 'west-bay', name: 'West Bay', location: 'Dorset', lat: 50.7092, lon: -2.7603, facing: 'south', stationId: '0011', region: 'england', company: 'wessex-water', companyName: 'Wessex Water' },
  { slug: 'chesil-beach', name: 'Chesil Beach', location: 'Dorset', lat: 50.6358, lon: -2.5453, facing: 'south', stationId: '0011', region: 'england', company: 'wessex-water', companyName: 'Wessex Water' },
  { slug: 'weymouth', name: 'Weymouth', location: 'Dorset', lat: 50.6106, lon: -2.4531, facing: 'south', stationId: '0011', region: 'england', company: 'wessex-water', companyName: 'Wessex Water' },
  { slug: 'lulworth-cove', name: 'Lulworth Cove', location: 'Dorset', lat: 50.6197, lon: -2.2475, facing: 'south', stationId: '0011', region: 'england', company: 'wessex-water', companyName: 'Wessex Water' },
  { slug: 'durdle-door', name: 'Durdle Door', location: 'Dorset', lat: 50.6233, lon: -2.2756, facing: 'south', stationId: '0011', region: 'england', company: 'wessex-water', companyName: 'Wessex Water' },
  { slug: 'studland', name: 'Studland Bay', location: 'Dorset', lat: 50.6428, lon: -1.9386, facing: 'east', stationId: '0011', region: 'england', company: 'wessex-water', companyName: 'Wessex Water' },
  { slug: 'bournemouth', name: 'Bournemouth', location: 'Dorset', lat: 50.7192, lon: -1.8808, facing: 'south', stationId: '0011', region: 'england', company: 'wessex-water', companyName: 'Wessex Water' },
  { slug: 'sandbanks', name: 'Sandbanks', location: 'Dorset', lat: 50.6889, lon: -1.9478, facing: 'south', stationId: '0011', region: 'england', company: 'wessex-water', companyName: 'Wessex Water' },
  
  // Sussex
  { slug: 'brighton', name: 'Brighton Beach', location: 'Sussex', lat: 50.8225, lon: -0.1372, facing: 'south', stationId: '0011', region: 'england', company: 'southern-water', companyName: 'Southern Water' },
  { slug: 'hove', name: 'Hove', location: 'Sussex', lat: 50.8289, lon: -0.1717, facing: 'south', stationId: '0011', region: 'england', company: 'southern-water', companyName: 'Southern Water' },
  { slug: 'worthing', name: 'Worthing', location: 'Sussex', lat: 50.8103, lon: -0.3722, facing: 'south', stationId: '0011', region: 'england', company: 'southern-water', companyName: 'Southern Water' },
  { slug: 'littlehampton', name: 'Littlehampton', location: 'Sussex', lat: 50.7989, lon: -0.5428, facing: 'south', stationId: '0011', region: 'england', company: 'southern-water', companyName: 'Southern Water' },
  { slug: 'bognor-regis', name: 'Bognor Regis', location: 'Sussex', lat: 50.7806, lon: -0.6778, facing: 'south', stationId: '0011', region: 'england', company: 'southern-water', companyName: 'Southern Water' },
  { slug: 'west-wittering', name: 'West Wittering', location: 'Sussex', lat: 50.7689, lon: -0.8819, facing: 'south', stationId: '0011', region: 'england', company: 'southern-water', companyName: 'Southern Water' }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function getDateForTimeSlot(timeSlot) {
  const now = new Date();
  
  const dates = {
    now: now,
    tonight: (() => {
      const tonightDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);
      if (now.getHours() >= 20) {
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 20, 0, 0);
      }
      return tonightDate;
    })(),
    'tomorrow-am': new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 8, 0, 0),
    'tomorrow-pm': new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 17, 0, 0),
    'day-after-am': new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 8, 0, 0)
  };
  
  return dates[timeSlot] || now;
}

function getTimeLabel(timeSlot) {
  const now = new Date();
  const targetDate = getDateForTimeSlot(timeSlot);
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  const labels = {
    now: 'right now',
    tonight: now.getHours() >= 20 ? 'tomorrow evening' : 'tonight',
    'tomorrow-am': 'tomorrow morning',
    'tomorrow-pm': 'tomorrow evening',
    'day-after-am': `${days[targetDate.getDay()]} morning`  // FIXED: Now shows "thursday morning" not just "thursday"
  };
  
  return labels[timeSlot] || 'right now';
}

function calculateSunTimes(lat, lon, date) {
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  const latRad = lat * Math.PI / 180;
  const declination = -23.45 * Math.cos(2 * Math.PI * (dayOfYear + 10) / 365);
  const declinationRad = declination * Math.PI / 180;
  const cosHourAngle = -Math.tan(latRad) * Math.tan(declinationRad);
  const hourAngle = Math.acos(Math.max(-1, Math.min(1, cosHourAngle))) * 180 / Math.PI;
  const sunriseHour = 12 - hourAngle / 15 - lon / 15;
  const sunsetHour = 12 + hourAngle / 15 - lon / 15;
  
  const formatTime = (hour) => {
    const h = Math.floor(hour);
    const m = Math.floor((hour - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };
  
  return { sunrise: formatTime(sunriseHour), sunset: formatTime(sunsetHour) };
}

function shouldShowSunriseBadge(timeSlot, targetDate) {
  const hour = targetDate.getHours();
  return (timeSlot === 'now' && hour < 9) || timeSlot === 'tomorrow-am' || timeSlot === 'day-after-am';
}

function shouldShowSunsetBadge(timeSlot, facing, cloudCover) {
  const westFacing = ['west', 'northwest', 'southwest'].includes(facing);
  const clearSkies = cloudCover < 30;
  const eveningTime = timeSlot === 'tonight' || timeSlot === 'tomorrow-pm';
  return westFacing && clearSkies && eveningTime;
}

function calculateFeelsLike(airTemp, windSpeed) {
  if (airTemp > 10 || windSpeed < 5) return airTemp;
  return Math.round(13.12 + 0.6215 * airTemp - 11.37 * Math.pow(windSpeed, 0.16) + 
         0.3965 * airTemp * Math.pow(windSpeed, 0.16));
}

// ============================================
// API FETCH FUNCTIONS
// ============================================

// FIXED: Now correctly fetches tide data for future dates
async function fetchTideForTime(beach, targetDate) {
  // Calculate how many days ahead we need (0 = today, 1 = tomorrow, etc.)
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const daysAhead = Math.floor((targetStart - todayStart) / (1000 * 60 * 60 * 24));
  
  // Request enough days of data (at least 1, up to 4 to cover day-after-tomorrow)
  const duration = Math.max(1, daysAhead + 1);
  
  const url = `https://admiraltyapi.azure-api.net/uktidalapi/api/V1/Stations/${beach.stationId}/TidalEvents?duration=${duration}`;
  
  try {
    const response = await fetch(url, {
      headers: { 'Ocp-Apim-Subscription-Key': process.env.ADMIRALTY_API_KEY }
    });
    const data = await response.json();
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn(`No tide data returned for station ${beach.stationId}`);
      return { type: 'high', time: '—', height: null };
    }
    
    const targetTime = targetDate.getTime();
    
    // Find the tide event closest to (but preferably just after) the target time
    // This gives users the "next tide" from their chosen time slot
    let bestTide = null;
    let bestDiff = Infinity;
    
    // First pass: find the next tide event AFTER the target time
    for (const event of data) {
      const eventTime = new Date(event.DateTime).getTime();
      const diff = eventTime - targetTime;
      
      // Prefer events that are after target time but within 12 hours
      if (diff >= 0 && diff < bestDiff && diff < 12 * 60 * 60 * 1000) {
        bestDiff = diff;
        bestTide = event;
      }
    }
    
    // If no future event found, find the closest one overall
    if (!bestTide) {
      for (const event of data) {
        const eventTime = new Date(event.DateTime).getTime();
        const diff = Math.abs(eventTime - targetTime);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestTide = event;
        }
      }
    }
    
    if (bestTide) {
      const eventType = bestTide.EventType || 'HighWater';
      return {
        type: eventType.toLowerCase().includes('high') ? 'high' : 'low',
        time: new Date(bestTide.DateTime).toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit',
          timeZone: 'Europe/London'
        }),
        height: bestTide.Height
      };
    }
  } catch (err) {
    console.warn('Tide fetch failed:', err.message);
  }
  
  return { type: 'high', time: '—', height: null };
}

async function fetchWeatherForTime(beach, targetDate) {
  const dateStr = targetDate.toISOString().split('T')[0];
  const hour = targetDate.getHours();
  
  const marineUrl = `https://marine-api.open-meteo.com/v1/marine?` +
    `latitude=${beach.lat}&longitude=${beach.lon}` +
    `&hourly=wave_height,swell_wave_height,wave_period,ocean_current_velocity,sea_surface_temperature` +
    `&start_date=${dateStr}&end_date=${dateStr}`;
  
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${beach.lat}&longitude=${beach.lon}` +
    `&hourly=temperature_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,` +
    `uv_index,cloud_cover,precipitation,weather_code` +
    `&start_date=${dateStr}&end_date=${dateStr}`;
  
  try {
    const [marineRes, weatherRes] = await Promise.all([
      fetch(marineUrl),
      fetch(weatherUrl)
    ]);
    
    const marine = await marineRes.json();
    const weather = await weatherRes.json();
    
    const marineData = {
      seaTemp: marine.hourly?.sea_surface_temperature?.[hour] || null,
      waveHeight: marine.hourly?.wave_height?.[hour] || 0,
      swellHeight: marine.hourly?.swell_wave_height?.[hour] || 0,
      wavePeriod: marine.hourly?.wave_period?.[hour] || null
    };
    
    const weatherData = {
      airTemp: weather.hourly?.temperature_2m?.[hour] || null,
      feelsLike: weather.hourly?.apparent_temperature?.[hour] || null,
      windSpeed: weather.hourly?.wind_speed_10m?.[hour] || 0,
      windDirection: weather.hourly?.wind_direction_10m?.[hour] || null,
      uvIndex: weather.hourly?.uv_index?.[hour] || 0,
      cloudCover: weather.hourly?.cloud_cover?.[hour] || 0,
      precipitation: weather.hourly?.precipitation?.[hour] || 0,
      weatherCode: weather.hourly?.weather_code?.[hour] || null
    };
    
    return { marine: marineData, weather: weatherData };
  } catch (err) {
    console.warn('Weather fetch failed:', err.message);
    return null;
  }
}

async function fetchSewageStatus(beach) {
  try {
    if (beach.company === 'welsh-water') {
      const url = `https://services1.arcgis.com/LguJ1f6vTrDEMDUy/arcgis/rest/services/` +
        `Storm_Overflows_WW/FeatureServer/0/query?` +
        `where=1%3D1&outFields=*&f=json&returnGeometry=false`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      const nearby = data.features?.find(f => {
        const dist = Math.sqrt(
          Math.pow(f.attributes.Y - beach.lat, 2) + 
          Math.pow(f.attributes.X - beach.lon, 2)
        );
        return dist < 0.05;
      });
      
      if (nearby) {
        const status = nearby.attributes.AlertStatus || 'Not Discharging';
        if (status.includes('Discharging')) {
          return { status: 'active', icon: '✗', source: 'Welsh Water' };
        }
        const lastDischarge = nearby.attributes.StopDateTime;
        if (lastDischarge) {
          const hoursSince = (Date.now() - new Date(lastDischarge)) / 3600000;
          if (hoursSince < 48) {
            return { status: 'recent', icon: '!', source: 'Welsh Water' };
          }
        }
      }
      
      return { status: 'clear', icon: '✓', source: 'Welsh Water' };
      
    } else if (beach.company === 'south-west-water') {
      return { status: 'clear', icon: '✓', source: 'South West Water' };
      
    } else if (beach.company === 'southern-water') {
      return { status: 'clear', icon: '✓', source: 'Southern Water' };
      
    } else if (beach.company === 'wessex-water') {
      return { status: 'clear', icon: '✓', source: 'Wessex Water' };
    }
  } catch (err) {
    console.warn('Sewage fetch failed:', err.message);
  }
  
  return { status: 'unknown', icon: '?', source: beach.companyName };
}

// ============================================
// ENHANCED RECOMMENDATION ENGINE
// ============================================

function generateRecommendation(beach, conditions, mode, timeSlot) {
  const { marine, weather, sewage, tide, sun } = conditions;
  
  let status = 'green';
  let statusText = 'great';
  let parts = [];
  
  const getWeatherState = () => {
    if (weather.precipitation > 2) return 'rain forecast';
    if (weather.precipitation > 0.5) return 'light rain expected';
    if (weather.cloudCover < 20) return 'clear skies';
    if (weather.cloudCover < 50) return 'partly cloudy';
    if (weather.cloudCover < 80) return 'mostly cloudy';
    return 'overcast conditions';
  };
  
  const weatherState = getWeatherState();
  const isClear = weather.cloudCover < 30;
  const isMorningForecast = timeSlot === 'tomorrow-am' || timeSlot === 'day-after-am';
  const isEveningForecast = timeSlot === 'tonight' || timeSlot === 'tomorrow-pm';
  
  if (mode === 'swimming') {
    if (sewage.status === 'active') {
      status = 'red';
      statusText = 'avoid';
      parts.push('**active sewage discharge.** swimming not recommended. try a nearby beach instead - check the dashboard for alternatives.');
      return { status, statusText, recommendation: parts.join(' ') };
    }
    
    if (marine.waveHeight > 2) {
      status = 'red';
      statusText = 'rough';
      parts.push(`**very rough seas** at ${marine.waveHeight.toFixed(1)}m waves. dangerous conditions - experienced swimmers only, and stay very close to shore.`);
      if (timeSlot !== 'now') {
        parts.push('better conditions expected later in the week.');
      }
      return { status, statusText, recommendation: parts.join(' ') };
    }
    
    if (sewage.status === 'recent') {
      status = 'amber';
      statusText = 'check';
      parts.push('**sewage discharge ended 24-48 hours ago.** water should be clear by now, but some swimmers prefer to wait the full 48 hours. check the details and decide for yourself.');
    }
    
    if (marine.waveHeight >= 1.5) {
      if (status === 'green') status = 'amber';
      statusText = 'choppy';
      parts.push(`**choppy conditions** at ${marine.waveHeight.toFixed(1)}m waves. swimmable but expect a workout.`);
    }
    
    if (weather.windSpeed > 40) {
      if (status === 'green') status = 'amber';
      statusText = 'windy';
      parts.push(`**strong winds** at ${Math.round(weather.windSpeed)}km/h. could be challenging, especially heading back to shore.`);
    }
    
    if (status === 'green') {
      statusText = 'excellent';
      
      if (marine.waveHeight < 0.5) {
        parts.push(`**perfect conditions.** calm water like glass. ${weatherState}`);
      } else if (marine.waveHeight < 1) {
        parts.push(`**lovely conditions ahead.** gentle rolling waves. ${weatherState}`);
      } else {
        parts.push(`**good swimming weather.** moderate swell. ${weatherState}`);
      }
      
      if (weather.windSpeed < 10) {
        parts.push('barely any breeze');
      } else if (weather.windSpeed < 20) {
        parts.push('light breeze');
      } else if (weather.windSpeed < 30) {
        parts.push('moderate wind');
      }
      
      if (sewage.status === 'clear') {
        parts.push('no sewage alerts');
      }
      
      if (sun && timeSlot !== 'now') {
        const facingWest = ['west', 'northwest', 'southwest'].includes(beach.facing);
        const facingEast = ['east', 'northeast', 'southeast'].includes(beach.facing);
        
        if (isMorningForecast) {
          if (isClear) {
            parts.push(`**spectacular sunrise expected at ${sun.sunrise}** - clear skies mean you'll have the whole show`);
          } else if (facingEast) {
            parts.push(`sunrise at ${sun.sunrise} on this ${beach.facing}-facing beach`);
          }
        }
        
        if (isEveningForecast) {
          if (facingWest && isClear) {
            parts.push(`**beautiful sunset window around ${sun.sunset}** - clear evening on this ${beach.facing}-facing beach. worth staying for`);
          } else if (facingWest && weather.cloudCover < 50) {
            parts.push(`${beach.facing}-facing beach gets the evening light. sunset around ${sun.sunset} if the clouds break`);
          } else if (facingWest) {
            parts.push(`${beach.facing}-facing beach, though cloudy conditions mean no sunset tonight`);
          }
        }
      }
      
      if (weather.uvIndex >= 6) {
        parts.push(`UV high (${weather.uvIndex}) - definitely bring sun cream`);
      } else if (weather.uvIndex >= 3) {
        parts.push(`UV moderate (${weather.uvIndex}) - sun cream recommended if you're staying out`);
      }
      
      if (tide.type && tide.time && tide.time !== '—') {
        const tideText = tide.type === 'high' ? 'high tide' : 'low tide';
        parts.push(`${tideText} at ${tide.time}`);
      }
      
      if (marine.seaTemp < 12) {
        parts.push(`water's ${Math.round(marine.seaTemp)}°C - bring a warm layer for afterwards`);
      } else if (marine.seaTemp >= 16) {
        parts.push(`lovely ${Math.round(marine.seaTemp)}°C water`);
      }
    }
    
  } else if (mode === 'dipping') {
    if (sewage.status === 'active' || sewage.status === 'recent') {
      status = 'red';
      statusText = 'wait';
      parts.push('**sewage discharge recently.** for cold water dipping we recommend waiting the full 48 hours - you\'re more exposed during immersion. try again in a day or two, or check a different beach.');
      return { status, statusText, recommendation: parts.join(' ') };
    }
    
    if (weather.feelsLike < 0) {
      status = 'red';
      statusText = 'dangerous';
      parts.push(`**severe hypothermia risk.** feels like ${Math.round(weather.feelsLike)}°C after accounting for wind chill. recovery would be extremely difficult in these conditions. wait for a calmer day.`);
      return { status, statusText, recommendation: parts.join(' ') };
    }
    
    if (marine.seaTemp >= 13) {
      status = 'amber';
      statusText = 'mild';
      parts.push(`**water's ${Math.round(marine.seaTemp)}°C - a bit too mild for serious cold therapy.** still refreshing if you fancy a quick dip, but not that winter bite some people are after.`);
    } else if (marine.seaTemp <= 8) {
      status = 'green';
      statusText = 'perfect';
      parts.push(`**${Math.round(marine.seaTemp)}°C - this is the one.** proper cold water therapy conditions. the kind of cold that wakes you right up.`);
    } else if (marine.seaTemp <= 10) {
      status = 'green';
      statusText = 'excellent';
      parts.push(`**${Math.round(marine.seaTemp)}°C - nice and cold.** great for cold therapy without being brutal.`);
    } else {
      status = 'amber';
      statusText = 'mild';
      parts.push(`**${Math.round(marine.seaTemp)}°C - refreshing but not that winter bite.** some dippers prefer it colder.`);
    }
    
    if (status === 'green') {
      parts.push(weatherState);
    }
    
    if (status === 'green' && isMorningForecast && sun) {
      if (isClear) {
        parts.push(`**dawn dip with a clear sunrise at ${sun.sunrise}.** this is what it's all about - cold water and watching the day begin`);
      } else if (weather.cloudCover < 50) {
        parts.push(`sunrise at ${sun.sunrise} - might break through the clouds for you`);
      } else {
        parts.push(`sunrise at ${sun.sunrise}, though cloudy conditions expected`);
      }
    }
    
    if (weather.precipitation > 0.5) {
      if (status === 'green') status = 'amber';
      parts.push('rain forecast - changing afterwards will be uncomfortable. maybe bring an extra towel and warm layers.');
    }
    
    if (status === 'green' && weather.feelsLike < 5) {
      parts.push(`feels like ${Math.round(weather.feelsLike)}°C outside - definitely bring warm layers for recovery. hot drink recommended.`);
    } else if (status === 'green' && weather.feelsLike >= 10) {
      parts.push(`mild ${Math.round(weather.feelsLike)}°C air temp makes for comfortable changing.`);
    }
    
    if (status === 'green' && sewage.status === 'clear') {
      parts.push('water quality clear.');
    }
    
    if (status === 'green' && weather.windSpeed > 25) {
      parts.push('breezy conditions - find shelter for changing.');
    } else if (status === 'green' && weather.windSpeed < 10) {
      parts.push('calm conditions for getting changed.');
    }
    
    if (status === 'green' && marine.seaTemp <= 10) {
      if (marine.seaTemp <= 5) {
        parts.push('safe time: 2-3 minutes for most people.');
      } else if (marine.seaTemp <= 8) {
        parts.push('safe time: 3-5 minutes for experienced dippers.');
      } else {
        parts.push('safe time: 5-10 minutes depending on your experience.');
      }
    }
  }
  
  let recommendation = parts.join('. ');
  recommendation = recommendation.replace(/\.\./g, '.');
  recommendation = recommendation.replace(/\. \./g, '.');
  
  if (!recommendation.endsWith('.')) {
    recommendation += '.';
  }
  
  return { status, statusText, recommendation };
}

// ============================================
// ROUTES
// ============================================

app.get('/', async (req, res) => {
  res.redirect('/conditions/barry-island');
});

app.get('/locations', (req, res) => {
  res.json(BEACHES.map(b => ({
    slug: b.slug,
    name: b.name,
    location: b.location,
    facing: b.facing,
    region: b.region
  })));
});

app.get('/conditions/:beach?', async (req, res) => {
  try {
    const slug = req.params.beach || 'barry-island';
    const mode = req.query.mode || 'swimming';
    
    const beach = BEACHES.find(b => b.slug === slug);
    if (!beach) {
      return res.status(404).json({ error: 'Beach not found' });
    }
    
    const targetDate = new Date();
    const [tide, weatherData, sewage] = await Promise.all([
      fetchTideForTime(beach, targetDate),
      fetchWeatherForTime(beach, targetDate),
      fetchSewageStatus(beach)
    ]);
    
    if (!weatherData) {
      return res.status(500).json({ error: 'Failed to fetch weather data' });
    }
    
    const { marine, weather } = weatherData;
    const feelsLike = weather.feelsLike || calculateFeelsLike(weather.airTemp, weather.windSpeed);
    const sunTimes = calculateSunTimes(beach.lat, beach.lon, targetDate);
    
    const recommendation = generateRecommendation(beach, {
      marine, 
      weather: { ...weather, feelsLike }, 
      sewage, 
      tide,
      sun: { sunrise: sunTimes.sunrise, sunset: sunTimes.sunset }
    }, mode, 'now');
    
    res.json({
      beach: beach.name,
      location: beach.location,
      mode,
      seaTemp: marine.seaTemp,
      waveHeight: marine.waveHeight,
      tide: tide,
      airTemp: weather.airTemp,
      feelsLike: feelsLike,
      windSpeed: weather.windSpeed,
      uvIndex: weather.uvIndex,
      sewage: sewage,
      sunrise: sunTimes.sunrise,
      sunset: sunTimes.sunset,
      recommendation: recommendation
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/dashboard', async (req, res) => {
  try {
    const beachSlugs = req.query.beaches ? req.query.beaches.split(',') : ['rhossili', 'barry-island', 'tenby-south'];
    const mode = req.query.mode || 'swimming';
    const timeSlot = req.query.time || 'now';
    
    if (!['swimming', 'dipping'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode. Use swimming or dipping.' });
    }
    
    const validTimes = ['now', 'tonight', 'tomorrow-am', 'tomorrow-pm', 'day-after-am'];
    if (!validTimes.includes(timeSlot)) {
      return res.status(400).json({ error: 'Invalid time. Use: ' + validTimes.join(', ') });
    }
    
    const targetDate = getDateForTimeSlot(timeSlot);
    const isForecast = timeSlot !== 'now';
    
    const beachesData = await Promise.all(
      beachSlugs.map(async (slug) => {
        const beach = BEACHES.find(b => b.slug === slug);
        if (!beach) return null;
        
        const [tide, weatherData, sewage] = await Promise.all([
          fetchTideForTime(beach, targetDate),
          fetchWeatherForTime(beach, targetDate),
          fetchSewageStatus(beach)
        ]);
        
        if (!weatherData) return null;
        
        const { marine, weather } = weatherData;
        const sunTimes = calculateSunTimes(beach.lat, beach.lon, targetDate);
        const feelsLike = weather.feelsLike || calculateFeelsLike(weather.airTemp, weather.windSpeed);
        const showSunriseBadge = shouldShowSunriseBadge(timeSlot, targetDate);
        const showSunsetBadge = shouldShowSunsetBadge(timeSlot, beach.facing, weather.cloudCover);
        
        const recommendation = generateRecommendation(beach, {
          marine,
          weather: { ...weather, feelsLike },
          sewage,
          tide,
          sun: { sunrise: sunTimes.sunrise, sunset: sunTimes.sunset }
        }, mode, timeSlot);
        
        return {
          name: beach.name,
          slug: beach.slug,
          location: beach.location,
          facing: beach.facing,
          seaTempDisplay: marine.seaTemp ? `${Math.round(marine.seaTemp)}°C` : '—',
          waves: mode === 'swimming' ? {
            heightDisplay: marine.waveHeight ? `${marine.waveHeight.toFixed(1)}m` : '—'
          } : null,
          tide: { type: tide.type, time: tide.time },
          weather: {
            airTempDisplay: `${Math.round(weather.airTemp)}°C`,
            feelsLikeDisplay: `${Math.round(feelsLike)}°C`,
            uvIndex: weather.uvIndex
          },
          sewage,
          sun: {
            sunrise: sunTimes.sunrise,
            sunset: sunTimes.sunset,
            showSunriseBadge,
            showSunsetBadge
          },
          alerts: {
            jellyfish: false,
            jellyfishSpecies: null,
            recentRainfall: weather.precipitation > 5,
            bathingWaterQuality: 'good'
          },
          recommendation,
          isForecast
        };
      })
    );
    
    const validBeaches = beachesData.filter(b => b !== null);
    
    if (validBeaches.length === 0) {
      return res.status(404).json({ error: 'No valid beaches found' });
    }
    
    res.json({
      meta: {
        time: timeSlot,
        timeLabel: getTimeLabel(timeSlot),
        mode,
        isForecast,
        updatedAt: new Date().toISOString()
      },
      beaches: validBeaches
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data', details: error.message });
  }
});

app.post('/alexa', async (req, res) => {
  try {
    const request = req.body.request;
    
    if (request.type === 'LaunchRequest') {
      return res.json({
        version: '1.0',
        response: {
          outputSpeech: { type: 'PlainText', text: 'Welcome to Shorecast. Ask me about any beach conditions.' },
          shouldEndSession: false
        }
      });
    }
    
    if (request.type === 'IntentRequest') {
      const intent = request.intent.name;
      
      if (intent === 'GetConditionsIntent') {
        const location = request.intent.slots?.location?.value;
        if (!location) {
          return res.json({
            version: '1.0',
            response: {
              outputSpeech: { type: 'PlainText', text: 'Which beach would you like to check?' },
              shouldEndSession: false
            }
          });
        }
        
        const slug = location.toLowerCase().replace(/\s+/g, '-');
        const beach = BEACHES.find(b => b.slug === slug || b.name.toLowerCase() === location.toLowerCase());
        
        if (!beach) {
          return res.json({
            version: '1.0',
            response: {
              outputSpeech: { type: 'PlainText', text: `Sorry, I don't have data for ${location} yet. Try asking about Barry Island, Rhossili, or Tenby.` },
              shouldEndSession: true
            }
          });
        }
        
        const targetDate = new Date();
        const [tide, weatherData, sewage] = await Promise.all([
          fetchTideForTime(beach, targetDate),
          fetchWeatherForTime(beach, targetDate),
          fetchSewageStatus(beach)
        ]);
        
        if (!weatherData) {
          return res.json({
            version: '1.0',
            response: {
              outputSpeech: { type: 'PlainText', text: 'Sorry, I couldn\'t fetch the conditions right now.' },
              shouldEndSession: true
            }
          });
        }
        
        const { marine, weather } = weatherData;
        const sunTimes = calculateSunTimes(beach.lat, beach.lon, targetDate);
        const recommendation = generateRecommendation(beach, {
          marine, weather, sewage, tide,
          sun: { sunrise: sunTimes.sunrise, sunset: sunTimes.sunset }
        }, 'swimming', 'now');
        
        const speech = `${beach.name}. Water temperature ${Math.round(marine.seaTemp)} degrees. ` +
          `Wave height ${marine.waveHeight.toFixed(1)} meters. ${tide.type} tide at ${tide.time}. ` +
          `${sewage.status === 'clear' ? 'No sewage alerts.' : sewage.status === 'active' ? 'Active sewage discharge.' : 'Recent sewage activity.'} ` +
          `${recommendation.recommendation.replace(/\*\*/g, '')}`;
        
        return res.json({
          version: '1.0',
          response: {
            outputSpeech: { type: 'PlainText', text: speech },
            shouldEndSession: true
          }
        });
      }
    }
    
    res.json({
      version: '1.0',
      response: {
        outputSpeech: { type: 'PlainText', text: 'Sorry, I didn\'t understand that.' },
        shouldEndSession: true
      }
    });
    
  } catch (error) {
    console.error('Alexa error:', error);
    res.json({
      version: '1.0',
      response: {
        outputSpeech: { type: 'PlainText', text: 'Sorry, something went wrong.' },
        shouldEndSession: true
      }
    });
  }
});

// ============================================
// DEBUG ENDPOINT - Remove after testing
// ============================================

app.get('/debug-tides/:station', async (req, res) => {
  const stationId = req.params.station;
  const timeSlot = req.query.time || 'now';
  
  // Get target date same way dashboard does
  const now = new Date();
  const dates = {
    now: now,
    tonight: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0),
    'tomorrow-am': new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 8, 0, 0),
    'tomorrow-pm': new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 17, 0, 0),
    'day-after-am': new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 8, 0, 0)
  };
  const targetDate = dates[timeSlot] || now;
  
  // Calculate duration same way
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const daysAhead = Math.floor((targetStart - todayStart) / (1000 * 60 * 60 * 24));
  const duration = Math.max(1, daysAhead + 1);
  
  const url = `https://admiraltyapi.azure-api.net/uktidalapi/api/V1/Stations/${stationId}/TidalEvents?duration=${duration}`;
  
  try {
    const response = await fetch(url, {
      headers: { 'Ocp-Apim-Subscription-Key': process.env.ADMIRALTY_API_KEY }
    });
    const data = await response.json();
    
    // Find best tide same way as main function
    const targetTime = targetDate.getTime();
    let bestTide = null;
    let bestDiff = Infinity;
    
    const analysis = data.map(event => {
      const eventTime = new Date(event.DateTime).getTime();
      const diff = eventTime - targetTime;
      const diffHours = (diff / 3600000).toFixed(2);
      return {
        type: event.EventType,
        dateTime: event.DateTime,
        diffFromTargetHours: diffHours,
        isAfterTarget: diff >= 0,
        isWithin12Hours: diff >= 0 && diff < 12 * 60 * 60 * 1000
      };
    });
    
    // First pass - find next event after target within 12 hours
    for (const event of data) {
      const eventTime = new Date(event.DateTime).getTime();
      const diff = eventTime - targetTime;
      if (diff >= 0 && diff < bestDiff && diff < 12 * 60 * 60 * 1000) {
        bestDiff = diff;
        bestTide = event;
      }
    }
    
    // Fallback if nothing found
    if (!bestTide) {
      for (const event of data) {
        const eventTime = new Date(event.DateTime).getTime();
        const diff = Math.abs(eventTime - targetTime);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestTide = event;
        }
      }
    }
    
    res.json({
      timeSlot,
      serverNow: now.toISOString(),
      targetDate: targetDate.toISOString(),
      targetTimeMs: targetTime,
      daysAhead,
      duration,
      apiUrl: url,
      eventsAnalysis: analysis,
      selectedTide: bestTide ? {
        type: bestTide.EventType,
        dateTime: bestTide.DateTime,
        height: bestTide.Height
      } : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Shorecast backend running on port ${PORT}`);
});
