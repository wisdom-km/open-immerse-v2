#!/usr/bin/env bash
# Cloud Agent install: Node from .nvmrc, then the parser worker venv.
# uv is linked into /usr/local/bin because non-interactive login shells
# do not load PATH edits written to ~/.bashrc.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

node_version="$(tr -d '[:space:]' < .nvmrc)"
set +u
# shellcheck disable=SC1091
source "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
nvm install "$node_version"
nvm use "$node_version"
nvm alias default "$node_version"
set -u

corepack enable
corepack pnpm install --frozen-lockfile

uv_version="$(tr -d '[:space:]' < workers/parser/.uv-version)"
# 升级 workers/parser/.uv-version 时必须同步更新 workers/parser/.uv-install.sha256。
# 哈希是 https://astral.sh/uv/<version>/install.sh 下载正文的 sha256（小写十六进制）。
# 计算：curl -fsSL -o uv-install.sh "https://astral.sh/uv/<version>/install.sh" && sha256sum uv-install.sh
if ! command -v uv >/dev/null 2>&1 || [[ "$(uv --version)" != "uv ${uv_version}"* ]]; then
  if [[ ! -f workers/parser/.uv-install.sha256 ]]; then
    echo "error: missing workers/parser/.uv-install.sha256 for uv ${uv_version}" >&2
    exit 1
  fi
  uv_install_sha256="$(awk 'NF && $1 !~ /^#/ { print $1; exit }' workers/parser/.uv-install.sha256 | tr -d '[:space:]')"
  if [[ ! "$uv_install_sha256" =~ ^[0-9a-f]{64}$ ]]; then
    echo "error: workers/parser/.uv-install.sha256 must contain the lowercase sha256 of the uv ${uv_version} installer" >&2
    exit 1
  fi
  if ! command -v sha256sum >/dev/null 2>&1; then
    echo "error: sha256sum is required to verify the uv ${uv_version} installer before it runs" >&2
    exit 1
  fi
  tmp_install="$(mktemp)"
  trap 'rm -f "$tmp_install"' EXIT
  if ! curl -fsSL "https://astral.sh/uv/${uv_version}/install.sh" -o "$tmp_install"; then
    echo "error: failed to download https://astral.sh/uv/${uv_version}/install.sh" >&2
    exit 1
  fi
  actual_sha256="$(sha256sum "$tmp_install" | awk '{ print $1 }')"
  if [[ "$actual_sha256" != "$uv_install_sha256" ]]; then
    echo "error: sha256 mismatch for https://astral.sh/uv/${uv_version}/install.sh; not executing" >&2
    echo "  expected: ${uv_install_sha256}" >&2
    echo "  actual:   ${actual_sha256}" >&2
    exit 1
  fi
  env UV_INSTALL_DIR="${HOME}/.local/bin" UV_NO_MODIFY_PATH=1 sh "$tmp_install"
  rm -f "$tmp_install"
  trap - EXIT
fi
# sudo 仅用于 Cloud Agent VM（下面两行软链，以及 Chrome / 字体段里的 sudo）。
sudo ln -sfn "${HOME}/.local/bin/uv" /usr/local/bin/uv
sudo ln -sfn "${HOME}/.local/bin/uvx" /usr/local/bin/uvx

(
  cd workers/parser
  uv python install
  uv sync --frozen --extra dev
)

# Chrome and CJK fonts stay best-effort, matching the previous install.
# A failure here must not hide a broken Node or Python toolchain.
if ! command -v google-chrome >/dev/null 2>&1; then
  npx -y @puppeteer/browsers install chrome@stable --path "${HOME}/.cache/chrome" &&
    sudo ln -sfn "$(ls -d "${HOME}/.cache/chrome/chrome/"*/chrome-linux64 | head -n 1)/chrome" /usr/local/bin/google-chrome ||
    true
fi
if ! fc-list :lang=zh | grep -q .; then
  sudo apt-get update &&
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends fonts-noto-cjk ||
    true
fi
