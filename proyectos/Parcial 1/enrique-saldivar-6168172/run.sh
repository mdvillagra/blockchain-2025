#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
./scripts/compile.sh
./scripts/generate_proof.sh
./scripts/verify.sh
node verify.js
