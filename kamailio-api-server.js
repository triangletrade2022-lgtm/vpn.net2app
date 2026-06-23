#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════
 *  Kamailio Subscriber Sync API Server
 *  Reads /var/lib/kamailio/kamailio.db and serves REST API on :3001
 *
 *  Start:    node kamailio-api-server.js
 *  Test:     curl http://127.0.0.1:3001/api/kamailio/subscribers
 *  Install:  cp kamailio-api.service /etc/systemd/system/
 *            systemctl enable kamailio-api && systemctl start kamailio-api
 * ═══════════════════════════════════════════════════════════════════
 *
 *  API Endpoints:
 *  ────────────────────────────────────────────────────────────────
 *  GET /api/kamailio/subscribers
 *    → { count: 42, subscribers: [{ id, username, domain, password,
 *         ha1, ha1b, email_address }] }
 *
 *  GET /api/kamailio/subscribers/:username
 *    → { subscriber: { id, username, domain, password, ... } }
 *
 *  GET /health
 *    → { status: "ok", db: "connected"|"error", uptime: 1234 }
 */

'use strict';

import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

// ── Configuration ──────────────────────────────────────────────────
const DB_PATH = '/var/lib/kamailio/kamailio.db';
const DEVICES_PATH = '/var/lib/kamailio/devices.json';
const PORT = parseInt(process.env.PORT, 10) || 3001;
const HOST = '127.0.0.1'; // bind to localhost only for security
const WG_SERVER_PUBLIC_KEY = 'YOUR_SERVER_PUBLIC_KEY_HERE'; // admin replaces this
const WG_SERVER_ENDPOINT = '51.161.45.126:51820';
const WG_SERVER_ALLOWED_IPS = '10.0.0.0/24, 0.0.0.0/0';
const WG_SUBNET = '10.0.0.';

let db = null;
let dbConnected = false;
let dbError = null;
let devices = [];
const startTime = Date.now();

// ── Database Connection ────────────────────────────────────────────
function connectDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      dbError = `Database not found: ${DB_PATH}`;
      dbConnected = false;
      return false;
    }
    db = new DatabaseSync(DB_PATH);
    // Verify the table exists
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='subscriber'"
    ).all();
    if (tables.length === 0) {
      dbError = 'subscriber table not found in database';
      dbConnected = false;
      return false;
    }
    dbConnected = true;
    dbError = null;
    return true;
  } catch (err) {
    dbError = err.message;
    dbConnected = false;
    return false;
  }
}

// ── Query Helpers ──────────────────────────────────────────────────
function getAllSubscribers() {
  if (!db || !dbConnected) {
    if (!connectDb()) throw new Error(dbError);
  }
  try {
    const rows = db.prepare('SELECT * FROM subscriber').all();
    return rows;
  } catch (err) {
    // Reconnect on next attempt in case DB was replaced
    dbConnected = false;
    throw err;
  }
}

function getSubscriberByUsername(username) {
  if (!db || !dbConnected) {
    if (!connectDb()) throw new Error(dbError);
  }
  try {
    const row = db.prepare('SELECT * FROM subscriber WHERE username = ?').get(username);
    return row || null;
  } catch (err) {
    dbConnected = false;
    throw err;
  }
}

// ── CORS Headers ───────────────────────────────────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ── Devices Storage ────────────────────────────────────────────────
function loadDevices() {
  try {
    if (fs.existsSync(DEVICES_PATH)) {
      const raw = fs.readFileSync(DEVICES_PATH, 'utf-8');
      devices = JSON.parse(raw);
      if (!Array.isArray(devices)) devices = [];
    } else {
      devices = [];
    }
  } catch (err) {
    devices = [];
  }
}

function saveDevices() {
  try {
    const dir = path.dirname(DEVICES_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DEVICES_PATH, JSON.stringify(devices, null, 2));
  } catch (err) {
    console.error('Failed to save devices:', err.message);
  }
}

function findDevice(deviceId) {
  return devices.find(d => d.device_id === deviceId);
}

function nextClientIp() {
  // Assign IPs starting from .2 (server is .1)
  const used = new Set(devices.map(d => d.wg_ip));
  for (let i = 2; i < 255; i++) {
    const ip = WG_SUBNET + i;
    if (!used.has(ip)) return ip;
  }
  return WG_SUBNET + '254'; // fallback
}

// ── WireGuard Config Generator ─────────────────────────────────────
function generateWgConfig(device) {
  // In production, each device should have a unique private key
  // For auto-provisioning, the server generates one or the agent provides it
  // Here we generate a placeholder that the admin can replace
  return `[Interface]
# VPN.net Auto-Provisioned Client
# Device: ${device.device_id}
# Model: ${device.model || 'unknown'}
Address = ${device.wg_ip}/24
PrivateKey = [PLACEHOLDER_REPLACE_WITH_CLIENT_PRIVATE_KEY]
# Optional: DNS = 1.1.1.1

[Peer]
# VPN.net Server (OVH)
PublicKey = ${WG_SERVER_PUBLIC_KEY}
Endpoint = ${WG_SERVER_ENDPOINT}
AllowedIPs = ${WG_SERVER_ALLOWED_IPS}
PersistentKeepalive = 25
`;
}

// ── JSON Response Helper ───────────────────────────────────────────
function json(res, status, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    ...CORS_HEADERS,
  });
  res.end(body);
}

function error(res, status, message) {
  json(res, status, { error: true, message });
}

// ── Request Body Parser ────────────────────────────────────────────
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

// ── Request Router ─────────────────────────────────────────────────
async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  // ── Health Check
  if (pathname === '/health') {
    return json(res, 200, {
      status: 'ok',
      db: dbConnected ? 'connected' : 'error',
      dbPath: DB_PATH,
      dbError: dbError,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      version: '1.0.0',
      registeredDevices: devices.length,
    });
  }

  // ── GET /api/kamailio/subscribers
  if (pathname === '/api/kamailio/subscribers' && method === 'GET') {
    try {
      const subscribers = getAllSubscribers();
      return json(res, 200, {
        count: subscribers.length,
        subscribers,
      });
    } catch (err) {
      return error(res, 500, `Database error: ${err.message}`);
    }
  }

  // ── GET /api/kamailio/subscribers/:username
  let match = pathname.match(/^\/api\/kamailio\/subscribers\/([^/]+)$/);
  if (match && method === 'GET') {
    const username = decodeURIComponent(match[1]);
    try {
      const subscriber = getSubscriberByUsername(username);
      if (!subscriber) {
        return error(res, 404, `Subscriber '${username}' not found`);
      }
      return json(res, 200, { subscriber });
    } catch (err) {
      return error(res, 500, `Database error: ${err.message}`);
    }
  }

  // ────────────────────────────────────────────────────────────────
  //  DEVICE REGISTRATION ENDPOINTS
  // ────────────────────────────────────────────────────────────────

  // ── POST /api/device/register
  if (pathname === '/api/device/register' && method === 'POST') {
    try {
      const body = await parseBody(req);
      
      // Validate required fields
      if (!body.device_id) {
        return error(res, 400, 'Missing required field: device_id');
      }

      const existing = findDevice(body.device_id);
      if (existing) {
        // Device already registered — update timestamp
        existing.last_seen = new Date().toISOString();
        existing.mac = body.mac || existing.mac;
        existing.hostname = body.hostname || existing.hostname;
        existing.version = body.version || existing.version;
        existing.status = 'online';
        saveDevices();
        console.log(`Device re-registered: ${body.device_id}`);
        return json(res, 200, {
          registered: true,
          device_id: body.device_id,
          wg_ip: existing.wg_ip,
          message: 'Device already registered — updated',
        });
      }

      // New device — assign WireGuard IP
      const wgIp = nextClientIp();
      const now = new Date().toISOString();
      const device = {
        device_id: body.device_id,
        mac: body.mac || '',
        model: body.model || 'unknown',
        arch: body.arch || 'unknown',
        hostname: body.hostname || '',
        version: body.version || '1.0.0',
        wg_ip: wgIp,
        status: 'online',
        first_seen: now,
        last_seen: now,
      };

      devices.push(device);
      saveDevices();
      console.log(`New device registered: ${body.device_id} → ${wgIp}`);

      return json(res, 201, {
        registered: true,
        device_id: body.device_id,
        wg_ip: wgIp,
        server_public_key: WG_SERVER_PUBLIC_KEY,
        server_endpoint: WG_SERVER_ENDPOINT,
        message: 'Device registered successfully',
      });
    } catch (err) {
      return error(res, 500, `Registration error: ${err.message}`);
    }
  }

  // ── GET /api/device/config/:id
  match = pathname.match(/^\/api\/device\/config\/([^/]+)$/);
  if (match && method === 'GET') {
    const deviceId = decodeURIComponent(match[1]);
    const device = findDevice(deviceId);

    if (!device) {
      return error(res, 404, `Device '${deviceId}' not found. Register first via POST /api/device/register`);
    }

    // Update last_seen
    device.last_seen = new Date().toISOString();
    saveDevices();

    const wgConfig = generateWgConfig(device);

    // Return raw config as text/plain
    const body = wgConfig;
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(body),
      ...CORS_HEADERS,
    });
    return res.end(body);
  }

  // ── POST /api/device/heartbeat
  if (pathname === '/api/device/heartbeat' && method === 'POST') {
    try {
      const body = await parseBody(req);
      
      if (!body.device_id) {
        return error(res, 400, 'Missing required field: device_id');
      }

      const device = findDevice(body.device_id);
      if (!device) {
        // Unknown device — auto-register on heartbeat (agent may have missed register response)
        const wgIp = nextClientIp();
        const now = new Date().toISOString();
        devices.push({
          device_id: body.device_id,
          mac: '',
          model: 'auto-detected',
          arch: 'unknown',
          hostname: '',
          version: '1.0.0',
          wg_ip: wgIp,
          status: body.status || 'online',
          first_seen: now,
          last_seen: now,
          wg_status: body.wg || '',
        });
        saveDevices();
        console.log(`Device auto-registered via heartbeat: ${body.device_id} → ${wgIp}`);
        return json(res, 201, {
          registered: true,
          device_id: body.device_id,
          wg_ip: wgIp,
          message: 'Auto-registered via heartbeat',
        });
      }

      // Update existing device
      device.last_seen = new Date().toISOString();
      device.status = body.status || 'online';
      if (body.wg) device.wg_status = body.wg;
      saveDevices();

      return json(res, 200, { received: true, device_id: body.device_id });
    } catch (err) {
      return error(res, 500, `Heartbeat error: ${err.message}`);
    }
  }

  // ── DELETE /api/device/revoke/:id — Revoke a device
  match = pathname.match(/^\/api\/device\/revoke\/([^/]+)$/);
  if (match && method === 'DELETE') {
    const deviceId = decodeURIComponent(match[1]);
    const idx = devices.findIndex(d => d.device_id === deviceId);
    if (idx === -1) {
      return error(res, 404, `Device '${deviceId}' not found`);
    }
    devices.splice(idx, 1);
    saveDevices();
    console.log(`Device revoked: ${deviceId}`);
    return json(res, 200, { revoked: true, device_id: deviceId, message: 'Device revoked successfully' });
  }

  // ── GET /api/devices — List all registered devices
  if (pathname === '/api/devices' && method === 'GET') {
    return json(res, 200, {
      count: devices.length,
      devices: devices.map(d => ({
        device_id: d.device_id,
        hostname: d.hostname,
        model: d.model,
        arch: d.arch,
        wg_ip: d.wg_ip,
        status: d.status,
        first_seen: d.first_seen,
        last_seen: d.last_seen,
        version: d.version,
      })),
    });
  }

  // ── 404
  error(res, 404, `Not found: ${method} ${pathname}`);
}

// ── Start Server ───────────────────────────────────────────────────
function start() {
  // Load registered devices
  loadDevices();

  // Try initial DB connection (non-fatal if Kamailio isn't installed yet)
  connectDb();

  const server = http.createServer(handleRequest);

  server.listen(PORT, HOST, () => {
    const status = dbConnected
      ? `✅ Database connected: ${DB_PATH}`
      : `⚠️  Database unavailable: ${dbError || DB_PATH}`;
    const deviceCount = devices.length;
    console.log(`
╔════════════════════════════════════════════════════════╗
║       Kamailio Subscriber + Device API Server         ║
║       Listening on http://${HOST}:${PORT}               ║
║       ${status.padEnd(45)}║
║       ${`📱 ${deviceCount} registered device(s)`.padEnd(45)}║
╚════════════════════════════════════════════════════════╝
`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\nShutting down...');
    if (db) {
      try { db.close(); } catch {}
    }
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();
