import { AppDataSource } from "../src/config/database";
import dotenv from "dotenv";

dotenv.config();

async function checkSchema() {
  try {
    console.log('Checking database schema...');
    
    if (!AppDataSource.isInitialized) {
      console.log('Initializing database connection...');
      await AppDataSource.initialize();
    }

    // Check if quotes table exists
    const tableExists = await AppDataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'quotes'
      );
    `);

    if (!tableExists[0].exists) {
      console.error('Quotes table does not exist!');
      return;
    }

    // Get table structure
    const tableStructure = await AppDataSource.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'quotes'
      ORDER BY ordinal_position;
    `);

    console.log('Quotes table structure:', tableStructure);

    // Check if table has any records
    const recordCount = await AppDataSource.query(`
      SELECT COUNT(*) as count FROM quotes;
    `);

    console.log('Number of quotes:', recordCount[0].count);

  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

checkSchema(); 