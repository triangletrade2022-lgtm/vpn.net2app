# VPN.net Client ISO Builder

Build bootable client images for PC, Raspberry Pi, and Router — all pre-configured to auto-register and connect to your VPN.net platform.

## Quick Start

```bash
# Install dependencies
apt install debootstrap squashfs-tools xorriso isolinux syslinux-common \
            qemu-user-static parted kpartx dosfstools rsync curl

# Build all 3 images
make all

# Or build individually
make pc      # PC/Server x86_64 ISO  (~850 MB)
make pi      # Raspberry Pi ARM64 img (~520 MB)
make router  # OpenWRT firmware       (~120 MB)
```

## Docker Build

```bash
# Build the Docker image
make docker

# Run build inside container
make docker-run
```

## Output

| Image | File | Size | Description |
|-------|------|------|-------------|
| PC/Server | `builds/vpnnet-pc-x86_64.iso` | ~850 MB | Bootable ISO for x86_64 systems |
| Raspberry Pi | `builds/vpnnet-rpi.img` | ~520 MB | Flash to SD card for RPi 3/4/5 |
| Router | `builds/router/firmware/*/*.bin` | ~120 MB | OpenWRT firmware for 300+ models |

## What's Inside

Each image contains:

- **VPN.net Agent** (`vpnnet-agent.sh`) — runs at boot, calls home to register the device by MAC address
- **WireGuard** — pre-installed, auto-configures tunnel to your OVH hub (`51.161.45.126:51820`)
- **Auto-heartbeat** — reports device status every 5 minutes
- **Headless operation** — no monitor needed, plug and play

## Architecture

```
┌──────────────────────┐
│   Client Device      │
│                      │
│  ┌────────────────┐  │     ┌──────────────────────┐
│  │ vpnnet-agent   │──┼─────▶  VPN.net Server     │
│  │ auto-register  │  │     │  API: :3001         │
│  │ by MAC address │  │     │  WG: :51820         │
│  └───────┬────────┘  │     └──────────────────────┘
│          │           │
│  ┌───────▼────────┐  │
│  │ WireGuard wg0  │──┼─────▶ OVH Hub (51.161.45.126)
│  │ tunnel to hub  │  │     Routes traffic globally
│  └────────────────┘  │
└──────────────────────┘
```

## Registration Flow

1. Device boots → agent starts
2. Agent reads MAC address → generates device ID
3. Agent calls `POST /api/device/register` with device info
4. Server assigns IP, generates WireGuard config
5. Agent downloads config → starts tunnel
6. Agent sends heartbeat every 5 minutes

See `rootfs-overlay/usr/local/bin/vpnnet-agent.sh` for the full agent logic.
