import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = 'postgresql://postgres:xzjKMTNpOQGBuVgcgKslLkPSJalnPFSk@interchange.proxy.rlwy.net:52065/railway';

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function checkAdmin() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected to database');

    // Check if admins table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'admins'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('Admins table does not exist');
      return;
    }

    // Check admin record
    const result = await client.query(`
      SELECT * FROM admins WHERE email = $1;
    `, ['admin@hypemeup.com']);

    if (result.rows.length === 0) {
      console.log('No admin record found');
      return;
    }

    console.log('Admin record found:', {
      id: result.rows[0].id,
      email: result.rows[0].email,
      createdAt: result.rows[0].created_at
    });

  } catch (error) {
    console.error('Error checking admin:', error);
  } finally {
    await pool.end();
  }
}

checkAdmin();