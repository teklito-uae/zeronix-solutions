import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

function run(name, args, cwd) {
  const child = spawn(npmCmd, args, { cwd, stdio: "inherit", shell: isWin });
  child.on("exit", (code) => {
    console.log(`[${name}] exited with code ${code}`);
  });
  return child;
}

function runPhp(name, args, cwd) {
  const child = spawn("php", args, { cwd, stdio: "inherit", shell: isWin });
  child.on("exit", (code) => {
    console.log(`[${name}] exited with code ${code}`);
  });
  return child;
}

const server = runPhp("backend", ["artisan", "serve", "--port=8000"], path.join(root, "backend"));
const client = run("client", ["run", "dev", "--", "--port", "5174"], path.join(root, "client"));

function shutdown() {
  server.kill();
  client.kill();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
