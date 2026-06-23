#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  Server-Side Installation — IPTSP Asterisk + WireGuard
#  Deploys full SIP trunking server (Asterisk PBX, WireGuard VPN, Firewall)
#  Usage: curl -sL https://git.io/... | sudo bash
#  Or: wget -qO- https://git.io/... | sudo bash
# ═══════════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
ok()  { echo -e "${GREEN}[✓]${NC} $1"; }
info(){ echo -e "${CYAN}[i]${NC} $1"; }

REPO="https://github.com/triangletrade2022-lgtm/vpn.net2app"

echo ""
echo "════════════════════════════════════════"
echo "  IPTSP Server — Asterisk + WireGuard"
echo "════════════════════════════════════════"

# Check root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root: sudo bash $0${NC}"
    exit 1
fi

# Ensure curl is available
command -v curl >/dev/null 2>&1 || apt-get update -qq && apt-get install -y -qq curl

# Step 1 — Download & run the deployment script
info "Downloading deployment script..."
curl -sL "$REPO/raw/master/deploy_iptsp.sh" -o /tmp/deploy_iptsp.sh
chmod +x /tmp/deploy_iptsp.sh

echo ""
info "Starting IPTSP deployment..."
echo "────────────────────────────────────────"
bash /tmp/deploy_iptsp.sh
echo "────────────────────────────────────────"

# Step 2 — Download optional config scripts
for script in setup_wireguard_tunnel.sh sync_asterisk_config.sh; do
    curl -sL "$REPO/raw/master/$script" -o "/opt/iptsp/$script" 2>/dev/null || true
done
chmod +x /opt/iptsp/*.sh 2>/dev/null || true
ok "Optional scripts saved to /opt/iptsp/"

info "WireGuard tunnel setup:  bash /opt/iptsp/setup_wireguard_tunnel.sh"
info "Config sync:             bash /opt/iptsp/sync_asterisk_config.sh"
info "Credentials:             cat /root/.iptsp_credentials"

echo ""
echo "════════════════════════════════════════"
echo "  ✅ SERVER INSTALLATION COMPLETE"
echo "════════════════════════════════════════"
echo ""
echo "  Asterisk status: systemctl status asterisk"
echo "  Check endpoints: asterisk -rx 'pjsip show endpoints'"
echo "  WireGuard:       wg show"
echo "  Dashboard:       See install-client.sh"
echo ""
