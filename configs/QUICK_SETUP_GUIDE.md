# 🚀 IPTSP WireGuard & Asterisk Quick Setup Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         OVH CLOUD (Real IP)                          │
│                        51.xxx.xxx.xxx                                │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  WireGuard: wg0      10.0.0.1/24      Port: 51820           │   │
│  │                                                               │   │
│  │  iptables DNAT:                                              │   │
│  │  :5080/udp    → 10.100.0.2:5080    (BD SIP)                 │   │
│  │  :5060/udp    → 10.200.0.2:5060    (IN Trunk)               │   │
│  │  :10000-20000/udp → 10.100.0.2     (RTP Audio)             │   │
│  │  :5038/tcp    → 10.100.0.2:5038    (AMI)                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                      │                          │                     │
│         WireGuard   │                          │  WireGuard         │
│         Tunnel      │                          │  Tunnel            │
└─────────────────────┼──────────────────────────┼─────────────────────┘
                      │                          │
         ┌────────────┴──────────┐    ┌──────────┴────────────┐
         │    BANGLADESH         │    │      INDIA             │
         │    (No Real IP)       │    │    (No Real IP)        │
         │                       │    │                        │
         │ wg0: 10.100.0.2/24   │    │ wg0: 10.200.0.2/24    │
         │                       │    │                        │
         │ ┌───────────────────┐ │    │ ┌───────────────────┐  │
         │ │    Asterisk       │ │    │ │    LAN Switch     │  │
         │ │ 0.0.0.0:5080     │ │    │ │                    │  │
         │ │ (SIP)             │ │    │ │ ┌───────────────┐ │  │
         │ │ 10000-20000 (RTP) │ │    │ │ │  SBC          │ │  │
         │ └───────────────────┘ │    │ │ │ 100.64.216.4  │ │  │
         │                       │    │ │ │ Port 5060     │ │  │
         │ ┌───────────────────┐ │    │ │ │ fromdomain:   │ │  │
         │ │  SIP Phones       │ │    │ │ │ 100.65.166.6  │ │  │
         │ │  2001, 2002...    │ │    │ │ └───────────────┘ │  │
         │ └───────────────────┘ │    │ └───────────────────┘  │
         └───────────────────────┘    └────────────────────────┘
```

---

## STEP 1: OVH CLOUD SERVER SETUP

### 1.1 Install WireGuard
```bash
ssh root@<OVH_IP>

# Install
apt-get update && apt-get install -y wireguard wireguard-tools

# Generate keys
cd /etc/wireguard
wg genkey | tee private.key | wg pubkey > public.key

# Display keys (save these!)
echo "Private: $(cat private.key)"
echo "Public:  $(cat public.key)"
```

### 1.2 Configure WireGuard
```bash
# Copy the config file
cp /path/to/configs/ovh-server-wg0.conf /etc/wireguard/wg0.conf

# Edit the file - replace placeholders:
nano /etc/wireguard/wg0.conf

# Replace:
# <OVH_PRIVATE_KEY>        → cat /etc/wireguard/private.key
# <BD_CLIENT_PUBLIC_KEY>   → Get from Bangladesh (Step 2.2)
# <IN_CLIENT_PUBLIC_KEY>   → Get from India (Step 3.2)

# Set permissions
chmod 600 /etc/wireguard/wg0.conf
```

### 1.3 Setup iptables Forwarding
```bash
# Copy the script
cp /path/to/configs/iptables-ovh-forward.sh /root/
chmod +x /root/iptables-ovh-forward.sh

# Edit network interface if needed (default: eth0)
# Run it
bash /root/iptables-ovh-forward.sh

# Verify
iptables -t nat -L PREROUTING -n -v
```

### 1.4 Start WireGuard
```bash
# Start
wg-quick up wg0

# Auto-start on boot
systemctl enable wg-quick@wg0

# Check status
wg show
```

### 1.5 Open OVH Firewall
```bash
# OVH Firewall (in OVH control panel or via CLI)
# Open these ports:
# 51820/udp  - WireGuard
# 5080/udp   - SIP Bangladesh
# 5060/udp   - SIP India
# 10000:20000/udp - RTP Audio
# 5038/tcp   - AMI (optional, restrict to trusted IPs)
```

---

## STEP 2: BANGLADESH CLIENT SETUP

### 2.1 Install WireGuard
```bash
ssh root@<BD_SERVER>

apt-get update && apt-get install -y wireguard wireguard-tools

cd /etc/wireguard
wg genkey | tee private.key | wg pubkey > public.key

echo "BD Public Key (share with OVH admin):"
cat public.key
```

### 2.2 Configure WireGuard Client
```bash
# Copy config
cp /path/to/configs/bangladesh-client-wg0.conf /etc/wireguard/wg0.conf

# Edit:
nano /etc/wireguard/wg0.conf

# Replace:
# <BD_CLIENT_PRIVATE_KEY>   → cat /etc/wireguard/private.key
# <OVH_SERVER_PUBLIC_KEY>   → Get from OVH admin
# 51.xxx.xxx.xxx           → OVH real public IP

chmod 600 /etc/wireguard/wg0.conf
```

### 2.3 Start WireGuard
```bash
wg-quick up wg0
systemctl enable wg-quick@wg0

# Test connection
ping 10.0.0.1     # OVH server
ping 10.200.0.2   # India (after India is set up)
```

### 2.4 Configure Asterisk
```bash
# Copy PJSIP config
cp configs/asterisk-pjsip-iptsp.conf /etc/asterisk/pjsip.conf

# Copy Extensions config
cp configs/asterisk-extensions-iptsp.conf /etc/asterisk/extensions.conf

# Edit and replace:
# OVH_PUBLIC_IP → actual OVH IP
# <INDIA_TRUNK_PASSWORD> → from India carrier
# Extension passwords → set your own

# Set permissions
chown asterisk:asterisk /etc/asterisk/pjsip.conf
chown asterisk:asterisk /etc/asterisk/extensions.conf
chmod 640 /etc/asterisk/pjsip.conf
chmod 640 /etc/asterisk/extensions.conf

# Reload
asterisk -rx "pjsip reload"
asterisk -rx "dialplan reload"
```

### 2.5 Configure BD IPTSP/BDIX Connection
```bash
# If you have a Bangladesh carrier/IPTSP:
# They need to send calls to: OVH_PUBLIC_IP:5080
# OVH will DNAT to your Asterisk via WireGuard

# If you're the IPTSP yourself:
# Your Asterisk is reachable at: OVH_PUBLIC_IP:5080
# SIP Phone config:
#   Server: OVH_PUBLIC_IP:5080
#   User: <SIP_NUMBER>
#   Pass: <SIP_PASSWORD>
#   Transport: UDP
```

---

## STEP 3: INDIA CLIENT SETUP

### 3.1 Install WireGuard
```bash
ssh root@<IN_SERVER>

apt-get update && apt-get install -y wireguard wireguard-tools

cd /etc/wireguard
wg genkey | tee private.key | wg pubkey > public.key

echo "IN Public Key (share with OVH admin):"
cat public.key
```

### 3.2 Configure WireGuard Client
```bash
cp /path/to/configs/india-client-wg0.conf /etc/wireguard/wg0.conf

nano /etc/wireguard/wg0.conf

# Replace:
# <IN_CLIENT_PRIVATE_KEY>   → cat /etc/wireguard/private.key
# <OVH_SERVER_PUBLIC_KEY>   → Get from OVH admin
# 51.xxx.xxx.xxx           → OVH real public IP

chmod 600 /etc/wireguard/wg0.conf
```

### 3.3 Start WireGuard
```bash
wg-quick up wg0
systemctl enable wg-quick@wg0

# Test
ping 10.0.0.1     # OVH
ping 10.100.0.2   # Bangladesh
```

### 3.4 Connect SBC to WireGuard
```bash
# The SBC (100.64.216.4) is on your LAN
# Enable IP forwarding on India server:
iptables -A FORWARD -i eth0 -o wg0 -j ACCEPT
iptables -A FORWARD -i wg0 -o eth0 -j ACCEPT
iptables -t nat -A POSTROUTING -o wg0 -j MASQUERADE

# Now SBC traffic can flow through wireguard:
# SBC (100.64.216.4) → LAN → India Server → wg0 → OVH → Bangladesh
```

### 3.5 India SIP Trunk Settings (for carrier reference)
```
Type: peer
Host: 100.64.216.4
Port: 5060
From Domain: 100.65.166.6
Default User: +914223532220
NAT: yes
Insecure: invite,port
DTMF: rfc2833
Codecs: g729, ulaw, alaw
Context: from-trunk
SIP URI: sip:+914223532220@100.65.166.6

Dialplan:
X.           → Match any number
0 0091 X.    → International format
```

---

## STEP 4: VERIFICATION

### 4.1 Check WireGuard Tunnels
```bash
# On OVH
wg show
# Should show both peers connected with data transfer

# On Bangladesh
wg show
# Should show latest handshake recently

# On India
wg show
# Should show latest handshake recently
```

### 4.2 Ping Test
```bash
# From Bangladesh
ping 10.0.0.1        # OVH
ping 10.200.0.2      # India
ping 8.8.8.8         # Internet (if AllowedIPs=0.0.0.0/0)

# From India
ping 10.0.0.1        # OVH
ping 10.100.0.2      # Bangladesh
```

### 4.3 SIP Test
```bash
# From Bangladesh Asterisk CLI
asterisk -rvvv

# Show PJSIP endpoints
pjsip show endpoints

# Show registrations
core show registry

# Make test call
channel originate PJSIP/2001 application Echo

# Check SIP peers
pjsip show contacts

# Check logs
tail -f /var/log/asterisk/messages
```

### 4.4 End-to-End Call Test
```
Test 1: Internal Extension → Extension
  Dial 2001 from 2002 → should ring both ways

Test 2: Bangladesh → India
  From SIP phone: 0091XXXXXXXXXX
  Should route through wg0 → OVH → India

Test 3: India → Bangladesh
  From India trunk: 008801XXXXXXXXXX
  Should route through SBC → wg0 → OVH → BD Asterisk → BD Phone

Test 4: Extension → World
  From 2001: 0092XXXXXXXXXX (Pakistan)
  From 2001: 001XXXXXXXXXX (USA)
  All route through India trunk
```

---

## ⚠️ TROUBLESHOOTING

| Issue | Check |
|-------|-------|
| WG handshake fails | Check if OVH firewall allows port 51820/udp |
| No audio (one-way) | Check RTP ports 10000-20000 forwarding |
| SIP registration fails | Verify Asterisk binds to 0.0.0.0:5080 |
| Can't reach SBC from BD | Check iptables DNAT on OVH |
| High latency | Use `wg show` to check packet loss |
| WG tunnel drops | Check PersistentKeepalive=25 in config |

**Key Commands:**
```bash
# WireGuard
wg show                          # Status
wg-quick down wg0 && wg-quick up wg0   # Restart

# iptables
iptables -t nat -L -n -v        # NAT rules
iptables -L FORWARD -n -v       # Forwarding rules

# Asterisk
asterisk -rx "pjsip show endpoints"
asterisk -rx "core show channels"
tail -f /var/log/asterisk/messages

# Network
tcpdump -i wg0 port 5080        # Capture SIP on WG
ss -tlunp | grep -E "5080|5060" # Check listening ports
```
