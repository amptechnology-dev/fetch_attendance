const axios = require("axios");
require("dotenv").config();

const sendAttendanceLogs = async (logs) => {
  try {
    const formattedLogs = logs
      .map((log) => {
        // ✅ entry বা exit time detect
        const time = log.entryTime || log.exitTime;

        if (!time) {
          console.log("❌ Missing time:", log);
          return null;
        }

        const dateObj = new Date(time);

        if (isNaN(dateObj.getTime())) {
          console.log("❌ Invalid date:", time);
          return null;
        }

        // ✅ direction fix
        const direction = log.entryTime ? "in" : "out";

        return {
          deviceUserId: String(log.staffId),
          recordTime: dateObj.toISOString(),
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

    console.log("✅ API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ API Error:", error.response?.data || error.message);
    throw error;
  }
};

module.exports = { sendAttendanceLogs };