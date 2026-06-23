# ═══════════════════════════════════════════════════════════
#  VPN.net Client ISO Builder — Makefile
# ═══════════════════════════════════════════════════════════

BUILD_DIR := builds
SCRIPTS_DIR := .
VERSION := 1.0.0

.PHONY: all pc pi router docker clean help

help:
	@echo "VPN.net Client ISO Builder v$(VERSION)"
	@echo ""
	@echo "Targets:"
	@echo "  make all       — Build all 3 images (PC + Pi + Router)"
	@echo "  make pc        — Build PC/Server x86_64 ISO (~850 MB)"
	@echo "  make pi        — Build Raspberry Pi ARM64 image (~520 MB)"
	@echo "  make router    — Build OpenWRT firmware for 300+ models (~120 MB)"
	@echo "  make docker    — Build Docker build environment"
	@echo "  make docker-run — Build all ISOs inside Docker container"
	@echo "  make clean     — Remove all build artifacts"
	@echo ""
	@echo "Output directory: $(BUILD_DIR)/"
	@echo ""

all: pc pi router
	@echo "═══════════════════════════════════════════════════"
	@echo "  ✅ All builds complete!"
	@ls -lh $(BUILD_DIR)/*.iso $(BUILD_DIR)/*.img 2>/dev/null || true
	@ls -lh $(BUILD_DIR)/router/firmware/*/*.bin 2>/dev/null || true
	@echo "═══════════════════════════════════════════════════"

pc:
	@echo "Building PC/Server ISO ..."
	@bash $(SCRIPTS_DIR)/build-pc.sh

pi:
	@echo "Building Raspberry Pi image ..."
	@bash $(SCRIPTS_DIR)/build-pi.sh

router:
	@echo "Building Router firmware ..."
	@bash $(SCRIPTS_DIR)/build-router.sh

docker:
	@echo "Building Docker build environment ..."
	docker build -t vpnnet-iso-builder .

docker-run: docker
	@echo "Running build inside Docker (requires --privileged for loop devices) ..."
	mkdir -p $(BUILD_DIR)
	docker run --rm --privileged \
		-v $(PWD)/$(BUILD_DIR):/home/builder/$(BUILD_DIR) \
		vpnnet-iso-builder \
		make all

clean:
	@echo "Cleaning build artifacts ..."
	rm -rf $(BUILD_DIR)/pc-x86_64
	rm -rf $(BUILD_DIR)/raspberry-pi
	rm -rf $(BUILD_DIR)/router
	rm -f $(BUILD_DIR)/*.iso $(BUILD_DIR)/*.img
	@echo "✅ Clean complete"
