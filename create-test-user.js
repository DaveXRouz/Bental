const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUser() {
  console.log('Creating test user...');
  
  // Delete existing user if exists
  const { data: existing } = await supabase.auth.admin.listUsers();
  const existingUser = existing?.users?.find(u => u.email === 'test@demo.com');
  if (existingUser) {
    console.log('Deleting existing test user...');
    await supabase.auth.admin.deleteUser(existingUser.id);
  }
  
  // Create new user with password
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'test@demo.com',
    password: 'Test123!',
    email_confirm: true,
    user_metadata: {
      full_name: 'Test User'
    }
  });
  
  if (error) {
    console.error('Error creating user:', error);
    return;
  }
  
  console.log('✅ Test user created successfully!');
  console.log('Email: test@demo.com');
  console.log('Password: Test123!');
  console.log('User ID:', data.user.id);
  
  // Create profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: data.user.id,
      email: 'test@demo.com',
      full_name: 'Test User',
      role: 'user'
    });
    
  if (profileError) {
    console.error('Profile error:', profileError);
  } else {
    console.log('✅ Profile created');
  }
}

createTestUser().catch(console.error);
