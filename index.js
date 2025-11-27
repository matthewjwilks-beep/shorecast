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
        } catch
