const fs = require("fs");
const path = require("path");
const { poolPromise } = require("../config/db");

const syncFile = path.join(__dirname, "../lastSync.json");

const getLastSyncTime = () => {
  if (!fs.existsSync(syncFile)) return null;
  const data = JSON.parse(fs.readFileSync(syncFile));
  return data.lastSync;
};

const updateLastSyncTime = (time) => {
  fs.writeFileSync(syncFile, JSON.stringify({ lastSync: time }));
};

const getAttendanceLogs = async () => {
  const pool = await poolPromise;

  const lastSync = getLastSyncTime();
  console.log("⏱ Last Sync:", lastSync);

  const currentYear = new Date().getFullYear();

  const tablesResult = await pool.request().query(`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_NAME LIKE 'DeviceLogs_%_${currentYear}'
  `);

  const tables = tablesResult.recordset.map((t) => t.TABLE_NAME);

  if (tables.length === 0) return [];

  // 🔥 FILTER NEW DATA ONLY
  const condition = lastSync ? `WHERE LogDate > '${lastSync}'` : "";

  const unionQuery = tables
    .map(
      (table) => `
      SELECT DeviceLogId, DeviceId, UserId, LogDate, C1 
      FROM ${table} ${condition}
    `,
    )
    .join(" UNION ALL ");

  const finalQuery = `${unionQuery} ORDER BY LogDate ASC`;

  const result = await pool.request().query(finalQuery);

  const logs = result.recordset;

  if (!logs.length) {
    console.log("✅ No new logs");
    return [];
  }

  // 🔥 UPDATE LAST SYNC
  const latestTime = logs[logs.length - 1].LogDate.toISOString();
  updateLastSyncTime(latestTime);

  console.log("🆕 New logs:", logs.length);

  return logs.map((log) => {
    const direction = String(log.C1).trim().toLowerCase();

    return {
      staffId: String(log.UserId),
      deviceId: String(log.DeviceId), 
      recordTime: log.LogDate,
      entryTime: direction === "in" ? log.LogDate : null,
      exitTime: direction === "out" ? log.LogDate : null,
      date: log.LogDate.toISOString().split("T")[0],
      remarks: "Pushed from local agent",
    };
  });
};

module.exports = { getAttendanceLogs };
