#!/usr/bin/env python3
"""
Compare VanillaBean with the EscapeVelocity template it is synced from.

    status         EscapeVelocity's TEMPLATE_VERSION against TEMPLATE_SYNC.json's synced_to, and every changelog
                   entry newer than synced_to with each file it touches classified for VanillaBean
    drift [--all]  every in-scope EscapeVelocity file, mapped through path_map, classified as identical, deviation,
                   opted out, DRIFT (differs but not a declared deviation) or MISSING (absent but not opted out);
                   --all also lists identical and opted-out files, and VanillaBean-only files

Exits 1 when drift finds DRIFT or MISSING files, or stale TEMPLATE_SYNC.json entries, so it can gate a sync.
Run through ./template.sh.
"""

import fnmatch
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SYNC_FILE = ROOT / "TEMPLATE_SYNC.json"

RED, GREEN, YELLOW, BLUE, DIM, NC = "\033[0;31m", "\033[0;32m", "\033[1;33m", "\033[0;34m", "\033[2m", "\033[0m"

# Generated per-backend output: listed as one line per backend instead of file by file.
BACKEND_QUERY = re.compile(r"^src/Backends/([^/]+)/Query/")


def load_sync() -> dict:
    with open(SYNC_FILE) as f:
        return json.load(f)


def template_root(sync: dict) -> Path:
    root = Path(sync["template_path"]).expanduser()
    if not (root / "TEMPLATE_VERSION").is_file():
        sys.exit(f"{RED}EscapeVelocity not found at {root} (template_path in TEMPLATE_SYNC.json){NC}")
    return root


def git_files(repo: Path, *, include_untracked: bool = False) -> list[str]:
    args = ["git", "-C", str(repo), "ls-files", "--cached"]
    if include_untracked:
        args += ["--others", "--exclude-standard"]
    out = subprocess.run(args, check=True, capture_output=True, text=True).stdout
    return sorted({line for line in out.splitlines() if line and (repo / line).is_file()})


def in_scope(path: str, sync: dict) -> bool:
    return any(path == s or (s.endswith("/") and path.startswith(s)) for s in sync["scope"])


def map_path(path: str, sync: dict) -> str | None:
    """Translate an EscapeVelocity path to its VanillaBean location (first matching path_map entry wins)."""
    for entry in sync["path_map"]:
        source, target = entry["from"], entry["to"]
        if source.endswith("/"):
            if path.startswith(source):
                return target + path[len(source):]
        elif path == source:
            return target
    return None


def matches(path: str, patterns: list[str]) -> bool:
    # fnmatch's "*" also crosses "/", so "dir/**" covers the whole tree.
    return any(fnmatch.fnmatchcase(path, p) for p in patterns)


def parse_version(text: str) -> tuple[int, ...]:
    return tuple(int(part) for part in re.findall(r"\d+", text)[:3])


def classify(path: str, sync: dict, ev: Path) -> tuple[str, str | None]:
    opted_out = [e["path"] for e in sync["opted_out"]]
    deviations = {e["path"] for e in sync["deviations"]}
    if not in_scope(path, sync):
        return "out of scope", None
    target = map_path(path, sync)
    if target is None:
        return "unmapped", None
    local = ROOT / target
    if local.is_file():
        if local.read_bytes() == (ev / path).read_bytes():
            return "identical", target
        return ("deviation" if path in deviations else "DRIFT"), target
    return ("opted out" if matches(path, opted_out) else "MISSING"), target


def cmd_status(sync: dict) -> int:
    ev = template_root(sync)
    current = (ev / "TEMPLATE_VERSION").read_text().strip()
    synced = sync["synced_to"]
    print(f"\n{BLUE}EscapeVelocity {current}{NC}  -  VanillaBean synced to {synced} on {sync['synced_on']}")
    if parse_version(current) <= parse_version(synced):
        print(f"{GREEN}Up to date.{NC}\n")
        return 0

    changelog = (ev / "TEMPLATE_CHANGELOG.md").read_text().splitlines()
    sections: list[tuple[str, list[str]]] = []
    for line in changelog:
        heading = re.match(r"^## (\d+\.\d+\.\d+)\b(.*)$", line)
        if heading:
            sections.append((line[3:].strip(), []))
        elif sections:
            sections[-1][1].append(line)

    pending = [(title, body) for title, body in sections if parse_version(title) > parse_version(synced)]
    print(f"{YELLOW}{len(pending)} newer changelog entr{'y' if len(pending) == 1 else 'ies'} - apply oldest first:{NC}\n")
    for title, body in reversed(pending):
        print(f"{BLUE}## {title}{NC}")
        for line in body:
            if line.startswith("### "):
                print(f"   {line[4:]}")
            file_line = re.match(r"^\s+- ([\w./\-]+/[\w./\-]+|[\w\-]+\.\w+)\s*\(", line)
            if file_line:
                path = file_line.group(1)
                kind, target = classify(path, sync, ev) if (ev / path).exists() or in_scope(path, sync) else ("out of scope", None)
                if kind in ("out of scope", "opted out"):
                    print(f"      {DIM}{path} - {kind}, skip{NC}")
                else:
                    print(f"      {path} -> {target or '?'} ({kind})")
        print()
    return 0


def cmd_drift(sync: dict, show_all: bool) -> int:
    ev = template_root(sync)
    groups: dict[str, list[tuple[str, str | None]]] = {}
    produced: set[str] = set()
    for path in git_files(ev):
        if not in_scope(path, sync):
            continue
        kind, target = classify(path, sync, ev)
        groups.setdefault(kind, []).append((path, target))
        if target:
            produced.add(target)

    order = ["DRIFT", "MISSING", "unmapped", "deviation", "opted out", "identical"]
    colours = {"DRIFT": RED, "MISSING": RED, "unmapped": RED, "deviation": YELLOW, "opted out": DIM, "identical": GREEN}
    print()
    for kind in order:
        items = groups.get(kind, [])
        if not items:
            continue
        print(f"{colours[kind]}[{kind}] {len(items)}{NC}")
        if kind in ("identical", "opted out") and not show_all:
            continue
        for path, target in items:
            suffix = f" -> {target}" if target and target != path else ""
            print(f"    {path}{suffix}")

    # Entries in TEMPLATE_SYNC.json that no longer match anything in EscapeVelocity.
    ev_paths = set(git_files(ev))
    stale = [e["path"] for e in sync["deviations"] if e["path"] not in ev_paths]
    stale += [e["path"] for e in sync["opted_out"] if not any(fnmatch.fnmatchcase(p, e["path"]) for p in ev_paths)]
    if stale:
        print(f"{RED}[stale TEMPLATE_SYNC.json entries] {len(stale)}{NC}")
        for path in stale:
            print(f"    {path}")

    local_only = [p for p in git_files(ROOT, include_untracked=True) if p not in produced]
    backends = sorted({m.group(1) for p in local_only if (m := BACKEND_QUERY.match(p))})
    local_only = [p for p in local_only if not BACKEND_QUERY.match(p)]
    print(f"{BLUE}[VanillaBean only] {len(local_only)}{NC}" + (f"  {DIM}+ generated hooks for: {', '.join(backends)}{NC}" if backends else ""))
    if show_all:
        for path in local_only:
            print(f"    {path}")
    print()

    failed = bool(groups.get("DRIFT") or groups.get("MISSING") or groups.get("unmapped") or stale)
    if failed:
        print(f"{RED}Drift found. Copy shared files verbatim, or record the difference in TEMPLATE_SYNC.json.{NC}\n")
    else:
        print(f"{GREEN}No unexpected drift.{NC}\n")
    return 1 if failed else 0


def main(argv: list[str]) -> int:
    sync = load_sync()
    command = argv[0] if argv else "status"
    if command == "status":
        return cmd_status(sync)
    if command == "drift":
        return cmd_drift(sync, show_all="--all" in argv[1:])
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
