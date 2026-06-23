#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  VPN.net PC/Server ISO Builder (x86_64)
#  Uses debootstrap + squashfs + isolinux
# ═══════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/builds/pc-x86_64"
ROOTFS="$BUILD_DIR/rootfs"
OVERLAY="$SCRIPT_DIR/rootfs-overlay"
OUTPUT_ISO="$SCRIPT_DIR/builds/vpnnet-pc-x86_64.iso"

# Config
OS_NAME="VPN.net Client"
OS_VERSION="1.0.0"
DEBIAN_RELEASE="bookworm"
KERNEL_PKG="linux-image-amd64"
ARCH="amd64"
ISO_VOLUME_ID="VPNNET_PC"

log()  { echo "[$(date '+%H:%M:%S')] $*"; }
die()  { echo "FATAL: $*"; exit 1; }

# ── Check dependencies ──
check_deps() {
  for cmd in debootstrap chroot mksquashfs xorriso; do
    if ! which "$cmd" &>/dev/null; then
      die "Missing: $cmd. Install with: apt install debootstrap squashfs-tools xorriso"
    fi
  done
  log "✅ All dependencies found"
}

# ── Stage 1: debootstrap ──
stage_debootstrap() {
  log "=== Stage 1: debootstrap $DEBIAN_RELEASE ==="
  rm -rf "$ROOTFS"
  mkdir -p "$ROOTFS"

  debootstrap --arch="$ARCH" \
    --include="linux-image-amd64,wireguard-tools,openresolv,curl,ca-certificates,iproute2,iptables,isc-dhcp-client,systemd,systemd-sysv,dbus" \
    "$DEBIAN_RELEASE" "$ROOTFS" http://deb.debian.org/debian

  log "✅ debootstrap complete"
}

# ── Stage 2: System configuration ──
stage_configure() {
  log "=== Stage 2: System configuration ==="

  # Set hostname
  echo "vpnnet-client" > "$ROOTFS/etc/hostname"
  cat > "$ROOTFS/etc/hosts" << 'HOSTS'
127.0.0.1 localhost
127.0.1.1 vpnnet-client
HOSTS

  # Network - DHCP on first ethernet
  cat > "$ROOTFS/etc/network/interfaces" << 'NET'
auto lo
iface lo inet loopback

auto eth0
iface eth0 inet dhcp
NET

  # Enable systemd services
  ln -sf /etc/systemd/system/vpnnet-agent.service "$ROOTFS/etc/systemd/system/multi-user.target.wants/vpnnet-agent.service"

  # Configure /etc/resolv.conf
  echo "nameserver 8.8.8.8" > "$ROOTFS/etc/resolv.conf"
  echo "nameserver 1.1.1.1" >> "$ROOTFS/etc/resolv.conf"

  # Set root password (default: vpnnet)
  chroot "$ROOTFS" bash -c "echo 'root:vpnnet' | chpasswd"

  log "✅ System configured"
}

# ── Stage 3: Inject overlay ──
stage_overlay() {
  log "=== Stage 3: Inject VPN.net overlay files ==="
  if [ -d "$OVERLAY" ]; then
    cp -rv "$OVERLAY"/* "$ROOTFS/"
    log "✅ Overlay injected"
  else
    log "⚠️  No overlay directory found at $OVERLAY"
  fi
  chmod +x "$ROOTFS/usr/local/bin/vpnnet-agent.sh" 2>/dev/null || true
}

# ── Stage 4: Create ISO ──
stage_iso() {
  log "=== Stage 4: Creating ISO ==="
  local iso_dir="$BUILD_DIR/iso"
  local squashfs="$BUILD_DIR/filesystem.squashfs"

  mkdir -p "$iso_dir/live" "$iso_dir/isolinux"

  # Create squashfs
  mksquashfs "$ROOTFS" "$squashfs" -comp xz -e boot

  # Copy kernel and initrd
  cp "$ROOTFS/boot/vmlinuz-"* "$iso_dir/live/vmlinuz"
  cp "$ROOTFS/boot/initrd.img-"* "$iso_dir/live/initrd.img"

  # isolinux config
  cat > "$iso_dir/isolinux/isolinux.cfg" << 'CFG'
default vpnnet
label vpnnet
  menu label ^VPN.net Client
  kernel /live/vmlinuz
  append initrd=/live/initrd.img boot=live quiet splash
CFG

  # Copy syslinux bootloader
  if [ -f /usr/lib/syslinux/modules/bios/isolinux.bin ]; then
    cp /usr/lib/syslinux/modules/bios/isolinux.bin "$iso_dir/isolinux/isolinux.bin"
    cp /usr/lib/syslinux/modules/bios/ldlinux.c32 "$iso_dir/isolinux/ldlinux.c32" 2>/dev/null || true
  elif [ -f /usr/lib/ISOLINUX/isolinux.bin ]; then
    cp /usr/lib/ISOLINUX/isolinux.bin "$iso_dir/isolinux/isolinux.bin"
  else
    log "⚠️  isolinux.bin not found — ISO may not be bootable"
  fi

  # Copy squashfs
  cp "$squashfs" "$iso_dir/live/filesystem.squashfs"

  # Clean up mounts before ISO gen
  for d in proc sys dev run; do
    umount -lf "$ROOTFS/$d" 2>/dev/null || true
  done

  # Generate ISO
  xorriso -as mkisofs \
    -V "$ISO_VOLUME_ID" \
    -o "$OUTPUT_ISO" \
    -isohybrid-mbr /usr/lib/ISOLINUX/isohdpfx.bin \
    -b isolinux/isolinux.bin \
    -c isolinux/boot.cat \
    -boot-load-size 4 \
    -boot-info-table \
    -no-emul-boot \
    "$iso_dir"

  log "✅ ISO created: $OUTPUT_ISO"
  ls -lh "$OUTPUT_ISO"
}

# ── Cleanup ──
cleanup() {
  log "Cleaning up mounts ..."
  for d in proc sys dev run; do
    umount -lf "$ROOTFS/$d" 2>/dev/null || true
  done
}
trap cleanup EXIT

# ═══════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════
echo "═══════════════════════════════════════════════════"
echo "  VPN.net PC/Server ISO Builder v$OS_VERSION"
echo "═══════════════════════════════════════════════════"

check_deps
stage_debootstrap || die "debootstrap failed"
stage_configure || log "⚠️  configure step had warnings"
stage_overlay || log "⚠️  overlay step had warnings"
stage_iso || die "ISO creation failed"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✅ Build complete! ISO at: $OUTPUT_ISO"
echo "  Size: $(ls -lh "$OUTPUT_ISO" | awk '{print $5}')"
echo "═══════════════════════════════════════════════════"
