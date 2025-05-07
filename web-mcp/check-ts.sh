#!/bin/bash
cd "$(dirname "$0")"
npx tsc --noEmit
echo "TypeScript check exit code: $?"