# IPTSP Complete Deployment Guide

## 📦 What's Included

This deployment package contains everything needed for a complete IPTSP (IP Telephony Service Provider) setup for Bangladesh and India operations.

### Web Application (React + Vite + Tailwind)
- **dist/index.html** - Single-file production build (394KB)
- Modern responsive UI
- Authentication system
- Real-time management dashboard

### Server Scripts (Bash)
1. **deploy_iptsp.sh** - Complete server deployment
2. **setup_wireguard_tunnel.sh** - WireGuard tunnel configuration
3. **sync_asterisk_config.sh** - Asterisk config synchronization

### Documentation
- **IPTSP_README.md** - Complete system documentation
- **DEPLOYMENT_GUIDE.md** - This file

---

## 🚀 Step-by-Step Deployment

### Phase 1: Server Preparation (Both BD & IN)

#### 1.1 Initial Server Setup
```bash
# Update system
apt-get update && apt-get upgrade -y

# Install basic tools
apt-get install -y wget curl git nano htop net-tools

# Set timezone
timedatectl set-timezone Asia/Dhaka    # Bangladesh
timedatectl set-timezone Asia/Kolkata   # India
```

#### 1.2 Download Deployment Files
```bash
# Create deployment directory
mkdir -p /opt/iptsp
cd /opt/iptsp

# Download all files (or copy from USB/local)
wget https://your-server.com/deploy_iptsp.sh
wget https://your-server.com/setup_wireguard_tunnel.sh
wget https://your-server.com/sync_asterisk_config.sh

# Make executable
chmod +x *.sh
```

---

### Phase 2: Asterisk Installation

#### 2.1 Run Deployment Script
```bash
# Run as root
sudo bash deploy_iptsp.sh
```

This script will:
- ✅ Detect OS (Debian/Ubuntu/RHEL)
- ✅ Install/update Asterisk 20
- ✅ Install WireGuard
- ✅ Create configurations
- ✅ Setup firewall rules
- ✅ Start all services
- ✅ Save credentials to /root/.iptsp_credentials

**Expected Output:**
```
═══════════════════════════════════════════
  IPTSP DEPLOYMENT SUCCESSFUL
═══════════════════════════════════════════

  Asterisk: Version 20 - RUNNING
  SIP Bangladesh: Port 5080/UDP
  SIP India: Port 5060/UDP
  WireGuard BD: wg0 on port 51820
  WireGuard IN: wg1 on port 51821
  AMI: 127.0.0.1:5038
```

#### 2.2 Verify Installation
```bash
# Check Asterisk
systemctl status asterisk
asterisk -rx "core show version"

# Check WireGuard
wg show

# Check ports
ss -tlunp | grep -E "5060|5080|5038|51820|51821"

# View credentials
cat /root/.iptsp_credentials
```

---

### Phase 3: WireGuard Tunnel Setup

#### 3.1 Bangladesh Server
```bash
cd /opt/iptsp
sudo bash setup_wireguard_tunnel.sh

# When prompted:
# Select: 1 (Bangladesh Relay)
# Enter India server's PUBLIC KEY (from step 3.2)
# Enter India server's PUBLIC IP
```

**Save the output:**
```
YOUR PUBLIC KEY (share with peer):
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx=
```

#### 3.2 India Server
```bash
cd /opt/iptsp
sudo bash setup_wireguard_tunnel.sh

# When prompted:
# Select: 2 (India Tunnel)
# Enter Bangladesh server's PUBLIC KEY (from step 3.1)
# Enter Bangladesh server's PUBLIC IP
```

#### 3.3 Exchange Keys & Update Configs
```bash
# On BOTH servers, edit WireGuard config
nano /etc/wireguard/wg0.conf  # Bangladesh
nano /etc/wireguard/wg1.conf  # India

# Update the peer's PublicKey with the actual value
# Update the Endpoint with actual public IP

# Restart WireGuard
wg-quick down wg0 && wg-quick up wg0  # Bangladesh
wg-quick down wg1 && wg-quick up wg1  # India
```

#### 3.4 Test Tunnel
```bash
# From Bangladesh, ping India
ping 10.200.0.1

# From India, ping Bangladesh
ping 10.100.0.1

# Check tunnel status
wg show
```

---

### Phase 4: Web Application Deployment

#### 4.1 Option A: Direct File Access
```bash
# Simply open dist/index.html in a browser
# Works for local testing
```

#### 4.2 Option B: Nginx Server (Recommended)
```bash
# Install nginx
apt-get install -y nginx

# Create config
cat > /etc/nginx/sites-available/iptsp <<EOF
server {
    listen 80;
    server_name your-domain.com;
    
    root /opt/iptsp/dist;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/iptsp /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Test and restart
nginx -t
systemctl restart nginx
```

#### 4.3 Option C: Apache Server
```bash
# Install apache
apt-get install -y apache2

# Copy files
cp -r dist/* /var/www/html/

# Restart
systemctl restart apache2
```

#### 4.4 Access Web GUI
```
URL: http://your-server-ip/
Username: admin
Password: admin123
```

---

### Phase 5: Configuration & Testing

#### 5.1 Add Bangladesh SIP Numbers
1. Login to web GUI
2. Navigate to "🇧🇩 Bangladesh"
3. Click "Add Bangladesh Number"
4. Enter details:
   - Number: +8801712345678
   - Username: +8801712345678
   - Password: (auto-generated or custom)
   - SIP Server: 10.100.0.1
   - Port: 5080
5. Save and copy credentials

#### 5.2 Configure India Trunk
1. Navigate to "🇮🇳 India"
2. Click "Add India Trunk"
3. Enter details:
   - Number: +914223532220
   - Host: 100.64.216.4
   - From Domain: 100.65.166.6
   - Port: 5060
4. Save configuration

#### 5.3 Test Calls

**Test 1: Echo Test**
```
Dial 9999 from any registered number
Should hear echo
```

**Test 2: Bangladesh to India**
```
From BD number: Dial 0091 + Indian number
Example: 00919876543210
```

**Test 3: India to Bangladesh**
```
From India trunk: Dial 008801 + BD number
Example: 008801712345678
```

---

### Phase 6: Monitoring & Maintenance

#### 6.1 Daily Checks
```bash
# Service status
systemctl status asterisk
systemctl status wg-quick@wg0
systemctl status wg-quick@wg1

# Active calls
asterisk -rx "core show channels"

# Registrations
asterisk -rx "core show registry"
asterisk -rx "pjsip show endpoints"

# WireGuard peers
wg show
```

#### 6.2 Log Monitoring
```bash
# Real-time logs
tail -f /var/log/asterisk/messages
tail -f /var/log/asterisk/full

# Search for errors
grep -i error /var/log/asterisk/messages | tail -20
```

#### 6.3 Backup Configuration
```bash
# Create backup script
cat > /root/backup_iptsp.sh <<EOF
#!/bin/bash
BACKUP_DIR=/root/backups
DATE=\$(date +%Y%m%d_%H%M%S)
mkdir -p \$BACKUP_DIR
cp -r /etc/asterisk \$BACKUP_DIR/asterisk_\$DATE
cp -r /etc/wireguard \$BACKUP_DIR/wireguard_\$DATE
echo "Backup created: \$BACKUP_DIR"
EOF

chmod +x /root/backup_iptsp.sh

# Add to crontab (daily backup)
echo "0 2 * * * /root/backup_iptsp.sh" | crontab -
```

---

## 🔧 Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Asterisk won't start | `journalctl -u asterisk -f` |
| WireGuard tunnel down | `wg show` + check keys |
| SIP registration fails | Check credentials, firewall |
| One-way audio | Verify NAT, RTP ports |
| High latency | Use port scanner, check route |
| Web GUI not loading | Check nginx/apache logs |

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BANGLADESH SERVER                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Asterisk  │  │  WireGuard  │  │   Web GUI   │          │
│  │  Port 5080  │  │  Port 51820 │  │  Port 80    │          │
│  │ 10.100.0.1  │  │ 10.100.0.0/24│  │             │          │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘          │
│         │                │                                    │
│         │    ┌───────────┴───────────┐                       │
│         │    │   WireGuard Tunnel    │                       │
│         │    │   Encrypted UDP       │                       │
│         │    └───────────┬───────────┘                       │
│         │                │                                    │
└─────────┼────────────────┼────────────────────────────────────┘
          │                │
          │                │
┌─────────┼────────────────┼────────────────────────────────────┐
│         │                │    INDIA SERVER                     │
│         │                │  ┌─────────────┐  ┌─────────────┐  │
│         └────────────────┼──│  WireGuard  │  │   Asterisk  │  │
│                          │  │  Port 51821 │  │  Port 5060  │  │
│                          │  │ 10.200.0.0/24│  │ 10.200.0.1  │  │
│                          │  └──────┬──────┘  └──────┬──────┘  │
│                          │         │                │         │
│                          │         │                │         │
│                          │         └────────────────┼─────────┤
│                          │                          │         │
│                          │                  ┌───────┴───────┐ │
│                          │                  │     SBC       │ │
│                          │                  │ 100.64.216.4  │ │
│                          │                  │100.65.166.6   │ │
│                          │                  └───────┬───────┘ │
│                          │                          │         │
└──────────────────────────┴──────────────────────────┼─────────┘
                                                     │
                                          ┌──────────┴──────────┐
                                          │   India PSTN        │
                                          │   Carriers          │
                                          └─────────────────────┘
```

---

## 📞 Support Commands Quick Reference

```bash
# Asterisk
asterisk -rvvv                          # Connect to CLI
asterisk -rx "core show version"        # Show version
asterisk -rx "pjsip show endpoints"     # Show PJSIP endpoints
asterisk -rx "sip show peers"           # Show SIP peers
asterisk -rx "core show registry"       # Show registrations
asterisk -rx "core reload"              # Reload config
asterisk -rx "pjsip reload"             # Reload PJSIP

# WireGuard
wg show                                 # Show all tunnels
wg show wg0                             # Show BD tunnel
wg show wg1                             # Show IN tunnel
wg-quick down wg0 && wg-quick up wg0   # Restart tunnel

# System
systemctl status asterisk               # Asterisk status
systemctl restart asterisk              # Restart Asterisk
journalctl -u asterisk -f               # Asterisk logs
ss -tlunp                               # Show listening ports
```

---

## ✅ Deployment Checklist

- [ ] Server OS updated
- [ ] Asterisk installed and running
- [ ] WireGuard installed
- [ ] WireGuard tunnel established (BD ↔ IN)
- [ ] Firewall rules configured
- [ ] Web GUI accessible
- [ ] Default passwords changed
- [ ] Bangladesh SIP numbers added
- [ ] India trunk configured
- [ ] Test calls completed (BD → IN, IN → BD)
- [ ] Monitoring setup
- [ ] Backup script configured
- [ ] Documentation reviewed

---

**Deployment Time:** 30-60 minutes  
**Difficulty:** Intermediate  
**Support:** Check logs and documentation

For issues, refer to IPTSP_README.md troubleshooting section.
