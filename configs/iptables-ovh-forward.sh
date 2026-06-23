#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  OVH Cloud - iptables Traffic Forwarding Script
#  Forwards SIP/RTP/AMI traffic to BD and IN WireGuard clients
# ═══════════════════════════════════════════════════════════════════
#  
#  HOW IT WORKS:
#  ┌─────────────────────────────────────────────────────────────┐
#  │  OVH Cloud (Public IP: 51.xxx.xxx.xxx)                      │
#  │                                                              │
#  │  Internet → :5080 ──DNAT──→ wg0:10.100.0.2:5080 (BD SIP)   │
#  │  Internet → :5060 ──DNAT──→ wg0:10.200.0.2:5060 (IN Trunk) │
#  │  Internet → :10000-20000 ─→ wg0:10.100.0.2 (RTP)           │
#  │  Internet → :5038 ──DNAT──→ wg0:10.100.0.2:5038 (AMI)      │
#  │                                                              │
#  │  WG Peer → 10.100.0.2 ──SNAT──→ Internet (BD outbound)     │
#  │  WG Peer → 10.200.0.2 ──SNAT──→ Internet (IN outbound)     │
#  └─────────────────────────────────────────────────────────────┘
#
#  Network Interface: eth0 (or change below)
# ============================================================

set -e

WAN_IFACE="eth0"
BD_WG_IP="10.100.0.2"
IN_WG_IP="10.200.0.2"
BD_SIP_PORT="5080"
IN_SIP_PORT="5060"
RTP_START="10000"
RTP_END="20000"
AMI_PORT="5038"

if [ "$EUID" -ne 0 ]; then
    echo "Please run as root"
    exit 1
fi

echo "============================================"
echo "  OVH iptables Traffic Forwarding Setup"
echo "============================================"

# 1. Enable IP Forwarding
echo "[1/5] Enabling IP forwarding..."
cat >> /etc/sysctl.conf <<EOF
net.ipv4.ip_forward=1
net.ipv6.conf.all.forwarding=1
EOF
sysctl -p

# 2. Clear existing iptables NAT rules
echo "[2/5] Clearing existing NAT rules..."
iptables -t nat -F PREROUTING
iptables -t nat -F POSTROUTING
iptables -F FORWARD

# 3. Allow WireGuard forwarding
echo "[3/5] Setting up WireGuard forwarding..."
iptables -A FORWARD -i wg0 -j ACCEPT
iptables -A FORWARD -o wg0 -j ACCEPT

# 4. SNAT: Allow WG clients to reach Internet
echo "[4/5] Setting up SNAT for WG clients..."
iptables -t nat -A POSTROUTING -o $WAN_IFACE -j MASQUERADE

# 5. DNAT: Forward specific ports to WG clients
echo "[5/5] Setting up DNAT port forwarding..."

# ──── SIP PORT 5080 → Bangladesh Asterisk ────
echo "  • Forwarding $WAN_IFACE:$BD_SIP_PORT/udp → $BD_WG_IP:$BD_SIP_PORT"
iptables -t nat -A PREROUTING -i $WAN_IFACE -p udp --dport $BD_SIP_PORT \
    -j DNAT --to-destination $BD_WG_IP:$BD_SIP_PORT

# ──── SIP PORT 5081 (Alternative BD) ────
echo "  • Forwarding $WAN_IFACE:5081/udp → $BD_WG_IP:5081"
iptables -t nat -A PREROUTING -i $WAN_IFACE -p udp --dport 5081 \
    -j DNAT --to-destination $BD_WG_IP:5081

# ──── SIP PORT 5060 → India SBC ────
echo "  • Forwarding $WAN_IFACE:$IN_SIP_PORT/udp → $IN_WG_IP:$IN_SIP_PORT"
iptables -t nat -A PREROUTING -i $WAN_IFACE -p udp --dport $IN_SIP_PORT \
    -j DNAT --to-destination $IN_WG_IP:$IN_SIP_PORT

# ──── RTP PORTS → Bangladesh ────
echo "  • Forwarding $WAN_IFACE:$RTP_START-$RTP_END/udp → $BD_WG_IP"
iptables -t nat -A PREROUTING -i $WAN_IFACE -p udp --dport $RTP_START:$RTP_END \
    -j DNAT --to-destination $BD_WG_IP

# ──── AMI PORT → Bangladesh ────
echo "  • Forwarding $WAN_IFACE:$AMI_PORT/tcp → $BD_WG_IP:$AMI_PORT"
iptables -t nat -A PREROUTING -i $WAN_IFACE -p tcp --dport $AMI_PORT \
    -j DNAT --to-destination $BD_WG_IP:$AMI_PORT

echo ""
echo "============================================"
echo "  FORWARDING RULES APPLIED SUCCESSFULLY"
echo "============================================"
echo ""
echo "Summary:"
echo "  $BD_SIP_PORT/udp → $BD_WG_IP (Bangladesh SIP)"
echo "  5081/udp      → $BD_WG_IP (Bangladesh SIP Alt)"
echo "  $IN_SIP_PORT/udp → $IN_WG_IP (India SIP Trunk)"
echo "  $RTP_START-$RTP_END/udp  → $BD_WG_IP (RTP Audio)"
echo "  $AMI_PORT/tcp    → $BD_WG_IP (Asterisk Manager)"
echo ""
echo "Verify with:"
echo "  iptables -t nat -L PREROUTING -n -v"
echo "  iptables -t nat -L POSTROUTING -n -v"
echo "  iptables -L FORWARD -n -v"
echo ""

# Save rules to survive reboot
if command -v netfilter-persistent &> /dev/null; then
    netfilter-persistent save
    echo "Rules saved (netfilter-persistent)"
elif command -v iptables-save &> /dev/null; then
    iptables-save > /etc/iptables/rules.v4 2>/dev/null || \
    iptables-save > /etc/sysconfig/iptables 2>/dev/null || \
    echo "Rules active but install iptables-persistent for reboot safety"
fi
