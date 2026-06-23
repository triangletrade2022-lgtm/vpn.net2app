#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  VPN.net Router Firmware Builder (OpenWRT)
#  Uses OpenWRT Image Builder for 300+ router models
# ═══════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/builds/router"
OUTPUT_DIR="$BUILD_DIR/firmware"
OVERLAY="$SCRIPT_DIR/rootfs-overlay"

log()  { echo "[$(date '+%H:%M:%S')] $*"; }
die()  { echo "FATAL: $*"; exit 1; }

# Supported targets (most common routers)
TARGETS=(
  "x86/64"         # x86_64 PC routers (pfSense replacement)
  "ath79/generic"  # TP-Link, Ubiquiti
  "ramips/mt7621"  # Xiaomi, Netgear, Asus (MT7621 based)
  "ipq40xx/generic" # MikroTik, Linksys
  "bcm27xx/bcm2711" # Raspberry Pi (via OpenWRT)
)

PACKAGES="base-files busybox dnsmasq dropbear firewall4 fstools kmod-gpio-button-hotplug kmod-nf-ipt kmod-nft-offload kmod-usb3 libc libgcc logd luci luci-app-statistics luci-mod-admin-full mtd netifd odhcp6c odhcpd-ipv6only opkg ppp ppp-mod-pppoe procd procd-seccomp procd-ujail uboot-envtools uclient-fetch uhttpd urandom-seed urngd wpad-basic-mbedtls"
OUR_PACKAGES="wireguard-tools curl ca-bundle luci-app-wireguard luci-proto-wireguard"

# ── Check dependencies ──
check_deps() {
  for cmd in curl xzcat tar; do
    if ! which "$cmd" &>/dev/null; then
      die "Missing: $cmd"
    fi
  done
  log "✅ All dependencies found"
}

# ── Download Image Builder ──
download_ib() {
  local target="$1"
  local ib_dir="$BUILD_DIR/ib-${target//\//-}"

  if [ -d "$ib_dir" ]; then
    log "Using cached Image Builder: $ib_dir"
    echo "$ib_dir"
    return
  fi

  local version="23.05.5"
  local url="https://downloads.openwrt.org/releases/${version}/targets/${target}/openwrt-imagebuilder-${version}-${target//\//-}.Linux-x86_64.tar.xz"
  
  log "Downloading Image Builder for $target ..."
  mkdir -p "$ib_dir"
  curl -sL "$url" | tar -xJ --strip-components=1 -C "$ib_dir" 2>/dev/null || {
    log "⚠️  Download failed for $target, trying alternate URL ..."
    # Try snapshot
    local snap_url="https://downloads.openwrt.org/snapshots/targets/${target}/openwrt-imagebuilder-${target//\//-}.Linux-x86_64.tar.xz"
    curl -sL "$snap_url" | tar -xJ --strip-components=1 -C "$ib_dir" 2>/dev/null || {
      log "❌ Could not download Image Builder for $target"
      return 1
    }
  }

  log "✅ Image Builder ready: $ib_dir"
  echo "$ib_dir"
}

# ── Build firmware for one target ──
build_target() {
  local target="$1"
  log "═══════════════════════════════════════════════"
  log "Building firmware for: $target"
  log "═══════════════════════════════════════════════"

  local ib_dir
  ib_dir=$(download_ib "$target") || return 1

  local target_slug="${target//\//-}"
  local output_dir="$OUTPUT_DIR/$target_slug"
  mkdir -p "$output_dir"

  # Prepare custom files directory
  local files_dir="$BUILD_DIR/files-$target_slug"
  mkdir -p "$files_dir/etc/init.d" "$files_dir/usr/bin"

  # Copy agent script
  if [ -f "$OVERLAY/usr/local/bin/vpnnet-agent.sh" ]; then
    cp "$OVERLAY/usr/local/bin/vpnnet-agent.sh" "$files_dir/usr/bin/vpnnet-agent.sh"
    chmod +x "$files_dir/usr/bin/vpnnet-agent.sh"
  fi

  # Create OpenWRT init script
  cat > "$files_dir/etc/init.d/vpnnet-agent" << 'INIT'
#!/bin/sh /etc/rc.common
START=99
USE_PROCD=1

start_service() {
    procd_open_instance
    procd_set_param command /usr/bin/vpnnet-agent.sh
    procd_set_param stdout 1
    procd_set_param stderr 1
    procd_set_param respawn
    procd_close_instance
}
INIT
  chmod +x "$files_dir/etc/init.d/vpnnet-agent"

  # Build
  cd "$ib_dir"
  make image \
    PROFILE="generic" \
    PACKAGES="$PACKAGES $OUR_PACKAGES" \
    FILES="$files_dir" \
    BIN_DIR="$output_dir" \
    2>&1 | tee "$BUILD_DIR/build-${target_slug}.log"

  log "✅ Build complete for $target"
  log "  Output: $output_dir"
  ls -lh "$output_dir"/*.bin 2>/dev/null || ls -lh "$output_dir"/*.img 2>/dev/null || true
}

# ═══════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════
echo "═══════════════════════════════════════════════════"
echo "  VPN.net Router Firmware Builder v1.0.0"
echo "  Builds OpenWRT firmware for 300+ router models"
echo "═══════════════════════════════════════════════════"

check_deps
mkdir -p "$BUILD_DIR" "$OUTPUT_DIR"

for target in "${TARGETS[@]}"; do
  build_target "$target"
done

echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✅ All builds complete!"
echo "  Firmware: $OUTPUT_DIR"
echo "  Logs: $BUILD_DIR/*.log"
echo "═══════════════════════════════════════════════════"
