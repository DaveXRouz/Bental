const https = require('https');

// Delete old test user first
const deleteData = JSON.stringify({});

const deleteOptions = {
  hostname: 'tnjgqdpxvkciiqdrdkyz.supabase.co',
  port: 443,
  path: '/auth/v1/user',
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuamdxZHB4dmtjaWlxZHJka3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMTY1NzIsImV4cCI6MjA3NzY5MjU3Mn0.fzuasx1yM-PkjO-d4OowSPNfMMeLmtAeci2skmCZS5k'
  }
};

// Now create fresh user
setTimeout(() => {
  const signupData = JSON.stringify({
    email: 'freshtest@demo.com',
    password: 'Test123456'
  });

  const signupOptions = {
    hostname: 'tnjgqdpxvkciiqdrdkyz.supabase.co',
    port: 443,
    path: '/auth/v1/signup',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuamdxZHB4dmtjaWlxZHJka3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMTY1NzIsImV4cCI6MjA3NzY5MjU3Mn0.fzuasx1yM-PkjO-d4OowSPNfMMeLmtAeci2skmCZS5k'
    }
  };

  const signupReq = https.request(signupOptions, (res) => {
    console.log(`\n📝 SIGNUP Status: ${res.statusCode}`);
    let body = '';
    res.on('data', (d) => { body += d.toString(); });
    res.on('end', () => {
      try {
        const json = JSON.parse(body);
        if (json.user) {
          console.log('✅ SIGNUP SUCCESSFUL!');
          console.log('User ID:', json.user.id);
          console.log('Email:', json.user.email);
          
          // Now try to login
          console.log('\n🔐 Testing login...');
          setTimeout(() => {
            const loginData = JSON.stringify({
              email: 'freshtest@demo.com',
              password: 'Test123456'
            });

            const loginOptions = {
              hostname: 'tnjgqdpxvkciiqdrdkyz.supabase.co',
              port: 443,
              path: '/auth/v1/token?grant_type=password',
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuamdxZHB4dmtjaWlxZHJka3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMTY1NzIsImV4cCI6MjA3NzY5MjU3Mn0.fzuasx1yM-PkjO-d4OowSPNfMMeLmtAeci2skmCZS5k'
              }
            };

            const loginReq = https.request(loginOptions, (res) => {
              console.log(`LOGIN Status: ${res.statusCode}`);
              let loginBody = '';
              res.on('data', (d) => { loginBody += d.toString(); });
              res.on('end', () => {
                try {
                  const loginJson = JSON.parse(loginBody);
                  if (loginJson.access_token) {
                    console.log('✅ LOGIN SUCCESSFUL!\n');
                    console.log('🎉 SYSTEM IS WORKING - The issue is with existing user passwords!\n');
                  } else {
                    console.log('❌ LOGIN FAILED');
                    console.log(loginJson);
                  }
                } catch (e) {
                  console.log('Login Response:', loginBody);
                }
              });
            });
            loginReq.on('error', console.error);
            loginReq.write(loginData);
            loginReq.end();
          }, 1000);
        } else {
          console.log('❌ SIGNUP FAILED');
          console.log(json);
        }
      } catch (e) {
        console.log('Signup Response:', body.substring(0, 500));
      }
    });
  });
  signupReq.on('error', console.error);
  signupReq.write(signupData);
  signupReq.end();
}, 100);
