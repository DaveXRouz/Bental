const https = require('https');

const data = JSON.stringify({
  email: 'michael.chen@demo.com',
  password: 'Welcome2025!'
});

const options = {
  hostname: 'oanohrjkniduqkkahmel.supabase.co',
  port: 443,
  path: '/auth/v1/token?grant_type=password',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hbm9ocmprbmlkdXFra2FobWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NDIyOTEsImV4cCI6MjA3NzQxODI5MX0.Soav_sSh5Ww_BJ7AJywhToZhDIXemEb9X7hSj9xNmdo'
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  let body = '';
  res.on('data', (d) => {
    body += d.toString();
  });
  res.on('end', () => {
    try {
      const json = JSON.parse(body);
      if (json.access_token) {
        console.log('✅ LOGIN SUCCESSFUL!');
        console.log('User ID:', json.user?.id);
        console.log('Email:', json.user?.email);
      } else {
        console.log('❌ LOGIN FAILED');
        console.log(json);
      }
    } catch (e) {
      console.log('Response:', body);
    }
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
