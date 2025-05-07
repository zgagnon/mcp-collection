#!/bin/bash
cd "$(dirname "$0")"
npm run build
echo "Build exit code: $?"