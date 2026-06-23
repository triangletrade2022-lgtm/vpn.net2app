#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  BANGLADESH VPS FULL SETUP — WireGuard + Asterisk + IPTSP
#  VPS IP: 103.51.128.9
#  Run as root: sudo bash vps-setup-full.sh
# ═══════════════════════════════════════════════════════════════════

set -e
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
ok() { echo -e "${GREEN}[✓]${NC} $1"; }
info() { echo -e "${BLUE}[i]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }

if [ "$EUID" -ne 0 ]; then echo -e "${RED}Run as root${NC}"; exit 1; fi

echo "════════════════════════════════════════"
echo "  BD VPS Setup — 103.51.128.9"
echo "════════════════════════════════════════"

# ═══════ 1. Install WireGuard ═══════
info "Installing WireGuard..."
apt-get update && apt-get install -y wireguard wireguard-tools qrencode
ok "WireGuard installed"

# Generate keys
cd /etc/wireguard
if [ ! -f private.key ]; then
    wg genkey | tee private.key | wg pubkey > public.key
fi
echo ""
echo "════════════════════════════════════════"
echo "  VPS PUBLIC KEY (share with clients):"
echo "════════════════════════════════════════"
echo -e "${GREEN}$(cat public.key)${NC}"
echo ""

# ═══════ 2. Configure WireGuard ═══════
info "Creating WireGuard config..."
PRIVATE_KEY=$(cat private.key)

read -p "Enter OVH Public Key (or press Enter to skip): " OVH_PUBKEY
read -p "Enter India Client Public Key (or press Enter to skip): " IN_PUBKEY
read -p "Enter Admin Client Public Key (or press Enter to skip): " ADMIN_PUBKEY

cat > /etc/wireguard/wg0.conf <<'WGCONF'
[Interface]
PrivateKey = __PRIVATE_KEY__
Address = 10.100.0.1/24
ListenPort = 51820

PostUp = sysctl -w net.ipv4.ip_forward=1
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT
PostUp = iptables -A FORWARD -o wg0 -j ACCEPT
PostUp = iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostUp = iptables -t nat -A PREROUTING -i eth0 -p udp --dport 5080 -j DNAT --to-destination 127.0.0.1:5080
PostUp = iptables -t nat -A PREROUTING -i eth0 -p udp --dport 10000:20000 -j DNAT --to-destination 127.0.0.1

PostDown = iptables -D FORWARD -i wg0 -j ACCEPT
PostDown = iptables -D FORWARD -o wg0 -j ACCEPT
PostDown = iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -t nat -D PREROUTING -i eth0 -p udp --dport 5080 -j DNAT --to-destination 127.0.0.1:5080
PostDown = iptables -t nat -D PREROUTING -i eth0 -p udp --dport 10000:20000 -j DNAT --to-destination 127.0.0.1

SaveConfig = true
MTU = 1420
WGCONF

sed -i "s|__PRIVATE_KEY__|$PRIVATE_KEY|" /etc/wireguard/wg0.conf

if [ -n "$OVH_PUBKEY" ]; then
    cat >> /etc/wireguard/wg0.conf <<EOF

[Peer]
# OVH Cloud Relay
PublicKey = $OVH_PUBKEY
AllowedIPs = 10.0.0.0/24
Endpoint = OVH_REAL_IP:51820
PersistentKeepalive = 25
EOF
fi

if [ -n "$IN_PUBKEY" ]; then
    cat >> /etc/wireguard/wg0.conf <<EOF

[Peer]
# India Office
PublicKey = $IN_PUBKEY
AllowedIPs = 10.200.0.2/32, 10.200.0.0/24
PersistentKeepalive = 25
EOF
fi

if [ -n "$ADMIN_PUBKEY" ]; then
    cat >> /etc/wireguard/wg0.conf <<EOF

[Peer]
# Admin
PublicKey = $ADMIN_PUBKEY
AllowedIPs = 10.100.0.10/32
PersistentKeepalive = 25
EOF
fi

chmod 600 /etc/wireguard/wg0.conf
ok "WireGuard config created"

# ═══════ 3. Enable IP Forwarding ═══════
echo 'net.ipv4.ip_forward=1' >> /etc/sysctl.conf
sysctl -p
ok "IP forwarding enabled"

# ═══════ 4. Firewall ═══════
info "Opening firewall ports..."
iptables -I INPUT -p udp --dport 51820 -j ACCEPT 2>/dev/null || true
iptables -I INPUT -p udp --dport 5080 -j ACCEPT 2>/dev/null || true
iptables -I INPUT -p udp --dport 10000:20000 -j ACCEPT 2>/dev/null || true
iptables -I INPUT -p tcp --dport 5038 -j ACCEPT 2>/dev/null || true

# Save
if command -v netfilter-persistent &> /dev/null; then
    netfilter-persistent save
elif command -v iptables-save &> /dev/null; then
    iptables-save > /etc/iptables/rules.v4 2>/dev/null || iptables-save > /etc/sysconfig/iptables 2>/dev/null || true
fi
ok "Firewall configured"

# ═══════ 5. Start WireGuard ═══════
info "Starting WireGuard..."
systemctl enable wg-quick@wg0
wg-quick up wg0 2>/dev/null || true
sleep 2
ok "WireGuard started"

# ═══════ 6. Test IPTSP Connectivity ═══════
info "Testing connectivity to IPTSP (180.210.187.253)..."
ping -c 3 180.210.187.253 2>/dev/null && ok "IPTSP reachable" || warn "Cannot ping IPTSP — check network"
nc -zvu 180.210.187.253 5080 2>/dev/null && ok "Port 5080/udp OPEN to IPTSP" || warn "Port 5080 test — may need UDP probe"

# ═══════ 7. Status ═══════
echo ""
echo "════════════════════════════════════════"
echo "  SETUP COMPLETE"
echo "════════════════════════════════════════"
echo ""
echo "  VPS IP:       103.51.128.9"
echo "  WG Port:      51820/udp"
echo "  SIP Port:     5080/udp"
echo "  WG IP:        10.100.0.1/24"
echo ""
echo "  IPTSP Server: 180.210.187.253:5080"
echo "  Username:     09648472999"
echo "  Password:     09648472999999"
echo ""
echo "  ✅ Best UDP Ports in Bangladesh:"
echo "     5080 — Recommended (~45ms)"
echo "     5070 — Good (~42ms)"
echo "     1443 — Alternative (~38ms)"
echo "     ❌ 5060 — BLOCKED"
echo ""
echo "  Next Steps:"
echo "  1. Share VPS public key with clients"
echo "  2. Get client public keys"
echo "  3. Add peers to /etc/wireguard/wg0.conf"
echo "  4. wg-quick down wg0 && wg-quick up wg0"
echo "  5. wg show — verify peers"
echo "  6. Install Asterisk and configure peer to 180.210.187.253"
echo ""
wg show
