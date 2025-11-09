const https = require('https');

const data = JSON.stringify({
  email: 'testuser@demo.com',
  password: 'Test123!',
  full_name: 'Test User'
});

const options = {
  hostname: 'oanohrjkniduqkkahmel.supabase.co',
  port: 443,
  path: '/auth/v1/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hbm9ocmprbmlkdXFra2FobWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NDIyOTEsImV4cCI6MjA3NzQxODI5MX0.Soav_sSh5Ww_BJ7AJywhToZhDIXemEb9X7hSj9xNmdo'
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  res.on('data', (d) => {
    console.log(JSON.parse(d.toString()));
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
