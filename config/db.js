const sql = require("mssql");

const config = {
    user: "essl",
    password: "essl",
    server: "localhost",
    port: 1433, 
    database: "etimetracklite1",
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log("✅ Connected to SQL Server");
        return pool;
    })
    .catch(err => console.log("❌ Database Connection Failed:", err));

module.exports = { sql, poolPromise };