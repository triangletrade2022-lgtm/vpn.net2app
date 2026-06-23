# ═══════════════════════════════════════════════════════════
#  VPN.net ISO Builder — Build Environment
#  Build: docker build -t vpnnet-iso-builder .
#  Run:   docker run --privileged -v $(pwd)/builds:/builds vpnnet-iso-builder
# ═══════════════════════════════════════════════════════════
FROM debian:bookworm-slim

LABEL maintainer="VPN.net Team"
LABEL description="VPN.net ISO Builder — cross-compile client ISOs for PC, RPi, and Router"

# ── Install build dependencies ──
RUN apt-get update && apt-get install -y --no-install-recommends \
    # ISO build tools
    debootstrap \
    squashfs-tools \
    xorriso \
    isolinux \
    syslinux-common \
    # RPi tools
    qemu-user-static \
    binfmt-support \
    parted \
    kpartx \
    dosfstools \
    # Common
    curl \
    ca-certificates \
    rsync \
    xz-utils \
    make \
    gzip \
    # Cleanup
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ── Create build user ──
RUN useradd -m -s /bin/bash builder
WORKDIR /home/builder

# ── Copy builder scripts ──
COPY build-pc.sh build-pi.sh build-router.sh Makefile ./
COPY rootfs-overlay ./rootfs-overlay/
RUN chmod +x build-pc.sh build-pi.sh build-router.sh

# ── Default command ──
CMD ["make", "all"]
