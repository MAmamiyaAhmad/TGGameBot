import fs from "fs";
import path from "path";

const logFilePath = path.join(__dirname, "app.log");

export function log(message: string): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage);
  fs.appendFileSync(logFilePath, logMessage, { encoding: "utf8" });
}
