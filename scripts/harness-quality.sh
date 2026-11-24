#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -f package.json ]]; then echo 'package.json não encontrado' >&2; exit 1; fi
node -e 'const s=require("./package.json").scripts||{}; for(const k of ["lint","typecheck","test","build"]) if(!s[k]) {console.error(`Script ausente: ${k}`); process.exitCode=1}'
for task in lint typecheck test; do
  echo "==> npm run $task"
  CI=true npm run "$task"
done
echo '==> npm run build (NEXT_DIST_DIR=.next-verificacao)'
CI=true NEXT_DIST_DIR=.next-verificacao npm run build
echo 'Quality gate básico concluído. E2E é uma etapa separada.'
