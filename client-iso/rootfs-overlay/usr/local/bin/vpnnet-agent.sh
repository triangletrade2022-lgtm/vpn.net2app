#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  VPN.net Client Agent
#  v1.0.0 — Auto-register device, download config, start VPN
# ═══════════════════════════════════════════════════════════

set -e

API_BASE="${API_BASE:-https://51.161.45.126:3001}"
AGENT_VERSION="1.0.0"
LOG_FILE="/var/log/vpnnet-agent.log"
STATE_FILE="/etc/vpnnet/device.json"
WG_CONF="/etc/wireguard/wg0.conf"

log()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }
die()  { log "FATAL: $*"; exit 1; }

# ── Detect hardware ──
detect_hardware() {
  ARCH=$(uname -m)
  case "$ARCH" in
    x86_64)      MODEL="pc-x86_64" ;;
    aarch64|armv7l) MODEL="raspberry-pi" ;;
    mips|mipsel|arm*) MODEL="router" ;;
    *)           MODEL="unknown" ;;
  esac
  log "Hardware: $ARCH → $MODEL"
}

# ── Get unique device ID from MAC ──
get_device_id() {
  local mac
  # Use first non-loopback ethernet interface
  mac=$(ip link show | awk '/ether/ && !/lo:/ {print $2; exit}')
  if [ -z "$mac" ]; then
    mac=$(cat /sys/class/net/*/address 2>/dev/null | head -1)
  fi
  if [ -z "$mac" ]; then
    mac="DE:AD:BE:EF:00:$(printf '%02x' $((RANDOM % 256)))"
    log "WARNING: No MAC found, using generated: $mac"
  fi
  DEVICE_ID=$(echo "$mac" | tr -d ':')
  log "Device ID (MAC): $DEVICE_ID ($mac)"
}

# ── Check internet connectivity ──
check_connectivity() {
  log "Checking connectivity to $API_BASE ..."
  if curl -sk --max-time 10 "$API_BASE/health" >/dev/null 2>&1; then
    log "✅ Server reachable"
    return 0
  else
    log "⚠️  Server not reachable yet (network may not be ready)"
    return 1
  fi
}

# ── Register device with server ──
register_device() {
  log "Registering device $DEVICE_ID ..."

  local payload
  payload=$(cat <<EOF
{
  "device_id": "$DEVICE_ID",
  "mac": "$(cat /sys/class/net/*/address 2>/dev/null | head -1)",
  "model": "$MODEL",
  "arch": "$ARCH",
  "hostname": "$(hostname)",
  "version": "$AGENT_VERSION"
}
EOF
)

  local response
  response=$(curl -sk --max-time 15 \
    -X POST "$API_BASE/api/device/register" \
    -H "Content-Type: application/json" \
    -d "$payload" 2>&1) || {
    log "⚠️  Registration request failed"
    return 1
  }

  # Save response
  mkdir -p "$(dirname "$STATE_FILE")"
  echo "$response" > "$STATE_FILE"
  log "✅ Device registered: $(echo "$response" | head -c 200)"
}

# ── Download WireGuard config ──
download_config() {
  log "Downloading WireGuard config for $DEVICE_ID ..."

  local config
  config=$(curl -sk --max-time 20 \
    -X GET "$API_BASE/api/device/config/$DEVICE_ID" 2>&1) || {
    log "⚠️  Config download failed"
    return 1
  }

  # Check if config looks valid
  if echo "$config" | grep -q "^\[Interface\]"; then
    mkdir -p /etc/wireguard
    echo "$config" > "$WG_CONF"
    chmod 600 "$WG_CONF"
    log "✅ WireGuard config saved to $WG_CONF"
    return 0
  else
    log "⚠️  Invalid config received (no [Interface] section)"
    log "Response: $(echo "$config" | head -c 200)"
    return 1
  fi
}

# ── Start WireGuard tunnel ──
start_tunnel() {
  if [ ! -f "$WG_CONF" ]; then
    log "⚠️  No WireGuard config found at $WG_CONF"
    return 1
  fi

  log "Starting WireGuard tunnel ..."

  # Bring up the interface
  if wg-quick up wg0 2>/dev/null || wg setconf wg0 "$WG_CONF" 2>/dev/null; then
    log "✅ WireGuard tunnel is UP"
    # Show connection status
    wg show 2>/dev/null | tee -a "$LOG_FILE"
    return 0
  else
    log "⚠️  Failed to start WireGuard"
    return 1
  fi
}

# ── Send heartbeat ──
heartbeat_loop() {
  while true; do
    sleep 300  # 5 minutes
    local wg_status=$(wg show wg0 2>/dev/null | head -3 | tr '\n' ' ')
    curl -sk --max-time 10 \
      -X POST "$API_BASE/api/device/heartbeat" \
      -H "Content-Type: application/json" \
      -d "{\"device_id\":\"$DEVICE_ID\",\"status\":\"online\",\"wg\":\"$wg_status\"}" \
      >/dev/null 2>&1 || true
  done &
  log "✅ Heartbeat loop started (PID $!)"
}

# ═══════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════

log "═══════════════════════════════════════════════════"
log "  VPN.net Client Agent v$AGENT_VERSION starting"
log "═══════════════════════════════════════════════════"

detect_hardware
get_device_id

# Retry loop for connectivity (network may take time after boot)
for attempt in 1 2 3 4 5; do
  if check_connectivity; then
    break
  fi
  log "Retry $attempt/5 in 10 seconds ..."
  sleep 10
done

register_device || log "Registration deferred"
download_config || log "Config download deferred"
start_tunnel || log "Tunnel start deferred"
heartbeat_loop

log "✅ Agent initialization complete — entering main loop"
# Keep running so systemd (Type=simple) keeps the service alive
# Heartbeats and other periodic tasks run in this loop
wait
