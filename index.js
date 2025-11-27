const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3000;

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

const server = http.createServer(async (req, res) => {
  if (req.url === '/' || req.url === '/conditions') {
    try {
      const marine = await fetchMarineData();
      
      const output = `
=== SHORECAST: Barry Island ===

Current marine conditions:
  Sea temperature: ${marine.current.sea_surface_temperature}°C
  Wave height: ${marine.current.wave_height}m
  Wave period: ${marine.current.wave_period}s
  Swell height: ${marine.current.swell_wave_height}m

Shorecast is alive!
      `;
      
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(output);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error fetching marine data: ' + error.message);
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Shorecast server running on port ${PORT}`);
});
