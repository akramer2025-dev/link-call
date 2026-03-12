// MySQL Database Connection - Replaces Firebase
// Project: Link Call System

const mysql = require('mysql2/promise');

// Configuration
const config = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'link_call_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    timezone: '+00:00'
};

// Connection pool
let pool = null;

/**
 * Get MySQL connection pool
 */
function getPool() {
    if (!pool) {
        pool = mysql.createPool(config);
        console.log('✅ MySQL Connection Pool Created');
    }
    return pool;
}

/**
 * Execute a query
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} - Query results
 */
async function query(sql, params = []) {
    try {
        const pool = getPool();
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('❌ MySQL Query Error:', error.message);
        throw error;
    }
}

/**
 * Execute a query and return first row
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object|null>} - First row or null
 */
async function queryOne(sql, params = []) {
    const rows = await query(sql, params);
    return rows.length > 0 ? rows[0] : null;
}

/**
 * Begin transaction
 * @returns {Promise<Connection>} - MySQL connection
 */
async function beginTransaction() {
    const pool = getPool();
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    return connection;
}

/**
 * Commit transaction
 * @param {Connection} connection - MySQL connection
 */
async function commit(connection) {
    await connection.commit();
    connection.release();
}

/**
 * Rollback transaction
 * @param {Connection} connection - MySQL connection
 */
async function rollback(connection) {
    await connection.rollback();
    connection.release();
}

/**
 * Test database connection
 */
async function testConnection() {
    try {
        const pool = getPool();
        const connection = await pool.getConnection();
        console.log('✅ MySQL Connected Successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ MySQL Connection Failed:', error.message);
        return false;
    }
}

/**
 * Close all connections
 */
async function closePool() {
    if (pool) {
        await pool.end();
        pool = null;
        console.log('✅ MySQL Pool Closed');
    }
}

module.exports = {
    getPool,
    query,
    queryOne,
    beginTransaction,
    commit,
    rollback,
    testConnection,
    closePool
};
