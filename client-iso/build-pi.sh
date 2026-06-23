#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  VPN.net Raspberry Pi Image Builder (ARM64)
#  Uses debootstrap + Raspberry Pi kernel + firmware
# ═══════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/builds/raspberry-pi"
ROOTFS="$BUILD_DIR/rootfs"
OVERLAY="$SCRIPT_DIR/rootfs-overlay"
OUTPUT_IMG="$SCRIPT_DIR/builds/vpnnet-rpi.img"
BOOT_SIZE="256M"
ROOT_SIZE="2G"

log()  { echo "[$(date '+%H:%M:%S')] $*"; }
die()  { echo "FATAL: $*"; exit 1; }

check_deps() {
  for cmd in debootstrap chroot parted kpartx losetup mkfs.vfat mkfs.ext4 rsync; do
    if ! which "$cmd" &>/dev/null; then
      die "Missing: $cmd. Install with: apt install debootstrap parted kpartx dosfstools e2fsprogs rsync"
    fi
  done
  log "✅ All dependencies found"
}

stage_debootstrap() {
  log "=== Stage 1: debootstrap ARM64 ==="
  rm -rf "$ROOTFS"
  mkdir -p "$ROOTFS"

  # Requires qemu-user-static for ARM cross-arch debootstrap
  if ! dpkg -l qemu-user-static &>/dev/null; then
    die "Missing qemu-user-static. Install: apt install qemu-user-static binfmt-support"
  fi

  debootstrap --arch=arm64 \
    --foreign \
    --include="wireguard-tools,openresolv,curl,ca-certificates,iproute2,iptables,isc-dhcp-client,systemd,systemd-sysv,dbus,fake-hwclock,rng-tools" \
    bookworm "$ROOTFS" http://deb.debian.org/debian

  # Copy qemu static binary
  cp /usr/bin/qemu-aarch64-static "$ROOTFS/usr/bin/"
  chroot "$ROOTFS" /debootstrap/debootstrap --second-stage
  log "✅ debootstrap complete"
}

stage_rpi_firmware() {
  log "=== Installing Raspberry Pi firmware ==="
  local FW_REPO="https://github.com/raspberrypi/firmware/raw/master/boot"

  mkdir -p "$ROOTFS/boot/firmware"

  # Download RPi4 firmware files
  for f in bootcode.bin fixup4.dat start4.elf bcm2711-rpi-4-b.dtb bcm2711-rpi-400.dtb bcm2711-rpi-cm4.dtb; do
    log "Downloading $f ..."
    curl -sL "$FW_REPO/$f" -o "$ROOTFS/boot/firmware/$f" &
  done
  wait

  # Raspberry Pi kernel
  curl -sL "https://github.com/raspberrypi/firmware/raw/master/boot/kernel8.img" \
    -o "$ROOTFS/boot/firmware/kernel8.img"

  # Config.txt
  cat > "$ROOTFS/boot/firmware/config.txt" << 'CONFIG'
arm_64bit=1
kernel=kernel8.img
enable_uart=1
gpu_mem=16
dtoverlay=disable-wifi
dtoverlay=disable-bt
CONFIG

  cat > "$ROOTFS/boot/firmware/cmdline.txt" << 'CMDLINE'
console=serial0,115200 console=tty1 root=/dev/mmcblk0p2 rootfstype=ext4 elevator=deadline fsck.repair=yes rootwait quiet splash
CMDLINE

  log "✅ RPi firmware installed"
}

stage_configure() {
  log "=== System configuration ==="
  echo "vpnnet-rpi" > "$ROOTFS/etc/hostname"

  # Network - DHCP
  cat > "$ROOTFS/etc/network/interfaces" << 'NET'
auto lo
iface lo inet loopback
auto eth0
iface eth0 inet dhcp
NET

  # Enable agent
  mkdir -p "$ROOTFS/etc/systemd/system/multi-user.target.wants/"
  ln -sf /etc/systemd/system/vpnnet-agent.service \
    "$ROOTFS/etc/systemd/system/multi-user.target.wants/vpnnet-agent.service"

  echo "root:vpnnet" | chroot "$ROOTFS" chpasswd
  echo "nameserver 8.8.8.8" > "$ROOTFS/etc/resolv.conf"
  log "✅ System configured"
}

stage_overlay() {
  log "=== Inject overlay ==="
  if [ -d "$OVERLAY" ]; then
    rsync -a "$OVERLAY/" "$ROOTFS/"
  fi
  chmod +x "$ROOTFS/usr/local/bin/vpnnet-agent.sh" 2>/dev/null || true
  log "✅ Overlay injected"
}

stage_image() {
  log "=== Creating disk image ==="
  rm -f "$OUTPUT_IMG"

  # Create sparse image
  truncate -s $((BOOT_SIZE + ROOT_SIZE)) "$OUTPUT_IMG"

  # Partition
  parted -s "$OUTPUT_IMG" mklabel msdos
  parted -s "$OUTPUT_IMG" mkpart primary fat32 1MiB "$BOOT_SIZE"
  parted -s "$OUTPUT_IMG" mkpart primary ext4 "$BOOT_SIZE" 100%

  # Loop device
  LOOP=$(losetup -fP --show "$OUTPUT_IMG")
  log "Loop device: $LOOP"

  # Format
  mkfs.vfat -n VPNNET_BOOT "${LOOP}p1"
  mkfs.ext4 -L VPNNET_ROOT "${LOOP}p2"

  # Mount and copy
  mkdir -p /mnt/vpnnet-boot /mnt/vpnnet-root
  mount "${LOOP}p1" /mnt/vpnnet-boot
  mount "${LOOP}p2" /mnt/vpnnet-root

  rsync -a "$ROOTFS/boot/firmware/" /mnt/vpnnet-boot/
  rsync -a "$ROOTFS/" /mnt/vpnnet-root/ --exclude=boot

  # Cleanup
  umount /mnt/vpnnet-boot /mnt/vpnnet-root
  losetup -d "$LOOP"
  rmdir /mnt/vpnnet-boot /mnt/vpnnet-root

  log "✅ Image created: $OUTPUT_IMG"
  ls -lh "$OUTPUT_IMG"
}

echo "═══════════════════════════════════════════════════"
echo "  VPN.net Raspberry Pi Image Builder v1.0.0"
echo "═══════════════════════════════════════════════════"

check_deps
stage_debootstrap
stage_rpi_firmware
stage_configure
stage_overlay
stage_image

echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✅ Build complete! Image at: $OUTPUT_IMG"
echo "  Size: $(ls -lh "$OUTPUT_IMG" | awk '{print $5}')"
echo "═══════════════════════════════════════════════════"
