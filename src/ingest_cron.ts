import cron from "node-cron";
import { spawn, ChildProcess } from "child_process";

let task : cron.ScheduledTask | null = null;
let runningProcess : ChildProcess | null = null;

// Function to run ingestion safely
function runIngestion() {
  if (runningProcess) {
    console.log("Ingestion already running. Skipping.");
    return;
  }

  console.log("Starting ingestion...");

  runningProcess = spawn("node", ["dist/ingest.js"], {
    stdio: "inherit",
  });

  runningProcess.on("close", (code) => {
    console.log(`Ingestion finished with code ${code}`);
    runningProcess = null;
  });
}

// Start cron scheduler
function startCron() {
  console.log("Running ingestion immediately...");
  runIngestion();

  task = cron.schedule("0 3 * * *", () => {
    console.log("3 AM cron triggered");
    runIngestion();
  });

  task.start();

  console.log("Cron job scheduled for 3 AM daily.");
}

// Stop cron scheduler
function stopCron() {
  if (task) {
    task.stop();
    console.log("Cron job stopped.");
  } else {
    console.log("Cron not running.");
  }

  if (runningProcess) {
    runningProcess.kill();
    console.log("Stopped active ingestion process.");
  }
}

// CLI control
const command: string | undefined = process.argv[2];

if (command === "start") {
  startCron();
} else if (command === "stop") {
  stopCron();
} else {
  console.log("Usage:");
  console.log("npm run ingest-cron start");
  console.log("npm run ingest-cron stop");
}