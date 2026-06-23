#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  Client-Side Installation — IPTSP Web Dashboard
#  Installs & serves the IPTSP Manager web GUI on any Linux server
#  Usage: curl -sL https://git.io/... | sudo bash
# ═══════════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }

REPO="https://github.com/triangletrade2022-lgtm/vpn.net2app"
INSTALL_DIR="/var/www/iptsp"

echo ""
echo "════════════════════════════════════════"
echo "  IPTSP Manager — Client Dashboard"
echo "════════════════════════════════════════"

# Check root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root: sudo bash $0${NC}"
    exit 1
fi

# 1. Install nginx
if ! command -v nginx &>/dev/null; then
    apt-get update -qq && apt-get install -y -qq nginx
    ok "Nginx installed"
else
    ok "Nginx already installed"
fi

# 2. Download the built dashboard HTML
mkdir -p "$INSTALL_DIR"
curl -sL "$REPO/raw/master/dist/index.html" -o "$INSTALL_DIR/index.html"
ok "Dashboard downloaded to $INSTALL_DIR/index.html"

# 3. Configure nginx
cat > /etc/nginx/sites-available/iptsp <<'NGINX'
server {
    listen 80;
    server_name _;
    root /var/www/iptsp;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
}
NGINX

ln -sf /etc/nginx/sites-available/iptsp /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
ok "Nginx configured — serving on port 80"

# Done
echo ""
echo "════════════════════════════════════════"
echo "  ✅ CLIENT INSTALLATION COMPLETE"
echo "════════════════════════════════════════"
echo ""
echo "  Open http://$(curl -s ifconfig.me 2>/dev/null || echo 'your-server-ip') in your browser"
echo "  Default login: admin / admin123"
echo ""
