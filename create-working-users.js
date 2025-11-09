const https = require('https');

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuamdxZHB4dmtjaWlxZHJka3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMTY1NzIsImV4cCI6MjA3NzY5MjU3Mn0.fzuasx1yM-PkjO-d4OowSPNfMMeLmtAeci2skmCZS5k';

async function createUser(email, password, fullName) {
  return new Promise((resolve, reject) => {
    const signupData = JSON.stringify({
      email: email,
      password: password,
      data: {
        full_name: fullName
      }
    });

    const options = {
      hostname: 'tnjgqdpxvkciiqdrdkyz.supabase.co',
      port: 443,
      path: '/auth/v1/signup',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (d) => { body += d.toString(); });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode === 200) {
            resolve({ success: true, email, userId: json.id || (json.user && json.user.id) });
          } else {
            resolve({ success: false, email, error: json });
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(signupData);
    req.end();
  });
}

async function testLogin(email, password) {
  return new Promise((resolve) => {
    const loginData = JSON.stringify({ email, password });
    
    const options = {
      hostname: 'tnjgqdpxvkciiqdrdkyz.supabase.co',
      port: 443,
      path: '/auth/v1/token?grant_type=password',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (d) => { body += d.toString(); });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ 
            success: res.statusCode === 200 && !!json.access_token,
            email,
            response: json
          });
        } catch (e) {
          resolve({ success: false, email, error: e.message });
        }
      });
    });
    
    req.on('error', () => resolve({ success: false, email }));
    req.write(loginData);
    req.end();
  });
}

async function main() {
  console.log('Creating test users with working passwords...\n');

  const users = [
    { email: 'admin@demo.com', password: 'Admin2025!SecurePass', name: 'Admin User' },
    { email: 'user@demo.com', password: 'User2025!SecurePass', name: 'Regular User' },
  ];

  for (const user of users) {
    console.log('Creating ' + user.email + '...');
    const result = await createUser(user.email, user.password, user.name);
    
    if (result.success) {
      console.log('   Created successfully (ID: ' + result.userId + ')');
    } else {
      console.log('   Already exists or error');
    }
    
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\nTesting logins...\n');

  for (const user of users) {
    const loginResult = await testLogin(user.email, user.password);
    
    if (loginResult.success) {
      console.log('SUCCESS: ' + user.email + ' - LOGIN WORKS!');
    } else {
      console.log('FAILED: ' + user.email + ' - Login failed');
    }
    
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log('WORKING CREDENTIALS:');
  console.log('='.repeat(60));
  users.forEach(u => {
    console.log('\n' + u.name + ':');
    console.log('  Email:    ' + u.email);
    console.log('  Password: ' + u.password);
  });
  console.log('\n' + '='.repeat(60));
}

main().catch(console.error);
