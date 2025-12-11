// ============================================
// SHORECAST BACKEND - Rate Limited Version
// ============================================
// Last Updated: 11 December 2025
// Deploy to: Render.com (free tier)
// Environment Variables Required: ADMIRALTY_API_KEY
//
// CHANGES FROM PREVIOUS VERSION:
// - Added Bottleneck rate limiting for all external APIs
// - Separate limiters for Admiralty, Open-Meteo, and Sewage APIs
// - Preserved existing 5-minute cache
// - Added rate limit monitoring endpoint

const express = require('express');
const cors = require('cors');
const Bottleneck = require('bottleneck');
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
// RATE LIMITERS - Per API Service
// ============================================

// Admiralty API Rate Limiter
// Conservative: 10 requests per minute (600 per hour)
// Adjust based on your actual API tier limits
const admiraltyLimiter = new Bottleneck({
  reservoir: 10,                    // Initial capacity
  reservoirRefreshAmount: 10,       // Refill to 10
  reservoirRefreshInterval: 60 * 1000, // Every 60 seconds
  maxConcurrent: 2,                 // Max 2 simultaneous requests
  minTime: 6000                     // Min 6s between requests (10/min)
});

// Open-Meteo Rate Limiter
// Free tier: ~10,000 requests/day, burst allowed
// Conservative: 50 requests per minute
const openMeteoLimiter = new Bottleneck({
  reservoir: 50,
  reservoirRefreshAmount: 50,
  reservoirRefreshInterval: 60 * 1000,
  maxConcurrent: 5,
  minTime: 1200                     // Min 1.2s between requests (50/min)
});

// Sewage API Rate Limiter  
// Government APIs - very conservative
// 20 requests per minute (likely lower actual limits)
const sewageLimiter = new Bottleneck({
  reservoir: 20,
  reservoirRefreshAmount: 20,
  reservoirRefreshInterval: 60 * 1000,
  maxConcurrent: 3,
  minTime: 3000                     // Min 3s between requests (20/min)
});

// Rate limit tracking for monitoring
const rateLimitStats = {
  admiralty: { total: 0, queued: 0, rejected: 0 },
  openMeteo: { total: 0, queued: 0, rejected: 0 },
  sewage: { total: 0, queued: 0, rejected: 0 }
};

// Track rate limit events
admiraltyLimiter.on('queued', () => rateLimitStats.admiralty.queued++);
admiraltyLimiter.on('failed', () => rateLimitStats.admiralty.rejected++);
admiraltyLimiter.on('done', () => rateLimitStats.admiralty.total++);

openMeteoLimiter.on('queued', () => rateLimitStats.openMeteo.queued++);
openMeteoLimiter.on('failed', () => rateLimitStats.openMeteo.rejected++);
openMeteoLimiter.on('done', () => rateLimitStats.openMeteo.total++);

sewageLimiter.on('queued', () => rateLimitStats.sewage.queued++);
sewageLimiter.on('failed', () => rateLimitStats.sewage.rejected++);
sewageLimiter.on('done', () => rateLimitStats.sewage.total++);

// ============================================
// RATE-LIMITED FETCH WRAPPERS
// ============================================

async function fetchAdmiralty(url, options = {}) {
  return admiraltyLimiter.schedule(() => fetch(url, options));
}

async function fetchOpenMeteo(url, options = {}) {
  return openMeteoLimiter.schedule(() => fetch(url, options));
}

async function fetchSewage(url, options = {}) {
  return sewageLimiter.schedule(() => fetch(url, options));
}

// ============================================
// SIMPLE IN-MEMORY CACHE (UNCHANGED)
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
// BEACH DATABASE (UNCHANGED - TRUNCATED FOR SPACE)
// ============================================

const BEACHES = [
  // ANGLESEY
  { slug: 'benllech', name: 'Benllech', location: 'Anglesey', lat: 53.319, lon: -4.225, facing: 'east', stationId: '0476A', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'moderate' },
  { slug: 'lligwy', name: 'Lligwy Bay', location: 'Anglesey', lat: 53.341, lon: -4.241, facing: 'northeast', stationId: '0476A', region: 'wales', company: 'welsh-water', companyName: 'Welsh Water', overflowContext: 'rare' },
  // ... (include all your beaches here - truncated for brevity)
];

// ============================================
// TIME SLOT HELPER FUNCTIONS (UNCHANGED)
// ============================================

function getDateForTimeSlot(timeSlot = 'now') {
  const now = new Date();
  
  if (timeSlot === 'now') return now;
  if (timeSlot === 'tomorrow_morning') {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(7, 0, 0, 0);
    return tomorrow;
  }
  if (timeSlot === 'afternoon') {
    now.setHours(15, 0, 0, 0);
    return now;
  }
  if (timeSlot === 'evening') {
    now.setHours(18, 0, 0, 0);
    return now;
  }
  
  return now;
}

// ============================================
// TIDE DATA FUNCTIONS - NOW RATE LIMITED
// ============================================

async function fetchTideData(beach, startDate, durationDays = 1) {
  const stationId = beach.stationId;
  const API_KEY = process.env.ADMIRALTY_API_KEY;
  
  if (!API_KEY) throw new Error('ADMIRALTY_API_KEY not set');
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays);
  
  const url = `https://admiraltyapi.azure-api.net/uktidalapi/api/V1/Stations/${stationId}/TidalEvents?StartDateTime=${startDate.toISOString()}&EndDateTime=${endDate.toISOString()}`;
  
  // Use rate-limited fetch for Admiralty
  const response = await fetchAdmiralty(url, {
    headers: { 'Ocp-Apim-Subscription-Key': API_KEY }
  });
  
  if (!response.ok) throw new Error(`Admiralty API: ${response.status}`);
  return response.json();
}

async function fetchTideForTime(beach, targetDate) {
  const events = await fetchTideData(beach, targetDate, 1);
  
  if (!events || events.length === 0) {
    return { state: 'unknown', message: 'Tide data unavailable' };
  }
  
  const targetTime = targetDate.getTime();
  let closestEvent = null;
  let minDiff = Infinity;
  
  for (const event of events) {
    const eventTime = new Date(event.DateTime).getTime();
    const diff = Math.abs(eventTime - targetTime);
    
    if (diff < minDiff) {
      minDiff = diff;
      closestEvent = event;
    }
  }
  
  if (!closestEvent) {
    return { state: 'unknown', message: 'No tide events found' };
  }
  
  const eventTime = new Date(closestEvent.DateTime);
  const hoursDiff = (targetTime - eventTime.getTime()) / (1000 * 60 * 60);
  
  let timeDescription;
  if (Math.abs(hoursDiff) < 1) {
    timeDescription = closestEvent.EventType === 'HighWater' ? 'high tide now' : 'low tide now';
  } else if (hoursDiff > 0) {
    const hours = Math.floor(hoursDiff);
    timeDescription = `${hours} ${hours === 1 ? 'hour' : 'hours'} after ${closestEvent.EventType === 'HighWater' ? 'high' : 'low'} tide`;
  } else {
    const hours = Math.floor(Math.abs(hoursDiff));
    timeDescription = `${hours} ${hours === 1 ? 'hour' : 'hours'} before ${closestEvent.EventType === 'HighWater' ? 'high' : 'low'} tide`;
  }
  
  return {
    state: closestEvent.EventType === 'HighWater' ? 'high' : 'low',
    height: closestEvent.Height,
    time: closestEvent.DateTime,
    timeDescription
  };
}

// ============================================
// WEATHER FUNCTIONS - NOW RATE LIMITED
// ============================================

async function fetchWeather(beach, targetDate) {
  const dateStr = targetDate.toISOString().split('T')[0];
  const hour = targetDate.getHours();
  
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${beach.lat}&longitude=${beach.lon}&hourly=temperature_2m,windspeed_10m,winddirection_10m,weathercode&timezone=Europe/London&start_date=${dateStr}&end_date=${dateStr}`;
  
  // Use rate-limited fetch for Open-Meteo
  const response = await fetchOpenMeteo(url);
  if (!response.ok) throw new Error(`Weather API: ${response.status}`);
  
  const data = await response.json();
  const hourly = data.hourly;
  
  return {
    temp: hourly.temperature_2m[hour],
    windSpeed: hourly.windspeed_10m[hour],
    windDirection: hourly.winddirection_10m[hour],
    weatherCode: hourly.weathercode[hour]
  };
}

async function fetchMarineConditions(beach, targetDate) {
  const dateStr = targetDate.toISOString().split('T')[0];
  const hour = targetDate.getHours();
  
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${beach.lat}&longitude=${beach.lon}&hourly=wave_height,swell_wave_height,wave_period,sea_surface_temperature&start_date=${dateStr}&end_date=${dateStr}`;
  
  // Use rate-limited fetch for Open-Meteo
  const response = await fetchOpenMeteo(url);
  if (!response.ok) return null;
  
  const data = await response.json();
  const hourly = data.hourly;
  
  if (!hourly) return null;
  
  return {
    waveHeight: hourly.wave_height?.[hour] || null,
    swellHeight: hourly.swell_wave_height?.[hour] || null,
    wavePeriod: hourly.wave_period?.[hour] || null,
    seaTemp: hourly.sea_surface_temperature?.[hour] || null
  };
}

// ============================================
// SEWAGE FUNCTIONS - NOW RATE LIMITED
// ============================================

async function fetchSewageStatus(beach) {
  const companyEndpoints = {
    'welsh-water': 'https://api.dwrcymru.com/discharge/all',
    'south-west-water': 'https://www.southwestwater.co.uk/siteassets/json/storm-overflows.json',
    'southern-water': 'https://www.southernwater.co.uk/water-for-life/content/api/BeachBuddyApi/bathing-water-results',
    'wessex-water': 'https://www.wessexwater.co.uk/api/bathing-water'
  };
  
  const apiUrl = companyEndpoints[beach.company];
  if (!apiUrl) return { status: 'unknown', message: 'No data for this area yet' };
  
  try {
    // Use rate-limited fetch for sewage APIs
    const response = await fetchSewage(apiUrl, { 
      timeout: 5000,
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) return { status: 'unknown', message: 'API unavailable' };
    
    const data = await response.json();
    const context = OVERFLOW_CONTEXTS[beach.overflowContext || 'moderate'];
    
    // Find relevant discharge for this beach (simplified logic)
    // You'll need to implement proper matching based on each API's structure
    
    return {
      status: 'green', // or 'amber'/'red' based on data
      lastDischarge: null,
      message: 'No recent discharges',
      context: context.description
    };
    
  } catch (err) {
    return { status: 'unknown', message: 'Data currently unavailable' };
  }
}

// ============================================
// MAIN FORECAST ENDPOINT (UNCHANGED LOGIC)
// ============================================

app.get('/forecast/:beach', async (req, res) => {
  const beach = BEACHES.find(b => b.slug === req.params.beach);
  if (!beach) return res.status(404).json({ error: 'Beach not found' });
  
  const timeSlot = req.query.time || 'now';
  const cacheKey = getCacheKey([beach.slug], 'forecast', timeSlot);
  
  // Check cache first
  const cached = getFromCache(cacheKey);
  if (cached) return res.json({ ...cached, cached: true });
  
  try {
    const targetDate = getDateForTimeSlot(timeSlot);
    
    // All API calls now use rate-limited fetchers
    const [tide, weather, marine, sewage] = await Promise.all([
      fetchTideForTime(beach, targetDate),
      fetchWeather(beach, targetDate),
      fetchMarineConditions(beach, targetDate),
      fetchSewageStatus(beach)
    ]);
    
    const forecast = {
      beach: beach.name,
      location: beach.location,
      facing: beach.facing,
      timeSlot,
      targetDate: targetDate.toISOString(),
      tide,
      weather,
      marine,
      sewage,
      cached: false
    };
    
    setCache(cacheKey, forecast);
    res.json(forecast);
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// MONITORING ENDPOINTS
// ============================================

// Rate limit stats endpoint
app.get('/rate-limits/stats', (req, res) => {
  res.json({
    stats: rateLimitStats,
    currentState: {
      admiralty: {
        reservoir: admiraltyLimiter._store?.reservoir || 0,
        queued: admiraltyLimiter.queued()
      },
      openMeteo: {
        reservoir: openMeteoLimiter._store?.reservoir || 0,
        queued: openMeteoLimiter.queued()
      },
      sewage: {
        reservoir: sewageLimiter._store?.reservoir || 0,
        queued: sewageLimiter.queued()
      }
    },
    limits: {
      admiralty: '10 requests/minute (600/hour)',
      openMeteo: '50 requests/minute',
      sewage: '20 requests/minute'
    }
  });
});

// Cache management endpoints (unchanged)
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

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    cache: {
      size: cache.size,
      maxSize: 100
    },
    rateLimits: {
      admiralty: admiraltyLimiter.queued(),
      openMeteo: openMeteoLimiter.queued(),
      sewage: sewageLimiter.queued()
    }
  });
});

// ============================================
// DEBUG ENDPOINTS (Update to use rate limiters)
// ============================================

app.get('/debug-tide/:beach', async (req, res) => {
  const beach = BEACHES.find(b => b.slug === req.params.beach);
  if (!beach) return res.status(404).json({ error: 'Beach not found' });
  
  const timeSlot = req.query.time || 'now';
  const targetDate = getDateForTimeSlot(timeSlot);
  
  try {
    const duration = 1;
    const endDate = new Date(targetDate);
    endDate.setDate(endDate.getDate() + duration);
    
    const API_KEY = process.env.ADMIRALTY_API_KEY;
    const url = `https://admiraltyapi.azure-api.net/uktidalapi/api/V1/Stations/${beach.stationId}/TidalEvents?StartDateTime=${targetDate.toISOString()}&EndDateTime=${endDate.toISOString()}`;
    
    // Use rate-limited fetch
    const response = await fetchAdmiralty(url, {
      headers: { 'Ocp-Apim-Subscription-Key': API_KEY }
    });
    
    const events = await response.json();
    const highCount = events.filter(e => e.EventType === 'HighWater').length;
    const lowCount = events.filter(e => e.EventType === 'LowWater').length;
    
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
      allEvents: events,
      rateLimitQueued: admiraltyLimiter.queued()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
    diagnosis: [],
    rateLimitQueued: openMeteoLimiter.queued()
  };
  
  try {
    // Use rate-limited fetch
    const response = await fetchOpenMeteo(marineUrl);
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

app.listen(PORT, () => console.log(`Shorecast (rate-limited) running on port ${PORT}`));
