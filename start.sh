#!/usr/bin/env bash
# WSL2에서 개발 서버를 켜고 Windows 기본 브라우저로 연다.
set -euo pipefail

cd "$(dirname "$(readlink -f "$0")")"

PORT="$(sed -n 's/.*"dev": ".*--port[= ]\{0,1\}\([0-9][0-9]*\).*/\1/p' package.json)"
if [[ -z "${PORT}" ]]; then
  echo "package.json의 dev 스크립트에서 포트를 찾지 못했습니다." >&2
  exit 1
fi

# Windows의 localhost 전달(기본값)이 이 주소로 WSL 서버에 닿는다.
URL="http://localhost:${PORT}/"

server_up() {
  curl -s -o /dev/null --max-time 2 "http://127.0.0.1:${PORT}/"
}

open_windows() {
  local url="$1"
  if ! grep -qiE 'microsoft|wsl' /proc/version 2>/dev/null; then
    echo "WSL이 아닙니다. 브라우저 주소: ${url}"
    return 0
  fi

  local lan=""
  lan="$(ip -4 -o addr show eth0 2>/dev/null | awk '{print $4}' | cut -d/ -f1 | head -1 || true)"

  echo "Windows 브라우저에서 엽니다: ${url}"
  if [[ -n "${lan}" ]]; then
    echo "WSL 주소: http://${lan}:${PORT}/"
  fi

  # 현재 디렉터리가 \\wsl$\... 이면 cmd.exe가 UNC 경로를 거부한다.
  if [[ -d /mnt/c && -x /mnt/c/Windows/System32/cmd.exe ]]; then
    (cd /mnt/c && /mnt/c/Windows/System32/cmd.exe /c start "" "${url}") >/dev/null 2>&1
    return 0
  fi
  if command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -Command "Start-Process '${url}'" >/dev/null 2>&1
    return 0
  fi

  echo "Windows 브라우저를 열지 못했습니다. 주소: ${url}" >&2
  return 1
}

if server_up; then
  echo "개발 서버가 이미 ${PORT}번 포트에서 실행 중입니다."
  open_windows "${URL}"
  exit 0
fi

(
  for _ in $(seq 1 60); do
    if server_up; then
      open_windows "${URL}"
      exit 0
    fi
    sleep 0.5
  done
  echo "서버가 ${PORT}번 포트에서 응답하지 않아 브라우저를 열지 않았습니다." >&2
) &
waiter=$!

cleanup() {
  kill "${waiter}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

npm run dev
