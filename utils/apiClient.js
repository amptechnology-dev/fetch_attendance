const axios = require("axios");
require("dotenv").config();

const sendAttendanceLogs = async (logs) => {
  try {
    const seen = new Set();

    const formattedLogs = logs
      .map((log) => {
        const time = log.entryTime || log.exitTime;
        if (!time) return null;

        // ✅ FIX 1: proper date object
        const dateObj = new Date(time);

        if (isNaN(dateObj.getTime())) {
          console.log("❌ Invalid date:", time);
          return null;
        }

        // ✅ FIX 2: IST → UTC correction (VERY IMPORTANT)
        const correctedTime = new Date(
          dateObj.getTime() - 5.5 * 60 * 60 * 1000
        );

        // ✅ FIX 3: duplicate prevention key
        const key = `${log.staffId}_${correctedTime.toISOString()}`;

        if (seen.has(key)) return null;
        seen.add(key);

        const direction = log.entryTime ? "in" : "out";

        return {
          deviceUserId: String(log.staffId),
          recordTime: correctedTime.toISOString(), // ✅ ALWAYS ISO
          direction,
          remarks: log.remarks || "Pushed from local agent",
        };
      })
      .filter(Boolean);

    console.log("📊 Final logs count:", formattedLogs.length);

    if (formattedLogs.length === 0) {
      console.log("❌ No valid logs to send");
      return;
    }

    const payload = {
      officeId: process.env.OFFICE_ID,
      deviceSn: process.env.DEVICE_SN,
      logs: formattedLogs,
    };

    console.log("📤 Sending payload:", payload);

    const response = await axios.post(process.env.POST_API, payload, {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ API Response:", JSON.stringify(response.data));

    return response.data;
  } catch (error) {
    console.error("❌ API Error:", error.response?.data || error.message);
    throw error;
  }
};

module.exports = { sendAttendanceLogs };