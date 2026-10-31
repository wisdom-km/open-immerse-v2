# workers/parser 的局部约定

本目录是 Python worker（uv 项目），路径见 [ARCHITECTURE.md](../../ARCHITECTURE.md) §3 与 §10.3。`pyproject.toml`、`uv.lock`、`.python-version`、`.uv-version` 与 `tests/` 已经在仓库里。本文件只写本目录的工具链约定。

产品范围、禁止事项，以及一个 PR 怎样算做完，以仓库根 [AGENTS.md](../../AGENTS.md) 和 [RULES.md](../../RULES.md) 为准。本文件与根文件冲突时，以根 AGENTS.md、RULES.md 为准。本文件不覆盖它们，也不复制它们的正文。

下面命令的工作目录是本目录（`workers/parser/`）。

## Python 与 uv

- Python 以 `.python-version` 为准（当前 `3.11.18`）。`pyproject.toml` 的 `requires-python` 是 `>=3.11.18,<3.12`。
- 依赖用 uv 管理。uv 版本以 `.uv-version` 为准，并与 `pyproject.toml` 的 `tool.uv.required-version` 相同（当前 `0.13.6`）。`uv.lock` 入库。
- 安装：`uv python install`，然后 `uv sync --frozen --extra dev`。

## ruff

配置在 `pyproject.toml` 的 `[tool.ruff]`。

- `uv run ruff check .`
- `uv run ruff format --check .`

## pyright 与 import-linter

- `uv run pyright`（RULES §1.2，strict）
- `uv run lint-imports`（G6，ARCHITECTURE §10.3）

## pytest

配置在 `pyproject.toml` 的 `[tool.pytest.ini_options]`，`testpaths = ["tests"]`。

- `uv run pytest`
- 有测试文件之后，单文件：`uv run pytest tests/test_<模块>.py`；按名称：`uv run pytest -k <名字>`

`tests/` 里有用例。`uv run pytest` 收集到 0 个用例时退出码仍是 5，CI 不再把 5 改成通过。命令与退出码见根 [AGENTS.md](../../AGENTS.md)「命令」。

PDF 只用 `pypdfium2`。不要加 PyMuPDF / `fitz`（[RULES.md](../../RULES.md) §1.5）。重依赖放在哪一层见 ARCHITECTURE §10.3 与 RULES §1.2。
