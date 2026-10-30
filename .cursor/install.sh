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

if [[ -f pnpm-lock.yaml ]]; then
  corepack enable
  corepack pnpm install --frozen-lockfile
elif [[ -f package-lock.json ]]; then
  npm ci
else
  echo "install: expected pnpm-lock.yaml or package-lock.json" >&2
  exit 1
fi

uv_version="$(tr -d '[:space:]' < workers/parser/.uv-version)"
if ! command -v uv >/dev/null 2>&1 || [[ "$(uv --version)" != "uv ${uv_version}"* ]]; then
  curl -LsSf "https://astral.sh/uv/${uv_version}/install.sh" |
    env UV_INSTALL_DIR="${HOME}/.local/bin" UV_NO_MODIFY_PATH=1 sh
fi
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
