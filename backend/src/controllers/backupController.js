const { sql, poolPromise, config } = require("../config/dbConfig");
const path = require("path");
const fs = require("fs");

const backupDatabase = async (req, res) => {
  try {
    const pool = await poolPromise;
    const backupPath = path.join(__dirname, "../../backups");
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath);
    }
    const fileName = `backup_${new Date().toISOString().replace(/:/g, "-")}.bak`;
    const fullPath = path.join(backupPath, fileName);

    const query = `BACKUP DATABASE ${process.env.DB_NAME} TO DISK = '${fullPath}'`;
    await pool.request().query(query);

    res.status(200).json({ message: "Backup successful", file: fileName });
  } catch (error) {
    console.error("Backup error:", error);
    res.status(500).json({ error: "Backup failed" });
  }
};

const restoreDatabase = async (req, res) => {
  try {
    const { fileName } = req.body;
    if (!fileName) {
      return res.status(400).json({ error: "File name is required" });
    }

    const pool = await poolPromise;
    const backupPath = path.join(__dirname, "../../backups", fileName);

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: "Backup file not found" });
    }

    // Create a new connection to master database for restore
    const masterConfig = {
      ...config,
      database: 'master'
    };
    const masterPool = new sql.ConnectionPool(masterConfig);
    await masterPool.connect();

    try {
      // Kill all user connections to the database
      const killQuery = `
        DECLARE @kill varchar(8000) = '';
        SELECT @kill = @kill + 'KILL ' + CONVERT(varchar(5), session_id) + ';'
        FROM sys.dm_exec_sessions
        WHERE database_id = db_id('${process.env.DB_NAME}')
        AND session_id <> @@SPID;
        EXEC(@kill);
      `;
      await masterPool.request().query(killQuery);

      // Set database to single user mode
      await masterPool.request().query(`ALTER DATABASE ${process.env.DB_NAME} SET SINGLE_USER WITH ROLLBACK IMMEDIATE`);

      const query = `RESTORE DATABASE ${process.env.DB_NAME} FROM DISK = '${backupPath}' WITH REPLACE`;
      await masterPool.request().query(query);

      // Set back to multi user
      await masterPool.request().query(`ALTER DATABASE ${process.env.DB_NAME} SET MULTI_USER`);

      res.status(200).json({ message: "Restore successful" });
    } finally {
      await masterPool.close();
    }
  } catch (error) {
    console.error("Restore error:", error);
    res.status(500).json({ error: "Restore failed" });
  }
};

const getBackupFiles = async (req, res) => {
  try {
    const backupPath = path.join(__dirname, "../../backups");
    if (!fs.existsSync(backupPath)) {
      return res.status(200).json({ files: [] });
    }
    const files = fs.readdirSync(backupPath).filter(file => file.endsWith('.bak'));
    res.status(200).json({ files });
  } catch (error) {
    console.error("Get backup files error:", error);
    res.status(500).json({ error: "Failed to get backup files" });
  }
};

module.exports = {
  backupDatabase,
  restoreDatabase,
  getBackupFiles
};