#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  IPTSP Full Deployment Script - Bangladesh & India SIP Trunk
#  Run as root: sudo bash deploy_iptsp.sh
#  Version: 2.0 - Auto-detect, Update, Upgrade/Downgrade Support
# ═══════════════════════════════════════════════════════════════════

set -e

# Colors
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; MAGENTA='\033[0;35m'; CYAN='\033[0;36m'; NC='\033[0m'

# Functions
ok()     { echo -e "${GREEN}[✓]${NC} $1"; }
warn()   { echo -e "${YELLOW}[!]${NC} $1"; }
fail()   { echo -e "${RED}[✗]${NC} $1"; }
info()   { echo -e "${CYAN}[i]${NC} $1"; }
header() { echo -e "\n${BLUE}════════════════════════════════════════${NC}"; echo -e "${BLUE}$1${NC}"; echo -e "${BLUE}════════════════════════════════════════${NC}\n"; }

# Check root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root: sudo bash $0${NC}"
    exit 1
fi

# Configuration
ASTERSK_VERSION=${ASTERSK_VERSION:-20}
WIREGUARD_BD_SUBNET="10.100.0.0/24"
WIREGUARD_BD_SERVER="10.100.0.1"
WIREGUARD_BD_PORT="51820"
WIREGUARD_IN_SUBNET="10.200.0.0/24"
WIREGUARD_IN_SERVER="10.200.0.1"
WIREGUARD_IN_PORT="51821"
SIP_PORT_BD="5080"
SIP_PORT_IN="5060"
AMI_PORT="5038"
RTP_START="10000"
RTP_END="20000"

echo ""
echo "============================================"
echo "  IPTSP Deployment - Bangladesh & India"
echo "  Version 2.0 - Auto Configure"
echo "  Running as: $(whoami)"
echo "  Date: $(date)"
echo "============================================"

# ═══════════════════════════════════════════════════════════════════
#  STEP 1: System Detection & Update
# ═══════════════════════════════════════════════════════════════════
header "STEP 1: System Detection & Update"

# Detect OS
if [ -f /etc/debian_version ]; then
    OS="debian"
    OS_VERSION=$(cat /etc/debian_version)
    ok "Detected Debian $OS_VERSION"
elif [ -f /etc/redhat-release ]; then
    OS="rhel"
    OS_VERSION=$(cat /etc/redhat-release)
    ok "Detected RHEL: $OS_VERSION"
elif [ -f /etc/os-release ]; then
    source /etc/os-release
    OS=$ID
    ok "Detected: $PRETTY_NAME"
else
    fail "Unsupported OS"
    exit 1
fi

# Update system
export DEBIAN_FRONTEND=noninteractive
if [ "$OS" = "debian" ] || [ "$OS" = "ubuntu" ]; then
    apt-get update -y
    apt-get upgrade -y
elif [ "$OS" = "rhel" ] || [ "$OS" = "centos" ]; then
    yum update -y
fi
ok "System updated"

# ═══════════════════════════════════════════════════════════════════
#  STEP 2: Check & Install Asterisk
# ═══════════════════════════════════════════════════════════════════
header "STEP 2: Asterisk Installation/Update"

check_asterisk_version() {
    if command -v asterisk &> /dev/null; then
        CURRENT_VERSION=$(asterisk -V 2>/dev/null | grep -oP 'Asterisk \K[0-9]+')
        ok "Asterisk $CURRENT_VERSION is installed"
        if [ "$CURRENT_VERSION" -lt "$ASTERSK_VERSION" ]; then
            warn "Upgrade required: $CURRENT_VERSION -> $ASTERSK_VERSION"
            return 1
        elif [ "$CURRENT_VERSION" -gt "$ASTERSK_VERSION" ]; then
            warn "Downgrade required: $CURRENT_VERSION -> $ASTERSK_VERSION"
            return 1
        else
            ok "Version matches requirement"
            return 0
        fi
    else
        info "Asterisk not installed"
        return 1
    fi
}

install_asterisk() {
    info "Installing Asterisk $ASTERSK_VERSION..."
    
    # Install dependencies
    if [ "$OS" = "debian" ] || [ "$OS" = "ubuntu" ]; then
        apt-get install -y \
            build-essential wget curl git \
            libssl-dev libncurses5-dev libnewt-dev \
            libxml2-dev libsqlite3-dev uuid-dev \
            libjansson-dev libedit-dev \
            libgsm1-dev mpg123 sox \
            unixodbc unixodbc-dev odbcinst subversion \
            pkg-config liblua5.2-dev \
            libspeex-dev libspeexdsp-dev \
            libogg-dev libvorbis-dev \
            libcurl4-openssl-dev \
            libsrtp2-dev 2>/dev/null || apt-get install -y libsrtp-dev 2>/dev/null || true
    elif [ "$OS" = "rhel" ] || [ "$OS" = "centos" ]; then
        yum install -y \
            gcc gcc-c++ make wget curl git \
            openssl-devel ncurses-devel newt-devel \
            libxml2-devel sqlite-devel uuid-devel \
            jansson-devel editline-devel \
            gsm-devel mpg123 sox \
            unixODBC unixODBC-devel subversion \
            pkgconfig lua-devel \
            speex-devel speexdsp-devel \
            libogg-devel libvorbis-devel \
            libcurl-devel
    fi
    ok "Dependencies installed"
    
    # Download and compile
    cd /usr/src
    rm -f asterisk-${ASTERSK_VERSION}-current.tar.gz
    rm -rf asterisk-${ASTERSK_VERSION}*/
    
    wget -q --show-progress https://downloads.asterisk.org/pub/telephony/asterisk/asterisk-${ASTERSK_VERSION}-current.tar.gz
    tar -xzf asterisk-${ASTERSK_VERSION}-current.tar.gz
    ASTERISK_DIR=$(find /usr/src -maxdepth 1 -name "asterisk-${ASTERSK_VERSION}*" -type d | head -1)
    
    if [ -z "$ASTERISK_DIR" ]; then
        fail "Asterisk extraction failed"
        exit 1
    fi
    ok "Asterisk extracted: $ASTERISK_DIR"
    
    # Configure and compile
    cd "$ASTERISK_DIR"
    [ -f contrib/scripts/install_prereq ] && chmod +x contrib/scripts/install_prereq && contrib/scripts/install_prereq install 2>&1 | tail -3 || true
    
    ./configure --with-jansson-bundled --with-pjproject-bundled > /dev/null 2>&1
    ok "Configure complete"
    
    # Select modules
    make menuselect.makeopts > /dev/null 2>&1
    menuselect/menuselect \
        --enable chan_sip --enable chan_pjsip --enable res_pjsip \
        --enable res_pjsip_session --enable res_pjsip_authenticator_digest \
        --enable res_pjsip_endpoint_identifier_ip --enable res_pjsip_registrar \
        --enable res_pjsip_sdp_rtp --enable res_pjsip_outbound_registration \
        --enable app_voicemail --enable codec_gsm --enable codec_ulaw --enable codec_alaw \
        --enable format_mp3 --enable app_dial --enable app_playback --enable app_record \
        --enable app_echo --enable app_transfer --enable cdr_csv --enable cdr_manager \
        menuselect.makeopts 2>/dev/null || true
    ok "Modules selected"
    
    # Compile
    info "Compiling Asterisk (this may take 5-15 minutes)..."
    make -j$(nproc) > /tmp/asterisk_build.log 2>&1
    ok "Compilation complete"
    
    # Install
    make install > /dev/null 2>&1
    make samples > /dev/null 2>&1
    make config > /dev/null 2>&1
    ldconfig
    ok "Asterisk installed"
}

if check_asterisk_version; then
    ok "Asterisk version OK - skipping installation"
else
    install_asterisk
fi

# ═══════════════════════════════════════════════════════════════════
#  STEP 3: WireGuard Installation & Configuration
# ═══════════════════════════════════════════════════════════════════
header "STEP 3: WireGuard Setup (Bangladesh & India)"

check_wireguard() {
    if command -v wg &> /dev/null; then
        ok "WireGuard is installed"
        return 0
    else
        info "WireGuard not installed"
        return 1
    fi
}

install_wireguard() {
    info "Installing WireGuard..."
    
    if [ "$OS" = "debian" ] || [ "$OS" = "ubuntu" ]; then
        apt-get install -y wireguard wireguard-tools qrencode
    elif [ "$OS" = "rhel" ] || [ "$OS" = "centos" ]; then
        yum install -y epel-release
        yum install -y kmod-wireguard wireguard-tools qrencode
    fi
    ok "WireGuard installed"
}

generate_wireguard_keys() {
    local PRIVATE_KEY=$(wg genkey)
    local PUBLIC_KEY=$(echo "$PRIVATE_KEY" | wg pubkey)
    echo "$PRIVATE_KEY|$PUBLIC_KEY"
}

setup_wireguard_bangladesh() {
    info "Setting up Bangladesh WireGuard Relay..."
    
    # Generate keys
    KEYS=$(generate_wireguard_keys)
    BD_PRIVATE=$(echo "$KEYS" | cut -d'|' -f1)
    BD_PUBLIC=$(echo "$KEYS" | cut -d'|' -f2)
    
    # Create config
    cat > /etc/wireguard/wg0.conf <<EOF
# Bangladesh WireGuard Relay
# IPTSP Manager - Auto Generated

[Interface]
PrivateKey = $BD_PRIVATE
Address = $WIREGUARD_BD_SERVER/24
ListenPort = $WIREGUARD_BD_PORT
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
SaveConfig = true

# India Server Peer
[Peer]
# India Relay
PublicKey = __INDIA_PUBLIC_KEY__
Endpoint = __INDIA_SERVER_IP__:51821
AllowedIPs = $WIREGUARD_IN_SUBNET
PersistentKeepalive = 25

# Client Range
# SIP Clients: 10.100.0.10 - 10.100.0.254
EOF
    
    chmod 600 /etc/wireguard/wg0.conf
    ok "Bangladesh WireGuard config created"
    
    # Save keys for later
    echo "BD_PRIVATE=$BD_PRIVATE" >> /root/.iptsp_wireguard_keys
    echo "BD_PUBLIC=$BD_PUBLIC" >> /root/.iptsp_wireguard_keys
}

setup_wireguard_india() {
    info "Setting up India WireGuard Tunnel..."
    
    # Generate keys
    KEYS=$(generate_wireguard_keys)
    IN_PRIVATE=$(echo "$KEYS" | cut -d'|' -f1)
    IN_PUBLIC=$(echo "$KEYS" | cut -d'|' -f2)
    
    # Create config
    cat > /etc/wireguard/wg1.conf <<EOF
# India WireGuard Tunnel
# IPTSP Manager - Auto Generated

[Interface]
PrivateKey = $IN_PRIVATE
Address = $WIREGUARD_IN_SERVER/24
ListenPort = $WIREGUARD_IN_PORT
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
SaveConfig = true

# Bangladesh Server Peer
[Peer]
# Bangladesh Relay
PublicKey = __BANGLADESH_PUBLIC_KEY__
Endpoint = __BANGLADESH_SERVER_IP__:51820
AllowedIPs = $WIREGUARD_BD_SUBNET
PersistentKeepalive = 25

# SBC Connection
# Forward to: 100.64.216.4 (SBC IP)
# LAN: Configure as needed
EOF
    
    chmod 600 /etc/wireguard/wg1.conf
    ok "India WireGuard config created"
    
    # Save keys
    echo "IN_PRIVATE=$IN_PRIVATE" >> /root/.iptsp_wireguard_keys
    echo "IN_PUBLIC=$IN_PUBLIC" >> /root/.iptsp_wireguard_keys
}

if ! check_wireguard; then
    install_wireguard
fi

# Create WireGuard directory
mkdir -p /etc/wireguard
rm -f /root/.iptsp_wireguard_keys

# Setup both tunnels
setup_wireguard_bangladesh
setup_wireguard_india

# Enable WireGuard
systemctl enable wg-quick@wg0 2>/dev/null || true
systemctl enable wg-quick@wg1 2>/dev/null || true
ok "WireGuard services enabled"

# ═══════════════════════════════════════════════════════════════════
#  STEP 4: Create Asterisk User & Directories
# ═══════════════════════════════════════════════════════════════════
header "STEP 4: Asterisk User & Permissions"

id asterisk &>/dev/null || useradd -r -d /var/lib/asterisk -s /sbin/nologin -c "Asterisk PBX" asterisk
ok "Asterisk user created"

for DIR in /etc/asterisk /var/lib/asterisk /var/log/asterisk /var/spool/asterisk /usr/lib/asterisk /var/run/asterisk; do
    [ -d "$DIR" ] || mkdir -p "$DIR"
    chown -R asterisk:asterisk "$DIR"
done
ok "Directories created and permissions set"

# ═══════════════════════════════════════════════════════════════════
#  STEP 5: Configure Asterisk for IPTSP
# ═══════════════════════════════════════════════════════════════════
header "STEP 5: Asterisk IPTSP Configuration"

# Backup existing configs
if [ -d /etc/asterisk/backup ]; then
    rm -rf /etc/asterisk/backup
fi
mkdir -p /etc/asterisk/backup
cp /etc/asterisk/*.conf /etc/asterisk/backup/ 2>/dev/null || true
ok "Existing configs backed up"

# asterisk.conf
cat > /etc/asterisk/asterisk.conf <<'CONF'
[options]
runuser = asterisk
rungroup = asterisk
verbose = 3
debug = 0
alwaysfork = yes
astctlpermissions = 0660
astctlowner = asterisk
astctlgroup = asterisk
astctl = asterisk.ctl
CONF
ok "asterisk.conf configured"

# pjsip.conf - Main configuration for IPTSP
cat > /etc/asterisk/pjsip.conf <<CONF
; ═══════════════════════════════════════════════════════════════════
;  IPTSP PJSIP Configuration - Bangladesh & India
;  Auto-generated by deploy_iptsp.sh
; ═══════════════════════════════════════════════════════════════════

[global]
type=global
endpoint_identifier_order=ip,username,anonymous
max_forwards=70
user_agent=IPTSP-Asterisk

; ───────────────────────────────────────────────────────────────────
;  Transports
; ───────────────────────────────────────────────────────────────────

[transport-udp-bangladesh]
type=transport
protocol=udp
bind=0.0.0.0:$SIP_PORT_BD
external_media_address=auto
external_signaling_address=auto

[transport-udp-india]
type=transport
protocol=udp
bind=0.0.0.0:$SIP_PORT_IN
external_media_address=auto
external_signaling_address=auto

[transport-tcp]
type=transport
protocol=tcp
bind=0.0.0.0:5060

; ───────────────────────────────────────────────────────────────────
;  Endpoint Templates
; ───────────────────────────────────────────────────────────────────

[endpoint-bangladesh](!)
type=endpoint
context=bangladesh-inbound
disallow=all
allow=ulaw
allow=alaw
allow=gsm
direct_media=no
force_rport=yes
rewrite_contact=yes
rtp_symmetric=yes
qualify_frequency=60
dtmf_mode=rfc2833
ice_support=no
identify_by=user

[endpoint-india](!)
type=endpoint
context=india-outbound
disallow=all
allow=g729
allow=ulaw
allow=alaw
direct_media=no
force_rport=yes
rewrite_contact=yes
rtp_symmetric=yes
qualify_frequency=60
dtmf_mode=rfc2833

[auth-basic](!)
type=auth
auth_type=userpass

[aor-dynamic](!)
type=aor
max_contacts=10
remove_existing=yes
qualify_frequency=60
qualify_timeout=3

; ───────────────────────────────────────────────────────────────────
;  Bangladesh SIP Numbers (WireGuard Clients)
;  Format: [number] -> auth, aor, endpoint
; ───────────────────────────────────────────────────────────────────

; Example: Bangladesh Number +8801712345678
[auth-bd-8801712345678](auth-basic)
username=+8801712345678
password=AutoGeneratedPassword123

[aor-bd-8801712345678](aor-dynamic)
mailboxes=8801712345678@bangladesh

[endpoint-bd-8801712345678](endpoint-bangladesh)
auth=auth-bd-8801712345678
aors=aor-bd-8801712345678
callerid="+8801712345678" <+8801712345678>
from_domain=10.100.0.1

; ───────────────────────────────────────────────────────────────────
;  India SIP Trunk (Peer to SBC)
; ───────────────────────────────────────────────────────────────────

[india-trunk-auth](auth-basic)
username=+914223532220
password=TrunkPassword123

[india-trunk-aor](aor-dynamic)
contact=sip:100.64.216.4:5060
qualify_frequency=30

[india-trunk-endpoint](endpoint-india)
auth=india-trunk-auth
aors=india-trunk-aor
from_domain=100.65.166.6
outbound_auth=india-trunk-auth

[india-trunk-identify]
type=identify
endpoint=india-trunk-endpoint
match=100.64.216.4

; ───────────────────────────────────────────────────────────────────
;  Registration (Outbound to Carriers)
; ───────────────────────────────────────────────────────────────────

[register-india]
type=registration
transport=transport-udp-india
outbound_auth=india-trunk-auth
server_uri=sip:100.65.166.6:5060
client_uri=sip:+914223532220@100.65.166.6:5060
contact_header=sip:+914223532220@10.200.0.1:5060
retry_interval=60
forbidden_interval=3600
expiration=3600

CONF
ok "pjsip.conf configured for IPTSP"

# extensions.conf - Dialplan
cat > /etc/asterisk/extensions.conf <<'CONF'
; ═══════════════════════════════════════════════════════════════════
;  IPTSP Extensions Configuration
;  Bangladesh & India Routing
; ═══════════════════════════════════════════════════════════════════

[general]
static=yes
writeprotect=no
autofallthrough=yes
clearglobalvars=no

[globals]
; Global variables
BANGLADESH_CONTEXT=bangladesh-inbound
INDIA_CONTEXT=india-outbound
SBC_IP=100.64.216.4
SBC_DOMAIN=100.65.166.6

; ───────────────────────────────────────────────────────────────────
;  Bangladesh Inbound Context
;  Handles incoming calls from Bangladesh numbers
; ───────────────────────────────────────────────────────────────────

[bangladesh-inbound]
; Route to India trunk
exten => _0091X.,1,NoOp(India International Call)
 same => n,Set(CALLERID(num)=\${CALLERID(num)})
 same => n,Dial(PJSIP/\${EXTEN:4}@india-trunk-endpoint,60)
 same => n,Hangup()

exten => _+91X.,1,NoOp(India International Call with +)
 same => n,Dial(PJSIP/\${EXTEN:1}@india-trunk-endpoint,60)
 same => n,Hangup()

; Local Bangladesh calls
exten => _01X.,1,NoOp(Bangladesh Local Call)
 same => n,Dial(PJSIP/\${EXTEN},30)
 same => n,Hangup()

exten => _+8801X.,1,NoOp(Bangladesh Local with +880)
 same => n,Dial(PJSIP/\${EXTEN:4},30)
 same => n,Hangup()

; Test extension
exten => 9999,1,NoOp(Echo Test)
 same => n,Answer()
 same => n,Echo()
 same => n,Hangup()

; ───────────────────────────────────────────────────────────────────
;  India Outbound Context
;  Handles calls from India trunk
; ───────────────────────────────────────────────────────────────────

[india-outbound]
; Route to Bangladesh numbers
exten => _008801X.,1,NoOp(Bangladesh International from India)
 same => n,Set(CALLERID(num)=\${CALLERID(num)})
 same => n,Dial(PJSIP/\${EXTEN:5}@bangladesh-inbound,60)
 same => n,Hangup()

exten => _+8801X.,1,NoOp(Bangladesh from India with +)
 same => n,Dial(PJSIP/\${EXTEN:4}@bangladesh-inbound,60)
 same => n,Hangup()

; India local calls
exten => _0X.,1,NoOp(India Local Call)
 same => n,Dial(PJSIP/\${EXTEN}@india-trunk-endpoint,60)
 same => n,Hangup()

; ───────────────────────────────────────────────────────────────────
;  Default Context
; ───────────────────────────────────────────────────────────────────

[default]
include => bangladesh-inbound
include => india-outbound

exten => h,1,NoOp(Hangup handler)
 same => n,CDR(end)=\${NOW()}
 same => n,Hangup()

CONF
ok "extensions.conf configured"

# sip.conf - Legacy SIP support (for older devices)
cat > /etc/asterisk/sip.conf <<CONF
; ═══════════════════════════════════════════════════════════════════
;  IPTSP Legacy SIP Configuration
;  For devices that don't support PJSIP
; ═══════════════════════════════════════════════════════════════════

[general]
context=default
bindport=$SIP_PORT_BD
bindaddr=0.0.0.0
language=en
disallow=all
allow=ulaw
allow=alaw
allow=gsm
nat=force_rport,comedia
qualify=yes
alwaysauthreject=yes
canreinvite=no
session-timers=refuse
defaultexpiry=120
minexpiry=60
maxexpiry=3600

; Bangladesh Numbers (Legacy)
[8801712345678]
type=friend
context=bangladesh-inbound
host=dynamic
secret=AutoGeneratedPassword123
callerid="+8801712345678" <8801712345678>
disallow=all
allow=ulaw
allow=alaw
nat=yes
dtmfmode=rfc2833

; India Trunk (Legacy Peer)
[india-trunk]
type=peer
host=100.64.216.4
port=5060
nat=yes
insecure=invite,port
fromdomain=100.65.166.6
dtmfmode=rfc2833
disallow=all
allow=g729
allow=ulaw
allow=alaw
context=india-outbound
defaultuser=+914223532220
canreinvite=no

CONF
ok "sip.conf configured (legacy)"

# manager.conf - AMI Configuration
cat > /etc/asterisk/manager.conf <<'CONF'
[general]
enabled=yes
port=5038
bindaddr=0.0.0.0
displayconnects=yes
timestampevents=yes

[admin]
secret=AdminPassword123
deny=0.0.0.0/0.0.0.0
permit=127.0.0.1/255.255.255.0
permit=10.0.0.0/255.0.0.0
read=all
write=all

[iptsp]
secret=IptspPassword123
deny=0.0.0.0/0.0.0.0
permit=127.0.0.1/255.255.255.0
permit=10.0.0.0/255.0.0.0
read=system,call,log,verbose,command,agent,user,config,command,dtmf,reporting,cdr,dialplan
write=system,call,log,verbose,command,agent,user,config,command,dtmf,reporting,cdr,dialplan

CONF
ok "manager.conf configured"

# Set permissions
chown -R asterisk:asterisk /etc/asterisk
chmod -R 640 /etc/asterisk/*.conf
ok "Permissions set"

# ═══════════════════════════════════════════════════════════════════
#  STEP 6: Systemd Service Configuration
# ═══════════════════════════════════════════════════════════════════
header "STEP 6: Systemd Service"

cat > /etc/systemd/system/asterisk.service <<'UNIT'
[Unit]
Description=Asterisk PBX and Telephony Engine
Documentation=man:asterisk(8)
After=network.target remote-fs.target nss-lookup.target
Wants=network.target remote-fs.target nss-lookup.target

[Service]
Type=simple
User=asterisk
Group=asterisk
Environment=HOME=/var/lib/asterisk
Environment=AST_FQDN=1
ExecStart=/usr/sbin/asterisk -f -C /etc/asterisk/asterisk.conf
ExecReload=/usr/sbin/asterisk -rx "core reload"
ExecStop=/usr/sbin/asterisk -rx "core stop now"
Restart=always
RestartSec=10
LimitNOFILE=65536
LimitCORE=infinity

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable asterisk
ok "Systemd service configured"

# ═══════════════════════════════════════════════════════════════════
#  STEP 7: Firewall Configuration
# ═══════════════════════════════════════════════════════════════════
header "STEP 7: Firewall Configuration"

# Check if ufw or firewalld is active
if command -v ufw &> /dev/null && ufw status | grep -q "active"; then
    ufw allow $SIP_PORT_BD/udp comment "Asterisk SIP Bangladesh"
    ufw allow $SIP_PORT_IN/udp comment "Asterisk SIP India"
    ufw allow $WIREGUARD_BD_PORT/udp comment "WireGuard Bangladesh"
    ufw allow $WIREGUARD_IN_PORT/udp comment "WireGuard India"
    ufw allow $AMI_PORT/tcp comment "Asterisk AMI"
    ufw allow $RTP_START:$RTP_END/udp comment "Asterisk RTP"
    ok "UFW rules added"
elif command -v firewall-cmd &> /dev/null && systemctl is-active firewalld &> /dev/null; then
    firewall-cmd --permanent --add-port=$SIP_PORT_BD/udp
    firewall-cmd --permanent --add-port=$SIP_PORT_IN/udp
    firewall-cmd --permanent --add-port=$WIREGUARD_BD_PORT/udp
    firewall-cmd --permanent --add-port=$WIREGUARD_IN_PORT/udp
    firewall-cmd --permanent --add-port=$AMI_PORT/tcp
    firewall-cmd --permanent --add-port=$RTP_START-$RTP_END/udp
    firewall-cmd --reload
    ok "Firewalld rules added"
else
    # Use iptables
    iptables -I INPUT -p udp --dport $SIP_PORT_BD -j ACCEPT 2>/dev/null || true
    iptables -I INPUT -p udp --dport $SIP_PORT_IN -j ACCEPT 2>/dev/null || true
    iptables -I INPUT -p udp --dport $WIREGUARD_BD_PORT -j ACCEPT 2>/dev/null || true
    iptables -I INPUT -p udp --dport $WIREGUARD_IN_PORT -j ACCEPT 2>/dev/null || true
    iptables -I INPUT -p tcp --dport $AMI_PORT -j ACCEPT 2>/dev/null || true
    iptables -I INPUT -p udp --dport $RTP_START:$RTP_END -j ACCEPT 2>/dev/null || true
    
    # Enable IP forwarding for WireGuard
    echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
    sysctl -p &>/dev/null || true
    
    # Save iptables
    if command -v iptables-save &> /dev/null; then
        iptables-save > /etc/iptables.rules 2>/dev/null || true
    fi
    ok "iptables rules added"
fi

# ═══════════════════════════════════════════════════════════════════
#  STEP 8: Start Services
# ═══════════════════════════════════════════════════════════════════
header "STEP 8: Start Services"

# Start WireGuard
systemctl start wg-quick@wg0 2>/dev/null && ok "WireGuard Bangladesh (wg0) started" || warn "wg0 not started"
systemctl start wg-quick@wg1 2>/dev/null && ok "WireGuard India (wg1) started" || warn "wg1 not started"

# Stop any running Asterisk
systemctl stop asterisk 2>/dev/null || true
pkill -f asterisk 2>/dev/null || true
sleep 2

# Start Asterisk
systemctl start asterisk
sleep 5

if systemctl is-active --quiet asterisk; then
    ok "Asterisk STARTED"
else
    fail "Asterisk failed to start"
    journalctl -u asterisk --no-pager -n 30
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════
#  STEP 9: Verification
# ═══════════════════════════════════════════════════════════════════
header "STEP 9: Final Verification"

# Check Asterisk
systemctl is-active --quiet asterisk && ok "Asterisk: RUNNING" || fail "Asterisk: STOPPED"
asterisk -V 2>/dev/null && ok "Version OK" || fail "Version check failed"

# Check ports
if ss -tlunp | grep -q ":$SIP_PORT_BD"; then
    ok "SIP Port BD ($SIP_PORT_BD) listening"
else
    warn "SIP Port BD not listening"
fi

if ss -tlunp | grep -q ":$SIP_PORT_IN"; then
    ok "SIP Port IN ($SIP_PORT_IN) listening"
else
    warn "SIP Port IN not listening"
fi

if ss -tlunp | grep -q ":$AMI_PORT"; then
    ok "AMI Port ($AMI_PORT) listening"
else
    warn "AMI Port not listening"
fi

# Check WireGuard
if command -v wg &> /dev/null; then
    WG_STATUS=$(wg show 2>/dev/null | head -5)
    if [ -n "$WG_STATUS" ]; then
        ok "WireGuard: RUNNING"
    else
        warn "WireGuard: No active tunnels"
    fi
fi

# Test AMI
AMI_TEST=$(echo -e "Action: Login\r\nUsername: admin\r\nSecret: AdminPassword123\r\n\r\n" | nc -w3 127.0.0.1 $AMI_PORT 2>/dev/null | head -3)
if echo "$AMI_TEST" | grep -q "Success"; then
    ok "AMI Login OK"
else
    warn "AMI: $AMI_TEST"
fi

# CLI Test
asterisk -rx "core show version" 2>/dev/null && ok "CLI working" || warn "CLI not ready"

# ═══════════════════════════════════════════════════════════════════
#  STEP 10: Save Credentials
# ═══════════════════════════════════════════════════════════════════
header "STEP 10: Save Credentials"

cat > /root/.iptsp_credentials <<EOF
# ═══════════════════════════════════════════════════════════════════
#  IPTSP Credentials - Auto Generated
#  Date: $(date)
# ═══════════════════════════════════════════════════════════════════

[ASTERISK]
VERSION=$ASTERSK_VERSION
CLI=asterisk -rvvv
CONFIG_DIR=/etc/asterisk
LOGS_DIR=/var/log/asterisk

[SIP - BANGLADESH]
PORT=$SIP_PORT_BD
TRANSPORT=UDP
SERVER=10.100.0.1
WIREDGUARD_SUBNET=$WIREGUARD_BD_SUBNET
EXAMPLE_NUMBER=+8801712345678
EXAMPLE_PASSWORD=AutoGeneratedPassword123

[SIP - INDIA]
PORT=$SIP_PORT_IN
TRANSPORT=UDP
TYPE=peer
HOST=100.64.216.4
FROM_DOMAIN=100.65.166.6
DEFAULT_USER=+914223532220
CONTEXT=from-trunk
CODECS=g729,ulaw,alaw

[WIREDGUARD - BANGLADESH]
INTERFACE=wg0
PORT=$WIREGUARD_BD_PORT
SERVER_IP=$WIREGUARD_BD_SERVER
SUBNET=$WIREGUARD_BD_SUBNET

[WIREDGUARD - INDIA]
INTERFACE=wg1
PORT=$WIREGUARD_IN_PORT
SERVER_IP=$WIREGUARD_IN_SERVER
SUBNET=$WIREGUARD_IN_SUBNET

[AMI - ASTERISK MANAGER]
HOST=127.0.0.1
PORT=$AMI_PORT
USER=admin
SECRET=AdminPassword123

[AMI - IPTSP USER]
USER=iptsp
SECRET=IptspPassword123

[RTP]
START=$RTP_START
END=$RTP_END

[COMMANDS]
STATUS=systemctl status asterisk
RESTART=systemctl restart asterisk
STOP=systemctl stop asterisk
LOGS=tail -f /var/log/asterisk/messages
PEERS=asterisk -rx 'pjsip show endpoints'
REGISTRATIONS=asterisk -rx 'core show registry'
WIREDGUARD=wg show

EOF

chmod 600 /root/.iptsp_credentials
ok "Credentials saved: /root/.iptsp_credentials"

# ═══════════════════════════════════════════════════════════════════
#  COMPLETE
# ═══════════════════════════════════════════════════════════════════
header "DEPLOYMENT COMPLETE"

cat <<SUMMARY

${GREEN}═══════════════════════════════════════════════════════════════════${NC}
  ${GREEN}IPTSP DEPLOYMENT SUCCESSFUL${NC}
${GREEN}═══════════════════════════════════════════════════════════════════${NC}

  ${CYAN}Asterisk:${NC} Version $ASTERSK_VERSION - RUNNING
  ${CYAN}SIP Bangladesh:${NC} Port $SIP_PORT_BD/UDP (10.100.0.1)
  ${CYAN}SIP India:${NC} Port $SIP_PORT_IN/UDP (Peer to 100.64.216.4)
  ${CYAN}WireGuard BD:${NC} wg0 on port $WIREGUARD_BD_PORT
  ${CYAN}WireGuard IN:${NC} wg1 on port $WIREGUARD_IN_PORT
  ${CYAN}AMI:${NC} 127.0.0.1:$AMI_PORT (admin/AdminPassword123)

  ${YELLOW}Quick Commands:${NC}
  • Status:    systemctl status asterisk
  • Console:   asterisk -rvvv
  • Version:   asterisk -rx 'core show version'
  • Endpoints: asterisk -rx 'pjsip show endpoints'
  • Peers:     asterisk -rx 'sip show peers'
  • Logs:      tail -f /var/log/asterisk/messages
  • WireGuard: wg show
  • Creds:     cat /root/.iptsp_credentials

  ${YELLOW}Configuration Files:${NC}
  • PJSIP:     /etc/asterisk/pjsip.conf
  • Extensions:/etc/asterisk/extensions.conf
  • SIP:       /etc/asterisk/sip.conf
  • Manager:   /etc/asterisk/manager.conf
  • WireGuard: /etc/wireguard/wg0.conf (BD), wg1.conf (IN)

  ${YELLOW}Next Steps:${NC}
  1. Configure WireGuard peer keys between BD and IN servers
  2. Add SIP numbers via IPTSP Manager GUI
  3. Test calls between Bangladesh and India
  4. Monitor logs: tail -f /var/log/asterisk/messages

${GREEN}═══════════════════════════════════════════════════════════════════${NC}

SUMMARY
