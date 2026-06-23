#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  WireGuard Tunnel Setup - Bangladesh ↔ India
#  Run on BOTH servers, then exchange public keys
# ═══════════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

ok()     { echo -e "${GREEN}[✓]${NC} $1"; }
warn()   { echo -e "${YELLOW}[!]${NC} $1"; }
fail()   { echo -e "${RED}[✗]${NC} $1"; }
info()   { echo -e "${BLUE}[i]${NC} $1"; }

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

echo ""
echo "============================================"
echo "  WireGuard Tunnel Setup"
echo "  Bangladesh ↔ India SIP Relay"
echo "============================================"
echo ""

# Configuration
read -p "Select server role: [1] Bangladesh Relay, [2] India Tunnel: " ROLE
if [ "$ROLE" = "1" ]; then
    SERVER_NAME="bangladesh"
    WG_INTERFACE="wg0"
    WG_PORT="51820"
    WG_SUBNET="10.100.0.0/24"
    WG_SERVER_IP="10.100.0.1"
    PEER_SUBNET="10.200.0.0/24"
    COLOR="green"
elif [ "$ROLE" = "2" ]; then
    SERVER_NAME="india"
    WG_INTERFACE="wg1"
    WG_PORT="51821"
    WG_SUBNET="10.200.0.0/24"
    WG_SERVER_IP="10.200.0.1"
    PEER_SUBNET="10.100.0.0/24"
    COLOR="orange"
else
    fail "Invalid selection"
    exit 1
fi

info "Server: $SERVER_NAME"
info "Interface: $WG_INTERFACE"
info "Port: $WG_PORT"
info "Subnet: $WG_SUBNET"

# Install WireGuard if not present
if ! command -v wg &> /dev/null; then
    info "Installing WireGuard..."
    if [ -f /etc/debian_version ]; then
        apt-get update && apt-get install -y wireguard wireguard-tools qrencode
    elif [ -f /etc/redhat-release ]; then
        yum install -y epel-release && yum install -y wireguard-tools qrencode
    fi
    ok "WireGuard installed"
fi

# Create directory
mkdir -p /etc/wireguard

# Generate keys
info "Generating WireGuard keys..."
PRIVATE_KEY=$(wg genkey)
PUBLIC_KEY=$(echo "$PRIVATE_KEY" | wg pubkey)
PSK=$(wg genpsk)

ok "Keys generated"
echo ""
echo "════════════════════════════════════════"
echo "  YOUR PUBLIC KEY (share with peer):"
echo "════════════════════════════════════════"
echo -e "${GREEN}$PUBLIC_KEY${NC}"
echo ""
echo "════════════════════════════════════════"

# Save private key securely
echo "$PRIVATE_KEY" > /etc/wireguard/${WG_INTERFACE}.private
chmod 600 /etc/wireguard/${WG_INTERFACE}.private

# Get peer's public key
echo ""
read -p "Enter peer's PUBLIC KEY: " PEER_PUBLIC_KEY
if [ -z "$PEER_PUBLIC_KEY" ]; then
    warn "No peer key entered - creating config without peer"
    PEER_PUBLIC_KEY="__PEER_PUBLIC_KEY__"
fi

# Get peer's endpoint IP
read -p "Enter peer's PUBLIC IP (or DNS): " PEER_ENDPOINT
if [ -z "$PEER_ENDPOINT" ]; then
    warn "No peer endpoint entered"
    PEER_ENDPOINT="__PEER_ENDPOINT__"
fi

# Create WireGuard config
info "Creating WireGuard configuration..."

cat > /etc/wireguard/${WG_INTERFACE}.conf <<EOF
# WireGuard Config - $SERVER_NAME
# IPTSP Manager - Auto Generated
# Date: $(date)

[Interface]
PrivateKey = $PRIVATE_KEY
Address = $WG_SERVER_IP/24
ListenPort = $WG_PORT
# PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
# PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
SaveConfig = true

# Peer: $([ "$SERVER_NAME" = "bangladesh" ] && echo "India" || echo "Bangladesh") Server
[Peer]
PublicKey = $PEER_PUBLIC_KEY
# PresharedKey = $PSK
Endpoint = $PEER_ENDPOINT:$WG_PORT
AllowedIPs = $PEER_SUBNET
PersistentKeepalive = 25

# SIP Client Range (for reference)
# Bangladesh Clients: 10.100.0.10 - 10.100.0.254
# India Clients: 10.200.0.10 - 10.200.0.254
EOF

chmod 600 /etc/wireguard/${WG_INTERFACE}.conf
ok "Configuration created: /etc/wireguard/${WG_INTERFACE}.conf"

# Enable IP forwarding
info "Enabling IP forwarding..."
echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
sysctl -p &>/dev/null || true
ok "IP forwarding enabled"

# Setup iptables for NAT
info "Configuring iptables..."
iptables -A FORWARD -i $WG_INTERFACE -j ACCEPT 2>/dev/null || true
iptables -A FORWARD -o $WG_INTERFACE -j ACCEPT 2>/dev/null || true
iptables -t nat -A POSTROUTING -s $WG_SUBNET -o eth0 -j MASQUERADE 2>/dev/null || true
ok "iptables configured"

# Enable and start WireGuard
info "Starting WireGuard..."
systemctl enable wg-quick@${WG_INTERFACE} 2>/dev/null || true
systemctl start wg-quick@${WG_INTERFACE} 2>/dev/null || true
sleep 2

if systemctl is-active --quiet wg-quick@${WG_INTERFACE} 2>/dev/null; then
    ok "WireGuard $WG_INTERFACE started"
else
    warn "WireGuard service not active - starting manually"
    wg-quick up ${WG_INTERFACE} 2>/dev/null || true
fi

# Show status
echo ""
echo "════════════════════════════════════════"
echo "  WireGuard Status"
echo "════════════════════════════════════════"
wg show ${WG_INTERFACE} 2>/dev/null || info "Interface not ready yet"

# Generate QR code for mobile clients (optional)
echo ""
read -p "Generate QR code for mobile client? [y/N]: " GENERATE_QR
if [ "$GENERATE_QR" = "y" ] || [ "$GENERATE_QR" = "Y" ]; then
    info "Generating QR code..."
    
    # Generate client keys
    CLIENT_PRIVATE=$(wg genkey)
    CLIENT_PUBLIC=$(echo "$CLIENT_PRIVATE" | wg pubkey)
    
    # Determine client IP
    read -p "Enter client IP (e.g., 10.100.0.10): " CLIENT_IP
    if [ -z "$CLIENT_IP" ]; then
        CLIENT_IP="$([ "$SERVER_NAME" = "bangladesh" ] && echo "10.100.0.10" || echo "10.200.0.10")"
    fi
    
    # Get server's public IP
    SERVER_PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "your.server.ip")
    
    # Create client config
    CLIENT_CONFIG="[Interface]
PrivateKey = $CLIENT_PRIVATE
Address = $CLIENT_IP/24
DNS = 8.8.8.8

[Peer]
PublicKey = $PUBLIC_KEY
Endpoint = $SERVER_PUBLIC_IP:$WG_PORT
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25"
    
    # Save client config
    echo "$CLIENT_CONFIG" > /root/wireguard_client_${SERVER_NAME}.conf
    chmod 600 /root/wireguard_client_${SERVER_NAME}.conf
    ok "Client config saved: /root/wireguard_client_${SERVER_NAME}.conf"
    
    # Generate QR
    if command -v qrencode &> /dev/null; then
        qrencode -t ansi256 "$CLIENT_CONFIG"
        echo ""
        ok "QR code generated above (scan with WireGuard app)"
    fi
    
    # Add client to server config
    read -p "Add this client to server config? [y/N]: " ADD_CLIENT
    if [ "$ADD_CLIENT" = "y" ] || [ "$ADD_CLIENT" = "Y" ]; then
        cat >> /etc/wireguard/${WG_INTERFACE}.conf <<EOF

# Client: $CLIENT_IP
[Peer]
PublicKey = $CLIENT_PUBLIC
AllowedIPs = $CLIENT_IP/32
EOF
        wg-quick down ${WG_INTERFACE} 2>/dev/null || true
        wg-quick up ${WG_INTERFACE} 2>/dev/null || true
        ok "Client added to server config"
    fi
fi

# Save info
cat > /root/wireguard_${SERVER_NAME}_info.txt <<EOF
WireGuard Configuration - $SERVER_NAME
========================================
Interface: $WG_INTERFACE
Port: $WG_PORT
Server IP: $WG_SERVER_IP
Subnet: $WG_SUBNET
Public Key: $PUBLIC_KEY
Private Key: $PRIVATE_KEY (saved in /etc/wireguard/${WG_INTERFACE}.private)

Peer Configuration:
- Peer Subnet: $PEER_SUBNET
- Peer Public Key: $PEER_PUBLIC_KEY
- Peer Endpoint: $PEER_ENDPOINT

Commands:
- Status: wg show
- Show config: cat /etc/wireguard/${WG_INTERFACE}.conf
- Restart: wg-quick down ${WG_INTERFACE} && wg-quick up ${WG_INTERFACE}
- Logs: journalctl -u wg-quick@${WG_INTERFACE} -f

Date: $(date)
EOF

chmod 600 /root/wireguard_${SERVER_NAME}_info.txt
ok "Info saved: /root/wireguard_${SERVER_NAME}_info.txt"

echo ""
echo "════════════════════════════════════════"
echo "  SETUP COMPLETE"
echo "════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Exchange public keys with peer server"
echo "2. Update peer configuration with correct public key"
echo "3. Test connectivity: ping 10.$([ "$SERVER_NAME" = "bangladesh" ] && echo "200" || echo "100").0.1"
echo "4. View info: cat /root/wireguard_${SERVER_NAME}_info.txt"
echo ""
