const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');

async function dumpSchema() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        console.log('Fetching tables...');
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

        let schemaText = 'Database Schema Dump\n';
        schemaText += '====================\n\n';

        for (const row of tables.rows) {
            const tableName = row.table_name;
            schemaText += `Table: ${tableName}\n`;
            schemaText += '--------------------\n';

            const columns = await pool.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = $1
                ORDER BY ordinal_position
            `, [tableName]);

            for (const col of columns.rows) {
                schemaText += `${col.column_name.padEnd(25)} | ${col.data_type.padEnd(20)} | Nullable: ${col.is_nullable}\n`;
            }
            schemaText += '\n';
        }

        fs.writeFileSync('schema_dump.txt', schemaText);
        console.log('Schema dump saved to schema_dump.txt');

    } catch (err) {
        console.error('Error dumping schema:', err);
    } finally {
        await pool.end();
    }
}

dumpSchema();
