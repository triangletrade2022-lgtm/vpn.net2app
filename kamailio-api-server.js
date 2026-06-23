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

// ── Configuration ──────────────────────────────────────────────────
const DB_PATH = '/var/lib/kamailio/kamailio.db';
const PORT = 3001;
const HOST = '127.0.0.1'; // bind to localhost only for security

let db = null;
let dbConnected = false;
let dbError = null;
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
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

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

// ── Request Router ─────────────────────────────────────────────────
function handleRequest(req, res) {
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
  const match = pathname.match(/^\/api\/kamailio\/subscribers\/([^/]+)$/);
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

  // ── 404
  error(res, 404, `Not found: ${method} ${pathname}`);
}

// ── Start Server ───────────────────────────────────────────────────
function start() {
  // Try initial DB connection (non-fatal if Kamailio isn't installed yet)
  connectDb();

  const server = http.createServer(handleRequest);

  server.listen(PORT, HOST, () => {
    const status = dbConnected
      ? `✅ Database connected: ${DB_PATH}`
      : `⚠️  Database unavailable: ${dbError || DB_PATH}`;
    console.log(`
╔════════════════════════════════════════════════════════╗
║       Kamailio Subscriber API Server                  ║
║       Listening on http://${HOST}:${PORT}               ║
║       ${status.padEnd(45)}║
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
