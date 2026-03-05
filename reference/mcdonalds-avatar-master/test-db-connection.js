const { Client } = require('pg');

// Testing POOLER connection - trying with just 'postgres' as username
const connectionString = "postgresql://postgres:mcdo@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";

async function testConnection() {
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 5000,
    ssl: {
      rejectUnauthorized: false, // For development - accepts self-signed certs
    },
  });

  try {
    console.log('Attempting to connect to database...');
    await client.connect();
    console.log('✅ Connection successful!');

    const result = await client.query('SELECT version();');
    console.log('PostgreSQL version:', result.rows[0].version);

    const menuTest = await client.query('SELECT COUNT(*) FROM menu_items;');
    console.log('Menu items count:', menuTest.rows[0].count);

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testConnection();
