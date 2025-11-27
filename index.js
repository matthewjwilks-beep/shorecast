const https = require('https');

// Barry Island coordinates
const latitude = 51.3888;
const longitude = -3.2683;

// Open-Meteo Marine API - free, no API key needed
const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}&current=wave_height,wave_period,swell_wave_height,sea_surface_temperature&timezone=Europe/London`;

https.get(url, (response) => {
  let data = '';
  
  response.on('data', (chunk) => {
    data += chunk;
  });
  
  response.on('end', () => {
    const marine = JSON.parse(data);
    
    console.log('=== SHORECAST: Barry Island ===\n');
    console.log('Current marine conditions:');
    console.log(`  Sea temperature: ${marine.current.sea_surface_temperature}°C`);
    console.log(`  Wave height: ${marine.current.wave_height}m`);
    console.log(`  Wave period: ${marine.current.wave_period}s`);
    console.log(`  Swell height: ${marine.current.swell_wave_height}m`);
    console.log('\nShorecast is alive!');
  });
  
}).on('error', (err) => {
  console.error('Error fetching data:', err.message);
});
