require("dotenv").config();
const { startCronJob } = require("./cron/job");

console.log("App started...");

startCronJob();