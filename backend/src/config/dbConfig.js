const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    connectTimeout: 30000
  }
};

let pool;

async function connectWithRetry() {
  try {
    pool = await new sql.ConnectionPool(config).connect();
    console.log("✅ Connected to SQL Server (Wanderly DB)");
    return pool;
  } catch (err) {
    console.error("❌ DB Connection failed, retrying in 5 seconds...", err.message);
    setTimeout(connectWithRetry, 5000); // Thử lại sau 5 giây
  }
}

const poolPromise = connectWithRetry();

module.exports = { sql, poolPromise, config };