const cron = require("node-cron");
const { getAttendanceLogs } = require("../services/attendanceService");
const { sendAttendanceLogs } = require("../utils/apiClient");

// 🔥 chunk function
const chunkArray = (array, size) => {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

const startCronJob = () => {
  cron.schedule("* * * * *", async () => {
    console.log("⏰ Cron Running:", new Date().toLocaleString());

    try {
      const logs = await getAttendanceLogs();

      if (!logs.length) {
        console.log("❌ No data found");
        return;
      }

      console.log(`📊 Total Logs: ${logs.length}`);

      const chunks = chunkArray(logs, 50);

      for (let i = 0; i < chunks.length; i++) {
        console.log(`🚀 Sending batch ${i + 1}/${chunks.length}`);

        await sendAttendanceLogs(chunks[i]);
      }

      console.log("🎉 All logs sent successfully!");
    } catch (error) {
      console.log("Error...", error);
    }
  });
};

module.exports = { startCronJob };
