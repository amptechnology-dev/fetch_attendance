const { poolPromise } = require("../config/db");

const getAttendanceLogs = async () => {
  const pool = await poolPromise;

  // ✅ Get current year dynamically
  const currentYear = new Date().getFullYear();

  console.log("📅 Fetching logs for year:", currentYear);

  // 🔹 Step 1: Get all tables for that year
  const tablesResult = await pool.request().query(`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_NAME LIKE 'DeviceLogs_%_${currentYear}'
  `);

  const tables = tablesResult.recordset.map(t => t.TABLE_NAME);

  console.log("📦 Tables found:", tables);

  if (tables.length === 0) {
    console.log("❌ No tables found for this year");
    return [];
  }

  // 🔹 Step 2: Create UNION query dynamically
  const unionQuery = tables
    .map(table => `SELECT DeviceLogId, DeviceId, UserId, LogDate, C1 FROM ${table}`)
    .join(" UNION ALL ");

  const finalQuery = `${unionQuery} ORDER BY LogDate DESC`;

  const result = await pool.request().query(finalQuery);

  const logs = result.recordset;

  console.log("📊 Total Logs:", logs.length);

  // 🔹 Step 3: Format logs
  const formattedLogs = logs.map((log) => {
    const direction = String(log.C1).trim().toLowerCase();

    let entryTime = null;
    let exitTime = null;

    if (direction === "in") {
      entryTime = log.LogDate;
    } else if (direction === "out") {
      exitTime = log.LogDate;
    }

    return {
      staffId: String(log.UserId),
      deviceId: String(log.DeviceId),

      // ✅ IMPORTANT (backend er jonno must)
      recordTime: log.LogDate,

      entryTime,
      exitTime,

      date: log.LogDate.toISOString().split("T")[0],
      remarks: "Pushed from local agent",
    };
  });

  return formattedLogs;
};

module.exports = { getAttendanceLogs };