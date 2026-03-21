#!/usr/bin/env node
/**
 * ปล่อยพอร์ตที่ระบุ (ค่าเริ่มต้น 3000) — ใช้ก่อน nest start
 * macOS / Linux: lsof
 * Windows: netstat + taskkill
 */
const { execSync } = require('child_process');

const port = String(process.argv[2] || process.env.PORT || '3000').trim();

function log(msg) {
  console.log(`[free-port] ${msg}`);
}

function killUnix() {
  try {
    const out = execSync(`lsof -tiTCP:${port} -sTCP:LISTEN`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    if (!out) return;
    const pids = [...new Set(out.split(/\n/).filter(Boolean))];
    for (const pid of pids) {
      const n = parseInt(pid, 10);
      if (!Number.isFinite(n)) continue;
      try {
        process.kill(n, 'SIGKILL');
      } catch (_) {
        /* ignore */
      }
    }
    log(`ปิดโปรเซสบนพอร์ต ${port} แล้ว (PID: ${pids.join(', ')})`);
  } catch (_) {
    // ไม่มีโปรเซสฟังพอร์ตนี้
  }
}

function killWindows() {
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, {
      encoding: 'utf8',
      shell: 'cmd.exe',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      if (!line.includes('LISTENING')) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (/^\d+$/.test(pid)) pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore', shell: 'cmd.exe' });
      } catch (_) {}
    }
    if (pids.size) log(`ปิดโปรเซสบนพอร์ต ${port} แล้ว (Windows PID: ${[...pids].join(', ')})`);
  } catch (_) {}
}

if (process.platform === 'win32') {
  killWindows();
} else {
  killUnix();
}
