// ============================================
// SHORECAST BACKEND - Complete index.js
// ============================================
// Last Updated: 12 December 2025
// Deploy to: Render.com (free tier)
// Environment Variables Required: ADMIRALTY_API_KEY
// UPDATED: Enhanced weather integration throughout all recommendations

const express = require('express');
const cors = require('cors');
const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ============================================
// SIMPLE IN-MEMORY CACHE
// ============================================

const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCacheKey(beaches, mode, time) {
  return `${beaches.join(',')}-${mode}-${time}`;
}

function getFromCache(key) {
  const cached = cache.get(key);
  if (!cached) return null;
  
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_DURATION) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
  
  // Clean old entries every 100 requests
  if (cache.size > 100) {
    const now = Date.now();
    for (const [k, v] of cache.entries()) {
      if (now - v.timestamp > CACHE_DURATION) {
        cache.delete(k);
      }
    }
  }
}

// ============================================
// SEWAGE OVERFLOW CONTEXT DEFINITIONS
// ============================================

const OVERFLOW_CONTEXTS = {
  // Urban frequent - 24hr clearance
  frequent: {
    clearanceHours: 24,
    description: 'urban beach with regular monitored discharges',
    messageGreen: 'discharge yesterday. urban beach with UV treatment and regular testing - water quality rated excellent',
    messageAmber: 'discharge earlier today. water clearing. this beach has frequent overflows but good treatment systems'
  },
  
  // Moderate - 36hr clearance  
  moderate: {
    clearanceHours: 36,
    description: 'popular beach with occasional discharges',
    messageGreen: 'discharge clearing. popular beach with monitoring',
    messageAmber: 'recent discharge. check again in a few hours if concerned'
  },
  
  // Remote rare - 48hr clearance
  rare: {
    clearanceHours: 48,
    description: 'remote beach where overflows are unusual',
    messageGreen: 'discharge 24-48 hours ago. being cautious as this beach rarely has overflows',
    messageAmber: 'unusual discharge for this remote beach. recommend waiting 48 hours'
  }
};

// ============================================
// BEACH DATABASE - CORRECTED TIDAL STATIONS
// ============================================

const BEACHES = [
  // ANGLESEY
  { slug: 'benllech', name: 'Benllech', location: 'Anglesey', lat: 53.319, lon: -4.225, facing: 'east', stationId: '0476A', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'lligwy', name: 'Lligwy Bay', location: 'Anglesey', lat: 53.341, lon: -4.241, facing: 'northeast', stationId: '0476A', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'trearddur-bay', name: 'Trearddur Bay', location: 'Anglesey', lat: 53.267, lon: -4.617, facing: 'southwest', stationId: '0479', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'rhosneigr', name: 'Rhosneigr', location: 'Anglesey', lat: 53.228, lon: -4.508, facing: 'southwest', stationId: '0479A', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'newborough', name: 'Newborough Beach', location: 'Anglesey', lat: 53.142, lon: -4.378, facing: 'southwest', stationId: '0480', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'llanddwyn', name: 'Llanddwyn Beach', location: 'Anglesey', lat: 53.1414, lon: -4.4303, facing: 'southwest', stationId: '0480', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'aberffraw', name: 'Aberffraw', location: 'Anglesey', lat: 53.191, lon: -4.463, facing: 'west', stationId: '0479A', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'cemaes', name: 'Cemaes Bay', location: 'Anglesey', lat: 53.414, lon: -4.448, facing: 'north', stationId: '0477A', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },

  // LLŶN PENINSULA
  { slug: 'nefyn', name: 'Nefyn', location: 'Llŷn Peninsula', lat: 52.939, lon: -4.524, facing: 'north', stationId: '0481', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'porth-dinllaen', name: 'Porth Dinllaen', location: 'Llŷn Peninsula', lat: 52.943, lon: -4.564, facing: 'north', stationId: '0481', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'porth-oer', name: 'Porth Oer (Whistling Sands)', location: 'Llŷn Peninsula', lat: 52.878, lon: -4.681, facing: 'northwest', stationId: '0481A', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'aberdaron', name: 'Aberdaron', location: 'Llŷn Peninsula', lat: 52.804, lon: -4.713, facing: 'southwest', stationId: '0482A', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'abersoch', name: 'Abersoch', location: 'Llŷn Peninsula', lat: 52.822, lon: -4.498, facing: 'south', stationId: '0482B', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'pwllheli', name: 'Pwllheli', location: 'Llŷn Peninsula', lat: 52.887, lon: -4.398, facing: 'south', stationId: '0483', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'criccieth', name: 'Criccieth', location: 'Llŷn Peninsula', lat: 52.918, lon: -4.232, facing: 'south', stationId: '0483A', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },

  // CARDIGAN BAY - NORTH (SNOWDONIA COAST)
  { slug: 'black-rock-sands', name: 'Black Rock Sands', location: 'Porthmadog', lat: 52.901, lon: -4.171, facing: 'southwest', stationId: '0484', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'harlech', name: 'Harlech Beach', location: 'Gwynedd', lat: 52.858, lon: -4.109, facing: 'west', stationId: '0484', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'barmouth', name: 'Barmouth', location: 'Gwynedd', lat: 52.722, lon: -4.055, facing: 'west', stationId: '0485', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'fairbourne', name: 'Fairbourne', location: 'Gwynedd', lat: 52.697, lon: -4.047, facing: 'west', stationId: '0485', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'tywyn', name: 'Tywyn', location: 'Gwynedd', lat: 52.586, lon: -4.085, facing: 'west', stationId: '0486', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'aberdovey', name: 'Aberdovey', location: 'Gwynedd', lat: 52.544, lon: -4.057, facing: 'west', stationId: '0486', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'borth', name: 'Borth', location: 'Ceredigion', lat: 52.491, lon: -4.051, facing: 'west', stationId: '0486', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },

  // CEREDIGION
  { slug: 'aberystwyth', name: 'Aberystwyth', location: 'Ceredigion', lat: 52.416, lon: -4.085, facing: 'west', stationId: '0487', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'aberaeron', name: 'Aberaeron', location: 'Ceredigion', lat: 52.243, lon: -4.259, facing: 'west', stationId: '0488', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'new-quay', name: 'New Quay', location: 'Ceredigion', lat: 52.215, lon: -4.356, facing: 'northwest', stationId: '0488', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'llangrannog', name: 'Llangrannog', location: 'Ceredigion', lat: 52.159, lon: -4.472, facing: 'northwest', stationId: '0488', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'penbryn', name: 'Penbryn', location: 'Ceredigion', lat: 52.144, lon: -4.504, facing: 'west', stationId: '0488A', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'tresaith', name: 'Tresaith', location: 'Ceredigion', lat: 52.138, lon: -4.527, facing: 'west', stationId: '0488A', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'aberporth', name: 'Aberporth', location: 'Ceredigion', lat: 52.133, lon: -4.543, facing: 'west', stationId: '0488A', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'mwnt', name: 'Mwnt', location: 'Ceredigion', lat: 52.130, lon: -4.628, facing: 'northwest', stationId: '0489', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'poppit-sands', name: 'Poppit Sands', location: 'Pembrokeshire', lat: 52.102, lon: -4.680, facing: 'north', stationId: '0489', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },

  // PEMBROKESHIRE - NORTH
  { slug: 'newport-sands', name: 'Newport Sands', location: 'Pembrokeshire', lat: 52.033, lon: -4.865, facing: 'north', stationId: '0490', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'pwllgwaelod', name: 'Pwllgwaelod (Dinas Island)', location: 'Pembrokeshire', lat: 52.018, lon: -4.908, facing: 'north', stationId: '0490', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'fishguard', name: 'Fishguard', location: 'Pembrokeshire', lat: 52.012, lon: -4.973, facing: 'north', stationId: '0490', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'abercastle', name: 'Abercastle', location: 'Pembrokeshire', lat: 51.962, lon: -5.131, facing: 'north', stationId: '0491', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'abereiddy', name: 'Abereiddy', location: 'Pembrokeshire', lat: 51.934, lon: -5.203, facing: 'west', stationId: '0491', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },

  // PEMBROKESHIRE - ST DAVIDS PENINSULA
  { slug: 'whitesands', name: 'Whitesands Bay', location: 'Pembrokeshire', lat: 51.897, lon: -5.296, facing: 'west', stationId: '0492', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'porthselau', name: 'Porthselau', location: 'Pembrokeshire', lat: 51.878, lon: -5.274, facing: 'southwest', stationId: '0492', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'solva', name: 'Solva', location: 'Pembrokeshire', lat: 51.867, lon: -5.185, facing: 'south', stationId: '0492A', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'newgale', name: 'Newgale', location: 'Pembrokeshire', lat: 51.838, lon: -5.118, facing: 'west', stationId: '0492B', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'druidston', name: 'Druidston Haven', location: 'Pembrokeshire', lat: 51.800, lon: -5.111, facing: 'west', stationId: '0492B', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'broad-haven-north', name: 'Broad Haven', location: 'Pembrokeshire', lat: 51.781, lon: -5.108, facing: 'west', stationId: '0492B', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'little-haven', name: 'Little Haven', location: 'Pembrokeshire', lat: 51.766, lon: -5.109, facing: 'west', stationId: '0492B', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },

  // PEMBROKESHIRE - MARLOES & DALE
  { slug: 'marloes', name: 'Marloes Sands', location: 'Pembrokeshire', lat: 51.730, lon: -5.221, facing: 'southwest', stationId: '0493', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'martins-haven', name: "Martin's Haven", location: 'Pembrokeshire', lat: 51.733, lon: -5.249, facing: 'west', stationId: '0493', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'westdale', name: 'Westdale Bay', location: 'Pembrokeshire', lat: 51.709, lon: -5.179, facing: 'west', stationId: '0495', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'dale', name: 'Dale', location: 'Pembrokeshire', lat: 51.702, lon: -5.154, facing: 'east', stationId: '0495', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },

  // PEMBROKESHIRE - SOUTH
  { slug: 'freshwater-west', name: 'Freshwater West', location: 'Pembrokeshire', lat: 51.653, lon: -5.065, facing: 'west', stationId: '0495', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'freshwater-east', name: 'Freshwater East', location: 'Pembrokeshire', lat: 51.642, lon: -4.874, facing: 'southeast', stationId: '0501', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'barafundle', name: 'Barafundle Bay', location: 'Pembrokeshire', lat: 51.627, lon: -4.917, facing: 'south', stationId: '0501', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'broad-haven-south', name: 'Broad Haven South', location: 'Pembrokeshire', lat: 51.620, lon: -4.935, facing: 'south', stationId: '0501', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'stackpole', name: 'Stackpole Quay', location: 'Pembrokeshire', lat: 51.622, lon: -4.899, facing: 'south', stationId: '0501', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'manorbier', name: 'Manorbier', location: 'Pembrokeshire', lat: 51.640, lon: -4.799, facing: 'south', stationId: '0502', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'lydstep', name: 'Lydstep Haven', location: 'Pembrokeshire', lat: 51.649, lon: -4.748, facing: 'south', stationId: '0502', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },

  // PEMBROKESHIRE - TENBY
  { slug: 'tenby-south', name: 'Tenby South Beach', location: 'Pembrokeshire', lat: 51.667, lon: -4.702, facing: 'south', stationId: '0502', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'tenby-north', name: 'Tenby North Beach', location: 'Pembrokeshire', lat: 51.675, lon: -4.696, facing: 'east', stationId: '0502', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'tenby-castle', name: 'Tenby Castle Beach', location: 'Pembrokeshire', lat: 51.672, lon: -4.699, facing: 'east', stationId: '0502', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'saundersfoot', name: 'Saundersfoot', location: 'Pembrokeshire', lat: 51.709, lon: -4.696, facing: 'east', stationId: '0502', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'wisemans-bridge', name: "Wiseman's Bridge", location: 'Pembrokeshire', lat: 51.720, lon: -4.711, facing: 'southeast', stationId: '0502', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'amroth', name: 'Amroth', location: 'Pembrokeshire', lat: 51.732, lon: -4.651, facing: 'south', stationId: '0502', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },

  // CARMARTHENSHIRE
  { slug: 'pendine', name: 'Pendine Sands', location: 'Carmarthenshire', lat: 51.762, lon: -4.543, facing: 'south', stationId: '0504', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'llansteffan', name: 'Llansteffan', location: 'Carmarthenshire', lat: 51.769, lon: -4.384, facing: 'south', stationId: '0504', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'cefn-sidan', name: 'Cefn Sidan', location: 'Carmarthenshire', lat: 51.706, lon: -4.293, facing: 'southwest', stationId: '0505', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'pembrey', name: 'Pembrey', location: 'Carmarthenshire', lat: 51.692, lon: -4.269, facing: 'south', stationId: '0505', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'burry-port', name: 'Burry Port', location: 'Carmarthenshire', lat: 51.683, lon: -4.250, facing: 'south', stationId: '0505', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'frequent' },

  // GOWER PENINSULA - CORRECTED
  { slug: 'rhossili', name: 'Rhossili', location: 'Gower Peninsula', lat: 51.568, lon: -4.291, facing: 'west', stationId: '0505', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'llangennith', name: 'Llangennith', location: 'Gower Peninsula', lat: 51.594, lon: -4.295, facing: 'west', stationId: '0505', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'blue-pool', name: 'Blue Pool Bay', location: 'Gower Peninsula', lat: 51.589, lon: -4.274, facing: 'west', stationId: '0505', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'broughton', name: 'Broughton Bay', location: 'Gower Peninsula', lat: 51.610, lon: -4.263, facing: 'northwest', stationId: '0505', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'port-eynon', name: 'Port Eynon', location: 'Gower Peninsula', lat: 51.542, lon: -4.210, facing: 'southwest', stationId: '0505', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'oxwich', name: 'Oxwich Bay', location: 'Gower Peninsula', lat: 51.552, lon: -4.150, facing: 'south', stationId: '0508', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'three-cliffs', name: 'Three Cliffs Bay', location: 'Gower Peninsula', lat: 51.565, lon: -4.110, facing: 'south', stationId: '0508', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'pobbles', name: 'Pobbles Bay', location: 'Gower Peninsula', lat: 51.563, lon: -4.095, facing: 'south', stationId: '0508', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'caswell', name: 'Caswell Bay', location: 'Gower Peninsula', lat: 51.570, lon: -4.030, facing: 'south', stationId: '0508', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'langland', name: 'Langland Bay', location: 'Gower Peninsula', lat: 51.568, lon: -4.009, facing: 'south', stationId: '0508', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'limeslade', name: 'Limeslade Bay', location: 'Gower Peninsula', lat: 51.567, lon: -3.983, facing: 'south', stationId: '0508', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'bracelet-bay', name: 'Bracelet Bay', location: 'Gower Peninsula', lat: 51.566, lon: -3.978, facing: 'south', stationId: '0508', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },

  // SWANSEA BAY
  { slug: 'swansea', name: 'Swansea Bay', location: 'Swansea', lat: 51.617, lon: -3.968, facing: 'south', stationId: '0509', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'frequent' },
  { slug: 'aberavon', name: 'Aberavon', location: 'Port Talbot', lat: 51.583, lon: -3.816, facing: 'southwest', stationId: '0510', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'frequent' },

  // SOUTH WALES - BRIDGEND TO CARDIFF
  { slug: 'porthcawl', name: 'Porthcawl (Coney Beach)', location: 'Bridgend', lat: 51.478, lon: -3.691, facing: 'south', stationId: '0512', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'frequent' },
  { slug: 'rest-bay', name: 'Rest Bay', location: 'Bridgend', lat: 51.491, lon: -3.718, facing: 'west', stationId: '0512', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'trecco-bay', name: 'Trecco Bay', location: 'Bridgend', lat: 51.4817, lon: -3.6972, facing: 'south', stationId: '0512', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'frequent' },
  { slug: 'pink-bay', name: 'Pink Bay (Sker)', location: 'Bridgend', lat: 51.504, lon: -3.748, facing: 'west', stationId: '0512', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'ogmore-by-sea', name: 'Ogmore-by-Sea', location: 'Vale of Glamorgan', lat: 51.460, lon: -3.635, facing: 'south', stationId: '0512', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'southerndown', name: 'Southerndown (Dunraven Bay)', location: 'Vale of Glamorgan', lat: 51.446, lon: -3.606, facing: 'south', stationId: '0512', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'nash-point', name: 'Nash Point', location: 'Vale of Glamorgan', lat: 51.403, lon: -3.562, facing: 'south', stationId: '0513', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  { slug: 'llantwit-major', name: 'Llantwit Major', location: 'Vale of Glamorgan', lat: 51.395, lon: -3.505, facing: 'south', stationId: '0513', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'barry-island', name: 'Barry Island', location: 'Vale of Glamorgan', lat: 51.390, lon: -3.273, facing: 'south', stationId: '0513', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'frequent' },
  { slug: 'whitmore-bay', name: 'Whitmore Bay', location: 'Vale of Glamorgan', lat: 51.388, lon: -3.263, facing: 'south', stationId: '0513', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'frequent' },
  { slug: 'cold-knap', name: 'Cold Knap', location: 'Vale of Glamorgan', lat: 51.400, lon: -3.281, facing: 'south', stationId: '0513', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'frequent' },
  { slug: 'penarth', name: 'Penarth', location: 'Vale of Glamorgan', lat: 51.431, lon: -3.172, facing: 'southeast', stationId: '0514', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'frequent' },

  // CORNWALL - SOUTH
  { slug: 'sennen', name: 'Sennen Cove', location: 'Cornwall', lat: 50.071, lon: -5.697, facing: 'west', stationId: '0548', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'rare' },
  { slug: 'porthcurno', name: 'Porthcurno', location: 'Cornwall', lat: 50.043, lon: -5.655, facing: 'south', stationId: '0002', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'rare' },
  { slug: 'porthchapel', name: 'Porthchapel', location: 'Cornwall', lat: 50.042, lon: -5.637, facing: 'south', stationId: '0002', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'rare' },
  { slug: 'lamorna', name: 'Lamorna Cove', location: 'Cornwall', lat: 50.059, lon: -5.567, facing: 'south', stationId: '0002', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'rare' },
  { slug: 'penzance', name: 'Penzance', location: 'Cornwall', lat: 50.116, lon: -5.533, facing: 'south', stationId: '0002', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'marazion', name: 'Marazion', location: 'Cornwall', lat: 50.125, lon: -5.469, facing: 'south', stationId: '0002', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'porthleven', name: 'Porthleven', location: 'Cornwall', lat: 50.085, lon: -5.316, facing: 'southwest', stationId: '0002A', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'kynance', name: 'Kynance Cove', location: 'Cornwall', lat: 49.975, lon: -5.232, facing: 'west', stationId: '0003', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'rare' },
  { slug: 'coverack', name: 'Coverack', location: 'Cornwall', lat: 50.024, lon: -5.096, facing: 'east', stationId: '0004', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'falmouth-gyllyngvase', name: 'Gyllyngvase Beach', location: 'Cornwall', lat: 50.143, lon: -5.070, facing: 'south', stationId: '0005', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'swanpool', name: 'Swanpool', location: 'Cornwall', lat: 50.139, lon: -5.080, facing: 'south', stationId: '0005', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'maenporth', name: 'Maenporth', location: 'Cornwall', lat: 50.127, lon: -5.094, facing: 'south', stationId: '0005', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'mevagissey', name: 'Mevagissey', location: 'Cornwall', lat: 50.269, lon: -4.787, facing: 'southeast', stationId: '0007', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'fowey', name: 'Fowey (Readymoney Cove)', location: 'Cornwall', lat: 50.331, lon: -4.635, facing: 'south', stationId: '0008', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'looe', name: 'Looe', location: 'Cornwall', lat: 50.353, lon: -4.452, facing: 'south', stationId: '0011', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'whitsand', name: 'Whitsand Bay', location: 'Cornwall', lat: 50.341, lon: -4.248, facing: 'south', stationId: '0012', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'rare' },

  // CORNWALL - NORTH
  { slug: 'porthmeor', name: "Porthmeor (St Ives)", location: 'Cornwall', lat: 50.217, lon: -5.483, facing: 'north', stationId: '0547', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'hayle', name: 'Hayle (Towans)', location: 'Cornwall', lat: 50.207, lon: -5.425, facing: 'north', stationId: '0547', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'gwithian', name: 'Gwithian', location: 'Cornwall', lat: 50.223, lon: -5.393, facing: 'north', stationId: '0547', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'perranporth', name: 'Perranporth', location: 'Cornwall', lat: 50.346, lon: -5.156, facing: 'west', stationId: '0546A', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'fistral', name: 'Fistral Beach', location: 'Newquay', lat: 50.416, lon: -5.104, facing: 'west', stationId: '0546', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'newquay-great-western', name: 'Great Western Beach', location: 'Newquay', lat: 50.415, lon: -5.081, facing: 'north', stationId: '0546', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'watergate-bay', name: 'Watergate Bay', location: 'Cornwall', lat: 50.446, lon: -5.045, facing: 'west', stationId: '0546', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'constantine', name: 'Constantine Bay', location: 'Cornwall', lat: 50.530, lon: -4.973, facing: 'west', stationId: '0545', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'rare' },
  { slug: 'harlyn', name: 'Harlyn Bay', location: 'Cornwall', lat: 50.548, lon: -4.935, facing: 'north', stationId: '0545', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'rare' },
  { slug: 'padstow', name: 'Padstow', location: 'Cornwall', lat: 50.541, lon: -4.936, facing: 'north', stationId: '0545', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'polzeath', name: 'Polzeath', location: 'Cornwall', lat: 50.573, lon: -4.915, facing: 'northwest', stationId: '0545', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'bude', name: 'Bude (Summerleaze)', location: 'Cornwall', lat: 50.832, lon: -4.553, facing: 'west', stationId: '0543', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },

  // DEVON
  { slug: 'woolacombe', name: 'Woolacombe', location: 'Devon', lat: 51.166, lon: -4.210, facing: 'west', stationId: '0535', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'croyde', name: 'Croyde Bay', location: 'Devon', lat: 51.134, lon: -4.236, facing: 'west', stationId: '0535', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'saunton-sands', name: 'Saunton Sands', location: 'Devon', lat: 51.113, lon: -4.224, facing: 'west', stationId: '0537', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'westward-ho', name: 'Westward Ho!', location: 'Devon', lat: 51.039, lon: -4.235, facing: 'northwest', stationId: '0536', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'salcombe', name: 'Salcombe (North Sands)', location: 'Devon', lat: 50.230, lon: -3.773, facing: 'south', stationId: '0020', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'bantham', name: 'Bantham', location: 'Devon', lat: 50.277, lon: -3.867, facing: 'southwest', stationId: '0020', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'rare' },
  { slug: 'dartmouth', name: 'Dartmouth (Castle Cove)', location: 'Devon', lat: 50.345, lon: -3.575, facing: 'east', stationId: '0023', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'blackpool-sands', name: 'Blackpool Sands', location: 'Devon', lat: 50.310, lon: -3.611, facing: 'east', stationId: '0023', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'rare' },
  { slug: 'torquay', name: 'Torquay (Meadfoot Beach)', location: 'Devon', lat: 50.458, lon: -3.512, facing: 'east', stationId: '0025', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'oddicombe', name: 'Oddicombe', location: 'Devon', lat: 50.475, lon: -3.510, facing: 'east', stationId: '0025', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'paignton', name: 'Paignton', location: 'Devon', lat: 50.4361, lon: -3.5619, facing: 'east', stationId: '0025', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'frequent' },
  { slug: 'teignmouth', name: 'Teignmouth', location: 'Devon', lat: 50.543, lon: -3.500, facing: 'east', stationId: '0026', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'dawlish', name: 'Dawlish', location: 'Devon', lat: 50.580, lon: -3.467, facing: 'east', stationId: '0026', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'exmouth', name: 'Exmouth', location: 'Devon', lat: 50.614, lon: -3.407, facing: 'south', stationId: '0027', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'sidmouth', name: 'Sidmouth', location: 'Devon', lat: 50.677, lon: -3.239, facing: 'south', stationId: '0027', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },
  { slug: 'seaton', name: 'Seaton', location: 'Devon', lat: 50.704, lon: -3.072, facing: 'south', stationId: '0028', region: 'england', company: 'south-west-water', companyName: 'South West Water', overflowContext: 'moderate' },

  // DORSET
  { slug: 'lyme-regis', name: 'Lyme Regis', location: 'Dorset', lat: 50.720, lon: -2.938, facing: 'south', stationId: '0028', region: 'england', company: 'wessex-water', companyName: 'Wessex Water', overflowContext: 'moderate' },
  { slug: 'charmouth', name: 'Charmouth', location: 'Dorset', lat: 50.733, lon: -2.905, facing: 'south', stationId: '0028', region: 'england', company: 'wessex-water', companyName: 'Wessex Water', overflowContext: 'moderate' },
  { slug: 'west-bay', name: 'West Bay', location: 'Dorset', lat: 50.710, lon: -2.762, facing: 'south', stationId: '0029', region: 'england', company: 'wessex-water', companyName: 'Wessex Water', overflowContext: 'moderate' },
  { slug: 'chesil-beach', name: 'Chesil Beach', location: 'Dorset', lat: 50.617, lon: -2.548, facing: 'south', stationId: '0030', region: 'england', company: 'wessex-water', companyName: 'Wessex Water', overflowContext: 'rare' },
  { slug: 'weymouth', name: 'Weymouth', location: 'Dorset', lat: 50.608, lon: -2.454, facing: 'south', stationId: '0033', region: 'england', company: 'wessex-water', companyName: 'Wessex Water', overflowContext: 'frequent' },
  { slug: 'lulworth-cove', name: 'Lulworth Cove', location: 'Dorset', lat: 50.619, lon: -2.249, facing: 'south', stationId: '0034', region: 'england', company: 'wessex-water', companyName: 'Wessex Water', overflowContext: 'rare' },
  { slug: 'durdle-door', name: 'Durdle Door', location: 'Dorset', lat: 50.622, lon: -2.276, facing: 'south', stationId: '0034', region: 'england', company: 'wessex-water', companyName: 'Wessex Water', overflowContext: 'rare' },
  { slug: 'swanage', name: 'Swanage', location: 'Dorset', lat: 50.610, lon: -1.953, facing: 'east', stationId: '0035', region: 'england', company: 'wessex-water', companyName: 'Wessex Water', overflowContext: 'moderate' },
  { slug: 'studland', name: 'Studland Bay', location: 'Dorset', lat: 50.652, lon: -1.935, facing: 'east', stationId: '0036', region: 'england', company: 'wessex-water', companyName: 'Wessex Water', overflowContext: 'rare' },
  { slug: 'sandbanks', name: 'Sandbanks', location: 'Dorset', lat: 50.688, lon: -1.945, facing: 'east', stationId: '0036', region: 'england', company: 'wessex-water', companyName: 'Wessex Water', overflowContext: 'moderate' },
  { slug: 'bournemouth', name: 'Bournemouth', location: 'Dorset', lat: 50.716, lon: -1.874, facing: 'south', stationId: '0037', region: 'england', company: 'wessex-water', companyName: 'Wessex Water', overflowContext: 'frequent' },
  { slug: 'boscombe', name: 'Boscombe', location: 'Dorset', lat: 50.718, lon: -1.842, facing: 'south', stationId: '0037', region: 'england', company: 'wessex-water', companyName: 'Wessex Water', overflowContext: 'frequent' },

  // HAMPSHIRE / ISLE OF WIGHT
  { slug: 'christchurch', name: 'Christchurch (Avon Beach)', location: 'Dorset', lat: 50.727, lon: -1.750, facing: 'south', stationId: '0038', region: 'england', company: 'wessex-water', companyName: 'Wessex Water', overflowContext: 'moderate' },
  { slug: 'highcliffe', name: 'Highcliffe', location: 'Hampshire', lat: 50.733, lon: -1.719, facing: 'south', stationId: '0038', region: 'england', company: 'southern-water', companyName: 'Southern Water', overflowContext: 'moderate' },
  { slug: 'milford-on-sea', name: 'Milford on Sea', location: 'Hampshire', lat: 50.722, lon: -1.593, facing: 'south', stationId: '0039', region: 'england', company: 'southern-water', companyName: 'Southern Water', overflowContext: 'moderate' },
  { slug: 'ventnor', name: 'Ventnor', location: 'Isle of Wight', lat: 50.593, lon: -1.202, facing: 'south', stationId: '0051', region: 'england', company: 'southern-water', companyName: 'Southern Water', overflowContext: 'moderate' },
  { slug: 'shanklin', name: 'Shanklin', location: 'Isle of Wight', lat: 50.631, lon: -1.178, facing: 'east', stationId: '0053', region: 'england', company: 'southern-water', companyName: 'Southern Water', overflowContext: 'moderate' },
  { slug: 'sandown', name: 'Sandown', location: 'Isle of Wight', lat: 50.654, lon: -1.152, facing: 'east', stationId: '0053', region: 'england', company: 'southern-water', companyName: 'Southern Water', overflowContext: 'moderate' },
  { slug: 'freshwater-bay-iow', name: 'Freshwater Bay', location: 'Isle of Wight', lat: 50.667, lon: -1.518, facing: 'southwest', stationId: '0048', region: 'england', company: 'southern-water', companyName: 'Southern Water', overflowContext: 'rare' },
  { slug: 'ryde', name: 'Ryde', location: 'Isle of Wight', lat: 50.735, lon: -1.162, facing: 'north', stationId: '0058', region: 'england', company: 'southern-water', companyName: 'Southern Water', overflowContext: 'moderate' },

  // SUSSEX
  { slug: 'west-wittering', name: 'West Wittering', location: 'West Sussex', lat: 50.772, lon: -0.885, facing: 'south', stationId: '0068', region: 'england', company: 'southern-water', companyName: 'Southern Water', overflowContext: 'moderate' },
  { slug: 'bracklesham', name: 'Bracklesham', location: 'West Sussex', lat: 50.770, lon: -0.849, facing: 'south', stationId: '0069', region: 'england', company: 'southern-water', companyName: 'Southern Water', overflowContext: 'moderate' },
  { slug: 'bognor-regis', name: 'Bognor Regis', location: 'West Sussex', lat: 50.781, lon: -0.677, facing: 'south', stationId: '0073', region: 'england', company: 'southern-water', companyName: 'Southern Water', overflowContext: 'frequent' },
  { slug: 'littlehampton', name: 'Littlehampton', location: 'West Sussex', lat: 50.800, lon: -0.548, facing: 'south', stationId: '0074', region: 'england', company: 'southern-water', companyName: 'Southern Water', overflowContext: 'moderate' },
  { slug: 'worthing', name: 'Worthing', location: 'West Sussex', lat: 50.808, lon: -0.372, facing: 'south', stationId: '0075', region: 'england', company: 'southern-water', companyName: 'Southern Water', overflowContext: 'frequent' },
  { slug: 'shoreham', name: 'Shoreham-by-Sea', location: 'West Sussex', lat: 50.828, lon: -0.271, facing: 'south', stationId: '0081', region: 'england', company: 'southern-water', companyName: 'Southern Water', overflowContext: 'moderate' },
  { slug: 'hove', name: 'Hove', location: 'East Sussex', lat: 50.824, lon: -0.170, facing: 'south', stationId: '0082', region: 'england', company: 'southern-water', companyName: 'Southern Water', overflowContext: 'frequent' },
  { slug: 'brighton', name: 'Brighton Beach', location: 'East Sussex', lat: 50.819, lon: -0.137, facing: 'south', stationId: '0082', region: 'england', company: 'southern-water', companyName: 'Southern Water', overflowContext: 'frequent' },
  { slug: 'saltdean', name: 'Saltdean', location: 'East Sussex', lat: 50.800, lon: -0.038, facing: 'south', stationId: '0082', region: 'england', company: 'southern-water', companyName: 'Southern Water', overflowContext: 'moderate' },
  { slug: 'newhaven', name: 'Newhaven', location: 'East Sussex', lat: 50.783, lon: 0.051, facing: 'south', stationId: '0083', region: 'england', company: 'southern-water', companyName: 'Southern Water', overflowContext: 'moderate' },
  { slug: 'seaford', name: 'Seaford', location: 'East Sussex', lat: 50.771, lon: 0.103, facing: 'south', stationId: '0083', region: 'england', company: 'southern-water', companyName: 'Southern Water', overflowContext: 'moderate' },
  { slug: 'birling-gap', name: 'Birling Gap', location: 'East Sussex', lat: 50.744, lon: 0.202, facing: 'south', stationId: '0084', region: 'england', company: 'southern-water', companyName: 'Southern Water', overflowContext: 'rare' },
  { slug: 'eastbourne', name: 'Eastbourne', location: 'East Sussex', lat: 50.766, lon: 0.290, facing: 'south', stationId: '0084', region: 'england', company: 'southern-water', companyName: 'Southern Water', overflowContext: 'moderate' },
  { slug: 'bexhill', name: 'Bexhill-on-Sea', location: 'East Sussex', lat: 50.837, lon: 0.475, facing: 'south', stationId: '0085', region: 'england', company: 'southern-water', companyName: 'Southern Water', overflowContext: 'moderate' },
  { slug: 'hastings', name: 'Hastings', location: 'East Sussex', lat: 50.853, lon: 0.589, facing: 'south', stationId: '0085', region: 'england', company: 'southern-water', companyName: 'Southern Water', overflowContext: 'moderate' },
  { slug: 'camber', name: 'Camber Sands', location: 'East Sussex', lat: 50.932, lon: 0.805, facing: 'south', stationId: '0086', region: 'england', company: 'southern-water', companyName: 'Southern Water', overflowContext: 'rare' },
];

// ============================================
// DYNAMIC TIME SLOTS
// ============================================

function getAvailableTimeSlots() {
  const now = new Date();
  const hour = now.getHours();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dayAfter = new Date(now);
  dayAfter.setDate(dayAfter.getDate() + 2);
  
  const nowTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
  
  if (hour >= 18) {
    return [
      { id: 'now', label: 'right now', time: nowTime },
      { id: 'tomorrow-am', label: 'tomorrow am', time: '08:00' },
      { id: 'tomorrow-pm', label: 'tomorrow pm', time: '17:00' },
      { id: 'day-after-am', label: days[dayAfter.getDay()], time: '08:00' }
    ];
  }
  
  return [
    { id: 'now', label: 'right now', time: nowTime },
    { id: 'tonight', label: 'tonight', time: '20:00' },
    { id: 'tomorrow-am', label: 'tomorrow am', time: '08:00' },
    { id: 'tomorrow-pm', label: 'tomorrow pm', time: '17:00' },
    { id: 'day-after-am', label: days[dayAfter.getDay()], time: '08:00' }
  ];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getDateForTimeSlot(timeSlot) {
  const now = new Date();
  const hour = now.getHours();
  
  const dates = {
    now: now,
    tonight: (() => {
      const tonightDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);
      if (hour >= 20) {
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
  const targetDate = getDateForTimeSlot(timeSlot);
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const labels = {
    now: 'right now',
    tonight: 'tonight',
    'tomorrow-am': 'tomorrow morning',
    'tomorrow-pm': 'tomorrow evening',
    'day-after-am': `${days[targetDate.getDay()]} morning`
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
  return Math.round(13.12 + 0.6215 * airTemp - 11.37 * Math.pow(windSpeed, 0.16) + 0.3965 * airTemp * Math.pow(windSpeed, 0.16));
}

// ============================================
// API FETCH FUNCTIONS
// ============================================

async function fetchTideForTime(beach, targetDate) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const daysAhead = Math.floor((targetStart - todayStart) / (1000 * 60 * 60 * 24));
  const duration = Math.max(2, daysAhead + 2);
  const url = `https://admiraltyapi.azure-api.net/uktidalapi/api/V1/Stations/${beach.stationId}/TidalEvents?duration=${duration}`;
  
  try {
    const response = await fetch(url, {
      headers: { 'Ocp-Apim-Subscription-Key': process.env.ADMIRALTY_API_KEY }
    });
    const data = await response.json();
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn(`No tide data for station ${beach.stationId}`);
      return { high: { time: '—', height: null }, low: { time: '—', height: null } };
    }
    
    const targetTime = targetDate.getTime();
    
    const highTides = data.filter(e => (e.EventType || '').toLowerCase().includes('high'));
    const lowTides = data.filter(e => (e.EventType || '').toLowerCase().includes('low'));
    
    const findClosest = (tides) => {
      if (!tides || tides.length === 0) return null;
      let closest = null;
      let closestDiff = Infinity;
      for (const tide of tides) {
        const tideTime = new Date(tide.DateTime).getTime();
        const diff = Math.abs(tideTime - targetTime);
        if (diff < closestDiff) {
          closestDiff = diff;
          closest = tide;
        }
      }
      return closest;
    };
    
    const closestHigh = findClosest(highTides);
    const closestLow = findClosest(lowTides);
    
    const formatTide = (tide) => {
      if (!tide) return { time: '—', height: null };
      return {
        time: new Date(tide.DateTime).toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit', 
          timeZone: 'Europe/London' 
        }),
        height: tide.Height
      };
    };
    
    return {
      high: formatTide(closestHigh),
      low: formatTide(closestLow)
    };
  } catch (err) {
    console.warn('Tide fetch failed:', err.message);
  }
  return { high: { time: '—', height: null }, low: { time: '—', height: null } };
}

async function fetchWeatherForTime(beach, targetDate) {
  const dateStr = targetDate.toISOString().split('T')[0];
  const hour = targetDate.getHours();
  const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${beach.lat}&longitude=${beach.lon}&hourly=wave_height,swell_wave_height,wave_period,ocean_current_velocity,sea_surface_temperature&start_date=${dateStr}&end_date=${dateStr}`;
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${beach.lat}&longitude=${beach.lon}&hourly=temperature_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,uv_index,cloud_cover,precipitation,weather_code&start_date=${dateStr}&end_date=${dateStr}`;
  
  try {
    const [marineRes, weatherRes] = await Promise.all([fetch(marineUrl), fetch(weatherUrl)]);
    const marine = await marineRes.json();
    const weather = await weatherRes.json();
    
    return {
      marine: {
        seaTemp: marine.hourly?.sea_surface_temperature?.[hour] || null,
        waveHeight: marine.hourly?.wave_height?.[hour] || 0,
        swellHeight: marine.hourly?.swell_wave_height?.[hour] || 0,
        wavePeriod: marine.hourly?.wave_period?.[hour] || null
      },
      weather: {
        airTemp: weather.hourly?.temperature_2m?.[hour] || null,
        feelsLike: weather.hourly?.apparent_temperature?.[hour] || null,
        windSpeed: weather.hourly?.wind_speed_10m?.[hour] || 0,
        windDirection: weather.hourly?.wind_direction_10m?.[hour] || null,
        uvIndex: weather.hourly?.uv_index?.[hour] || 0,
        cloudCover: weather.hourly?.cloud_cover?.[hour] || 0,
        precipitation: weather.hourly?.precipitation?.[hour] || 0,
        weatherCode: weather.hourly?.weather_code?.[hour] || null
      }
    };
  } catch (err) {
    console.warn('Weather fetch failed:', err.message);
    return null;
  }
}

async function fetchSewageStatus(beach) {
  try {
    if (beach.company === 'welsh-water') {
      const url = `https://services3.arcgis.com/KLNF7YxtENPLYVey/arcgis/rest/services/Spill_Prod__view/FeatureServer/0/query?where=1%3D1&outFields=*&f=json&returnGeometry=false`;
      const response = await fetch(url);
      const data = await response.json();
      
      const nearby = data.features?.find(f => {
        const dist = Math.sqrt(Math.pow((f.attributes.Y || 0) - beach.lat, 2) + Math.pow((f.attributes.X || 0) - beach.lon, 2));
        return dist < 0.05;
      });
      
      if (nearby) {
        const status = (nearby.attributes.status || '').toLowerCase();
        
        if (status.includes('operating') || status.includes('discharging') || status.includes('spilling')) {
          return { status: 'active', icon: '✗', source: 'Welsh Water' };
        }
        
        const stopTime = nearby.attributes.stop_date_time_discharge;
        if (stopTime) {
          const hoursSince = (Date.now() - new Date(stopTime)) / 3600000;
          
          const overflowContext = beach.overflowContext || 'moderate';
          const clearanceWindow = OVERFLOW_CONTEXTS[overflowContext].clearanceHours;
          
          if (hoursSince < clearanceWindow) {
            return { 
              status: 'recent', 
              icon: '!', 
              source: 'Welsh Water',
              context: overflowContext,
              hoursSince: Math.round(hoursSince),
              message: hoursSince < 24 
                ? OVERFLOW_CONTEXTS[overflowContext].messageAmber 
                : OVERFLOW_CONTEXTS[overflowContext].messageGreen
            };
          }
        }
      }
      return { status: 'clear', icon: '✓', source: 'Welsh Water' };
    }
    return { status: 'clear', icon: '✓', source: beach.companyName };
  } catch (err) {
    console.warn('Sewage fetch failed:', err.message);
    return { status: 'unknown', icon: '?', source: beach.companyName };
  }
}

// ============================================
// RECOMMENDATION ENGINE - ENHANCED WEATHER
// ============================================

function generateRecommendation(beach, conditions, mode, timeSlot) {
  const { marine, weather, sewage, tide, sun } = conditions;
  let status = 'green';
  let statusText = 'great';
  let parts = [];
  
  // Enhanced weather state descriptions
  const getWeatherState = () => {
    if (weather.precipitation > 2) return 'heavy rain forecast';
    if (weather.precipitation > 0.5) return 'light rain expected';
    if (weather.cloudCover < 20) return 'clear skies';
    if (weather.cloudCover < 50) return 'partly cloudy';
    if (weather.cloudCover < 80) return 'mostly cloudy';
    return 'overcast conditions';
  };
  
  // Sunrise/sunset visibility context
  const getSunVisibility = () => {
    const isMorning = timeSlot === 'now' && new Date().getHours() < 9 || timeSlot === 'tomorrow-am' || timeSlot === 'day-after-am';
    const isEvening = timeSlot === 'tonight' || timeSlot === 'tomorrow-pm';
    
    if (isMorning && sun) {
      if (weather.cloudCover < 20) {
        return `sunrise at ${sun.sunrise} will be spectacular`;
      } else if (weather.cloudCover > 70) {
        return `sunrise at ${sun.sunrise} hidden by cloud`;
      } else {
        return `sunrise at ${sun.sunrise}`;
      }
    }
    
    if (isEvening && sun && ['west', 'northwest', 'southwest'].includes(beach.facing)) {
      if (weather.cloudCover < 20) {
        return `sunset at ${sun.sunset} looking golden`;
      } else if (weather.cloudCover > 70) {
        return `sunset at ${sun.sunset} will be muted`;
      } else {
        return `sunset at ${sun.sunset}`;
      }
    }
    
    return null;
  };
  
  const weatherState = getWeatherState();
  const sunVisibility = getSunVisibility();
  const isClear = weather.cloudCover < 30;
  const isMorningForecast = timeSlot === 'tomorrow-am' || timeSlot === 'day-after-am';
  const isEveningForecast = timeSlot === 'tonight' || timeSlot === 'tomorrow-pm';
  
  if (mode === 'swimming') {
    if (sewage.status === 'active') {
      const weatherNote = weather.precipitation > 2 ? `${weatherState}.` : weatherState;
      return { status: 'red', statusText: 'avoid', recommendation: `**active sewage discharge.** swimming not recommended. ${weatherNote}. try a nearby beach instead.` };
    }
    
    if (marine.waveHeight > 2) {
      const weatherNote = weather.precipitation > 1 ? `${weatherState} making conditions worse.` : `${weatherState}.`;
      return { status: 'red', statusText: 'rough', recommendation: `**very rough seas** at ${marine.waveHeight.toFixed(1)}m waves. ${weatherNote} dangerous conditions.` };
    }
    
    if (sewage.status === 'recent') {
      status = 'amber'; 
      statusText = 'check';
      
      if (sewage.message) {
        parts.push(`**${sewage.message}**`);
      } else {
        parts.push('**sewage discharge ended 24-48 hours ago.** water should be clear but some prefer to wait.');
      }
      
      parts.push(weatherState);
      
      if (marine.waveHeight >= 1) {
        parts.push(`choppy at ${marine.waveHeight.toFixed(1)}m`);
      }
      
      if (weather.windSpeed > 25) {
        parts.push(`wind at ${Math.round(weather.windSpeed)}km/h`);
      }
    } else if (marine.waveHeight >= 1.5) {
      status = 'amber';
      statusText = 'choppy';
      parts.push(`**choppy conditions** at ${marine.waveHeight.toFixed(1)}m waves.`);
      parts.push(weatherState);
      
      if (sunVisibility) {
        parts.push(sunVisibility);
      }
      
      if (weather.windSpeed > 20) {
        parts.push(`wind at ${Math.round(weather.windSpeed)}km/h - find shelter for changing`);
      }
    } else if (weather.windSpeed > 40) {
      status = 'amber';
      statusText = 'windy';
      parts.push(`**strong winds** at ${Math.round(weather.windSpeed)}km/h.`);
      parts.push(weatherState);
      parts.push('experienced swimmers only');
    } else {
      // GREEN status - perfect conditions
      status = 'green';
      statusText = 'excellent';
      
      if (marine.waveHeight < 0.5) {
        parts.push(`**perfect conditions.** calm water like glass. ${weatherState}.`);
      } else if (marine.waveHeight < 1) {
        parts.push(`**lovely conditions.** gentle rolling waves. ${weatherState}.`);
      } else {
        parts.push(`**good swimming weather.** moderate swell. ${weatherState}.`);
      }
      
      // Add sunrise/sunset context
      if (sunVisibility) {
        parts.push(sunVisibility);
      }
      
      // Wind context
      if (weather.windSpeed < 10) {
        parts.push('barely any breeze');
      } else if (weather.windSpeed < 20) {
        parts.push('light breeze');
      } else if (weather.windSpeed < 30) {
        parts.push('moderate breeze - nothing to worry about');
      }
      
      // Sewage status
      if (sewage.status === 'clear') {
        parts.push('no sewage alerts');
      }
      
      // UV guidance
      if (weather.uvIndex >= 6) {
        parts.push(`UV high (${weather.uvIndex}) - definitely bring sun cream`);
      } else if (weather.uvIndex >= 3 && weather.cloudCover < 50) {
        parts.push(`UV moderate (${weather.uvIndex}) - sun cream recommended`);
      }
      
      // Tide timing
      if (tide.high.time && tide.high.time !== '—') {
        parts.push(`high tide ${tide.high.time}, low ${tide.low.time}`);
      }
      
      // Temperature notes
      if (marine.seaTemp && marine.seaTemp < 12) {
        parts.push(`water's ${Math.round(marine.seaTemp)}°C - bring warm layers for afterwards`);
      }
    }
  } else if (mode === 'dipping') {
    // DIPPING MODE
    if (sewage.status === 'active' || sewage.status === 'recent') {
      const weatherNote = weatherState;
      return { status: 'red', statusText: 'wait', recommendation: `**sewage discharge recently.** ${weatherNote}. wait 48 hours for dipping.` };
    }
    
    if (weather.feelsLike < 0) {
      const weatherNote = weather.precipitation > 1 ? `${weatherState} adding to the challenge.` : weatherState;
      return { status: 'red', statusText: 'dangerous', recommendation: `**severe hypothermia risk.** feels like ${Math.round(weather.feelsLike)}°C outside. ${weatherNote}. recovery will be brutal.` };
    }
    
    // Temperature assessment (inverted logic - colder is better)
    if (marine.seaTemp >= 13) {
      status = 'amber'; 
      statusText = 'mild';
      parts.push(`**${Math.round(marine.seaTemp)}°C - too mild for cold therapy.** ${weatherState}.`);
      
      parts.push('better for a longer, gentler dip');
    } else if (marine.seaTemp <= 8) {
      status = 'green'; 
      statusText = 'perfect';
      parts.push(`**pure winter magic.** water at ${Math.round(marine.seaTemp)}°C. ${weatherState}.`);
      
      if (sunVisibility) {
        parts.push(sunVisibility);
      }
      
      if (weather.windSpeed < 15) {
        parts.push('still conditions for getting changed');
      } else if (weather.windSpeed < 25) {
        parts.push('moderate breeze - find shelter');
      } else {
        parts.push(`wind at ${Math.round(weather.windSpeed)}km/h - you'll earn this one`);
      }
      
      if (weather.feelsLike < 5) {
        parts.push(`feels like ${Math.round(weather.feelsLike)}°C outside - warm layers essential for recovery. hot drink recommended`);
      }
      
      if (sewage.status === 'clear') {
        parts.push('water quality clear');
      }
      
      parts.push('safe time: 3-5 minutes');
    } else if (marine.seaTemp <= 10) {
      status = 'green'; 
      statusText = 'excellent';
      parts.push(`**crisp and clarifying.** ${Math.round(marine.seaTemp)}°C. ${weatherState}.`);
      
      if (sunVisibility) {
        parts.push(sunVisibility);
      }
      
      if (weather.windSpeed < 15) {
        parts.push('calm conditions');
      } else if (weather.windSpeed > 30) {
        parts.push(`wind at ${Math.round(weather.windSpeed)}km/h - breezy recovery`);
      }
      
      if (weather.feelsLike < 8) {
        parts.push(`feels like ${Math.round(weather.feelsLike)}°C - bring extra layers`);
      }
      
      parts.push('safe time: 5-10 minutes depending on your experience');
    } else {
      status = 'amber'; 
      statusText = 'mild';
      parts.push(`**gentle cold therapy.** ${Math.round(marine.seaTemp)}°C. ${weatherState}.`);
      
      if (sunVisibility) {
        parts.push(sunVisibility);
      }
      
      parts.push('still bracing, still good');
    }
  }
  
  let recommendation = parts.join(' ').replace(/\.\./g, '.').replace(/\. \./g, '.');
  if (!recommendation.endsWith('.')) recommendation += '.';
  return { status, statusText, recommendation };
}

// ============================================
// ROUTES
// ============================================

app.get('/', (req, res) => res.redirect('/conditions/barry-island'));

app.get('/locations', (req, res) => {
  res.json(BEACHES.map(b => ({ slug: b.slug, name: b.name, location: b.location, facing: b.facing, region: b.region })));
});

app.get('/conditions/:beach?', async (req, res) => {
  try {
    const slug = req.params.beach || 'barry-island';
    const mode = req.query.mode || 'swimming';
    const beach = BEACHES.find(b => b.slug === slug);
    if (!beach) return res.status(404).json({ error: 'Beach not found' });
    
    const targetDate = new Date();
    const [tide, weatherData, sewage] = await Promise.all([
      fetchTideForTime(beach, targetDate),
      fetchWeatherForTime(beach, targetDate),
      fetchSewageStatus(beach)
    ]);
    
    if (!weatherData) return res.status(500).json({ error: 'Failed to fetch weather data' });
    
    const { marine, weather } = weatherData;
    const feelsLike = weather.feelsLike || calculateFeelsLike(weather.airTemp, weather.windSpeed);
    const sunTimes = calculateSunTimes(beach.lat, beach.lon, targetDate);
    const recommendation = generateRecommendation(beach, { marine, weather: { ...weather, feelsLike }, sewage, tide, sun: sunTimes }, mode, 'now');
    
    res.json({ beach: beach.name, location: beach.location, mode, seaTemp: marine.seaTemp, waveHeight: marine.waveHeight, tide: { high: tide.high.time, low: tide.low.time }, airTemp: weather.airTemp, feelsLike, windSpeed: weather.windSpeed, uvIndex: weather.uvIndex, sewage, sunrise: sunTimes.sunrise, sunset: sunTimes.sunset, recommendation });
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
    
    if (!['swimming', 'dipping'].includes(mode)) return res.status(400).json({ error: 'Invalid mode' });
    
    const validTimes = ['now', 'tonight', 'tomorrow-am', 'tomorrow-pm', 'day-after-am'];
    if (!validTimes.includes(timeSlot)) return res.status(400).json({ error: 'Invalid time' });
    
    // Check cache first
    const cacheKey = getCacheKey(beachSlugs, mode, timeSlot);
    const cached = getFromCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    const targetDate = getDateForTimeSlot(timeSlot);
    const isForecast = timeSlot !== 'now';
    
    const beachesData = await Promise.all(beachSlugs.map(async (slug) => {
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
      const recommendation = generateRecommendation(beach, { marine, weather: { ...weather, feelsLike }, sewage, tide, sun: sunTimes }, mode, timeSlot);
      
      return {
        name: beach.name, slug: beach.slug, location: beach.location, facing: beach.facing,
        seaTempDisplay: marine.seaTemp ? `${Math.round(marine.seaTemp)}°C` : '—',
        waves: mode === 'swimming' ? { heightDisplay: marine.waveHeight ? `${marine.waveHeight.toFixed(1)}m` : '—' } : null,
        tide: { high: tide.high.time, low: tide.low.time },
        weather: { airTempDisplay: `${Math.round(weather.airTemp)}°C`, feelsLikeDisplay: `${Math.round(feelsLike)}°C`, uvIndex: weather.uvIndex },
        sewage, sun: { sunrise: sunTimes.sunrise, sunset: sunTimes.sunset, showSunriseBadge, showSunsetBadge },
        alerts: { jellyfish: false, jellyfishSpecies: null, recentRainfall: weather.precipitation > 5, bathingWaterQuality: 'good' },
        recommendation, isForecast
      };
    }));
    
    const validBeaches = beachesData.filter(b => b !== null);
    if (validBeaches.length === 0) return res.status(404).json({ error: 'No valid beaches found' });
    
    const response = {
      meta: {
        time: timeSlot,
        timeLabel: getTimeLabel(timeSlot),
        mode,
        isForecast,
        updatedAt: new Date().toISOString(),
        availableTimeSlots: getAvailableTimeSlots()
      },
      beaches: validBeaches
    };
    
    // Cache the response
    setCache(cacheKey, response);
    
    res.json(response);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

app.post('/alexa', async (req, res) => {
  try {
    const request = req.body.request;
    if (request.type === 'LaunchRequest') {
      return res.json({ version: '1.0', response: { outputSpeech: { type: 'PlainText', text: 'Welcome to Shorecast. Ask me about any beach.' }, shouldEndSession: false } });
    }
    if (request.type === 'IntentRequest' && request.intent.name === 'GetConditionsIntent') {
      const location = request.intent.slots?.location?.value;
      if (!location) return res.json({ version: '1.0', response: { outputSpeech: { type: 'PlainText', text: 'Which beach?' }, shouldEndSession: false } });
      
      const slug = location.toLowerCase().replace(/\s+/g, '-');
      const beach = BEACHES.find(b => b.slug === slug || b.name.toLowerCase() === location.toLowerCase());
      if (!beach) return res.json({ version: '1.0', response: { outputSpeech: { type: 'PlainText', text: `Sorry, I don't have ${location}.` }, shouldEndSession: true } });
      
      const targetDate = new Date();
      const [tide, weatherData, sewage] = await Promise.all([fetchTideForTime(beach, targetDate), fetchWeatherForTime(beach, targetDate), fetchSewageStatus(beach)]);
      if (!weatherData) return res.json({ version: '1.0', response: { outputSpeech: { type: 'PlainText', text: 'Sorry, couldn\'t fetch conditions.' }, shouldEndSession: true } });
      
      const { marine } = weatherData;
      const speech = `${beach.name}. Water ${Math.round(marine.seaTemp)} degrees. Waves ${marine.waveHeight.toFixed(1)} metres. High tide at ${tide.high.time}, low tide at ${tide.low.time}. ${sewage.status === 'clear' ? 'No sewage alerts.' : 'Check sewage status.'}`;
      return res.json({ version: '1.0', response: { outputSpeech: { type: 'PlainText', text: speech }, shouldEndSession: true } });
    }
    res.json({ version: '1.0', response: { outputSpeech: { type: 'PlainText', text: 'Sorry, didn\'t understand.' }, shouldEndSession: true } });
  } catch (error) {
    res.json({ version: '1.0', response: { outputSpeech: { type: 'PlainText', text: 'Something went wrong.' }, shouldEndSession: true } });
  }
});

// Debug endpoint for sewage
app.get('/debug-sewage/:beach', async (req, res) => {
  const beach = BEACHES.find(b => b.slug === req.params.beach);
  if (!beach) return res.status(404).json({ error: 'Beach not found' });
  
  const result = {
    beach: beach.name,
    beachLat: beach.lat,
    beachLon: beach.lon,
    overflowContext: beach.overflowContext,
    tests: []
  };
  
  const urlsToTry = [
    {
      name: 'Welsh Water Spill Data (NEW)',
      url: 'https://services3.arcgis.com/KLNF7YxtENPLYVey/arcgis/rest/services/Spill_Prod__view/FeatureServer/0/query?where=1%3D1&outFields=*&f=json&returnGeometry=true&resultRecordCount=5'
    }
  ];
  
  for (const test of urlsToTry) {
    const testResult = {
      name: test.name,
      url: test.url,
      status: null,
      success: false,
      featureCount: null,
      error: null,
      sampleData: null
    };
    
    try {
      const response = await fetch(test.url);
      testResult.status = response.status;
      
      const data = await response.json();
      
      if (data.error) {
        testResult.error = data.error.message || JSON.stringify(data.error);
      } else if (data.features) {
        testResult.success = true;
        testResult.featureCount = data.features.length;
        if (data.features.length > 0) {
          testResult.sampleData = {
            attributeKeys: Object.keys(data.features[0].attributes || {}),
            firstRecord: data.features[0].attributes
          };
        }
      }
    } catch (err) {
      testResult.error = err.message;
    }
    
    result.tests.push(testResult);
  }
  
  res.json(result);
});

// Debug endpoint for tides
app.get('/debug-tides/:beach', async (req, res) => {
  const beach = BEACHES.find(b => b.slug === req.params.beach);
  if (!beach) return res.status(404).json({ error: 'Beach not found' });
  
  const timeSlot = req.query.time || 'now';
  const targetDate = getDateForTimeSlot(timeSlot);
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const daysAhead = Math.floor((targetStart - todayStart) / (1000 * 60 * 60 * 24));
  const duration = Math.max(2, daysAhead + 2);
  
  const url = `https://admiraltyapi.azure-api.net/uktidalapi/api/V1/Stations/${beach.stationId}/TidalEvents?duration=${duration}`;
  
  try {
    const response = await fetch(url, {
      headers: { 'Ocp-Apim-Subscription-Key': process.env.ADMIRALTY_API_KEY }
    });
    const data = await response.json();
    
    const events = (data || []).map(event => ({
      type: event.EventType,
      dateTime: event.DateTime,
      localTime: new Date(event.DateTime).toLocaleString('en-GB', { timeZone: 'Europe/London' }),
      height: event.Height,
      isAfterTarget: new Date(event.DateTime).getTime() >= targetDate.getTime()
    })).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    
    const highCount = events.filter(e => e.type === 'HighWater').length;
    const lowCount = events.filter(e => e.type === 'LowWater').length;
    
    const selected = await fetchTideForTime(beach, targetDate);
    
    res.json({
      beach: beach.name,
      stationId: beach.stationId,
      timeSlot,
      targetDate: targetDate.toISOString(),
      targetDateLocal: targetDate.toLocaleString('en-GB', { timeZone: 'Europe/London' }),
      duration,
      apiUrl: url,
      summary: {
        totalEvents: events.length,
        highWaterEvents: highCount,
        lowWaterEvents: lowCount
      },
      selectedTide: selected,
      allEvents: events
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug endpoint for marine data
app.get('/debug-marine/:beach', async (req, res) => {
  const beach = BEACHES.find(b => b.slug === req.params.beach);
  if (!beach) return res.status(404).json({ error: 'Beach not found' });
  
  const timeSlot = req.query.time || 'now';
  const targetDate = getDateForTimeSlot(timeSlot);
  const dateStr = targetDate.toISOString().split('T')[0];
  const hour = targetDate.getHours();
  
  const endDate = new Date(targetDate);
  endDate.setDate(endDate.getDate() + 2);
  const endDateStr = endDate.toISOString().split('T')[0];
  
  const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${beach.lat}&longitude=${beach.lon}&hourly=wave_height,swell_wave_height,wave_period,sea_surface_temperature&start_date=${dateStr}&end_date=${endDateStr}`;
  
  const result = {
    beach: beach.name,
    slug: beach.slug,
    coordinates: { lat: beach.lat, lon: beach.lon },
    timeSlot,
    targetDate: targetDate.toISOString(),
    targetDateLocal: targetDate.toLocaleString('en-GB', { timeZone: 'Europe/London' }),
    targetHour: hour,
    apiUrl: marineUrl,
    rawResponse: null,
    extracted: null,
    diagnosis: []
  };
  
  try {
    const response = await fetch(marineUrl);
    const data = await response.json();
    
    result.rawResponse = data;
    
    if (data.error) {
      result.diagnosis.push(`API Error: ${JSON.stringify(data.error)}`);
    } else if (!data.hourly) {
      result.diagnosis.push('No hourly data returned');
    } else {
      const sst = data.hourly.sea_surface_temperature;
      const times = data.hourly.time;
      
      if (!sst) {
        result.diagnosis.push('sea_surface_temperature field is missing from response');
      } else {
        const nonNullCount = sst.filter(v => v !== null).length;
        const totalCount = sst.length;
        
        result.diagnosis.push(`SST data: ${nonNullCount}/${totalCount} hours have values`);
        
        if (nonNullCount === 0) {
          result.diagnosis.push('ALL SST values are null - likely no coverage for this location');
        }
        
        const targetValue = sst[hour];
        result.extracted = {
          targetHour: hour,
          seaTemp: targetValue,
          seaTempDisplay: targetValue ? `${Math.round(targetValue)}°C` : 'null',
          waveHeight: data.hourly.wave_height?.[hour],
          swellHeight: data.hourly.swell_wave_height?.[hour]
        };
        
        result.sampleData = [];
        for (let i = 0; i < Math.min(72, times?.length || 0); i += 6) {
          result.sampleData.push({
            time: times[i],
            seaTemp: sst[i],
            waveHeight: data.hourly.wave_height?.[i]
          });
        }
      }
    }
  } catch (err) {
    result.diagnosis.push(`Fetch error: ${err.message}`);
  }
  
  res.json(result);
});

// Cache management endpoints
app.get('/cache/stats', (req, res) => {
  const stats = {
    size: cache.size,
    entries: Array.from(cache.keys()),
    oldestEntry: null,
    newestEntry: null
  };
  
  if (cache.size > 0) {
    let oldest = Date.now();
    let newest = 0;
    
    for (const [key, value] of cache.entries()) {
      if (value.timestamp < oldest) oldest = value.timestamp;
      if (value.timestamp > newest) newest = value.timestamp;
    }
    
    const now = Date.now();
    stats.oldestEntry = `${Math.round((now - oldest) / 1000)}s ago`;
    stats.newestEntry = `${Math.round((now - newest) / 1000)}s ago`;
  }
  
  res.json(stats);
});

app.post('/cache/clear', (req, res) => {
  const size = cache.size;
  cache.clear();
  res.json({ message: 'Cache cleared', entriesRemoved: size });
});

app.listen(PORT, () => console.log(`Shorecast running on port ${PORT}`));
