#!/usr/bin/env python3
"""
Frontend patch: render score=null / NOT_EVALUATED honestly.
Run from the nlc_frontend_clean repo root:  python patch_frontend_null_score.py

Safety: every replacement must match EXACTLY ONCE or nothing is written.
Handles LF and CRLF files. Does not commit anything.
"""
import sys
from pathlib import Path

ROOT = Path.cwd()

EDITS = [
    # ---------------- app/dashboard/companies/[id]/page.tsx ----------------
    (
        "app/dashboard/companies/[id]/page.tsx",
        "const score = compliance?.current_score || compliance?.compliance_score || company.compliance_score || company.current_compliance_score || 0",
        "const score: number | null = compliance\n"
        "    ? (compliance.current_score ?? compliance.compliance_score ?? null)\n"
        "    : (company.current_compliance_score ?? company.compliance_score ?? null)",
    ),
    (
        "app/dashboard/companies/[id]/page.tsx",
        "<span>SCORE <strong style={{color:bandColor}}>{score}/100</strong></span>",
        "<span>SCORE <strong style={{color:bandColor}}>{score === null ? 'Not evaluated' : `${score}/100`}</strong></span>",
    ),
    (
        "app/dashboard/companies/[id]/page.tsx",
        "strokeDasharray={`${(score/100)*105} 105`}",
        "strokeDasharray={`${((score ?? 0)/100)*105} 105`}",
    ),
    (
        "app/dashboard/companies/[id]/page.tsx",
        "fontFamily=\"'DM Serif Display',serif\">{score}</text>",
        "fontFamily=\"'DM Serif Display',serif\">{score === null ? '\u2014' : score}</text>",
    ),
    (
        "app/dashboard/companies/[id]/page.tsx",
        "<div style={{fontSize:14,color:'var(--green)',fontWeight:600}}>{band==='NOT_EVALUATED' ? 'Not evaluated' : '\u2713 No active violations'}</div>",
        "<div style={{fontSize:14,color:band==='NOT_EVALUATED'?'var(--text3)':'var(--green)',fontWeight:600}}>{band==='NOT_EVALUATED' ? 'Not evaluated \u2014 insufficient data' : '\u2713 No active violations'}</div>",
    ),
    (
        "app/dashboard/companies/[id]/page.tsx",
        "{band==='NOT_EVALUATED' ? 'This company has not been evaluated' : 'No violations detected by the rules evaluated'}",
        "{band==='NOT_EVALUATED' ? 'Not enough information on file to assess compliance. This is not a clean result.' : 'No violations detected by the rules evaluated'}",
    ),
    # ---------------- components/ui.tsx ----------------
    (
        "components/ui.tsx",
        "export function ScoreBar({ score, band }: { score: number; band: string }) {",
        "export function ScoreBar({ score, band }: { score: number | null; band: string }) {",
    ),
    (
        "components/ui.tsx",
        "<div style={{ height: 4, background: fill, width: `${score}%` }} />",
        "<div style={{ height: 4, background: fill, width: `${score ?? 0}%` }} />",
    ),
    (
        "components/ui.tsx",
        "minWidth: 28, textAlign: 'right', color: text }}>{score}</div>",
        "minWidth: 28, textAlign: 'right', color: text }}>{score ?? '\u2014'}</div>",
    ),
    # ---------------- app/globals.css (badge-not_evaluated was undefined) ----------------
    (
        "app/globals.css",
        ".badge-neutral, .badge-pill.badge-neutral { background: var(--white-4); color: var(--white-2); }",
        ".badge-neutral, .badge-pill.badge-neutral { background: var(--white-4); color: var(--white-2); }\n"
        ".badge-not_evaluated, .badge-pill.badge-not_evaluated { background: var(--white-4); color: var(--white-2); }",
    ),
    # ---------------- types/index.ts (ScoreBreakdown) ----------------
    (
        "types/index.ts",
        "  raw_total: number\n"
        "  final_score: number\n"
        "  override_applied: boolean\n"
        "  override_reason: string | null\n"
        "  risk_band: string\n"
        "  exposure_band: string\n"
        "  revenue_tier: string\n"
        "  active_flag_count: number",
        "  raw_total: number\n"
        "  final_score: number | null\n"
        "  override_applied: boolean\n"
        "  override_reason: string | null\n"
        "  risk_band: string\n"
        "  exposure_band: string | null\n"
        "  revenue_tier: string | null\n"
        "  active_flag_count: number",
    ),
]


def main() -> int:
    files = {}
    errors = []
    for rel, old, new in EDITS:
        p = ROOT / rel
        if not p.exists():
            errors.append(f"MISSING FILE: {rel}")
            continue
        if rel not in files:
            raw = p.read_bytes().decode("utf-8")
            files[rel] = [raw, "\r\n" in raw]
        text, crlf = files[rel]
        o = old.replace("\n", "\r\n") if crlf else old
        n = new.replace("\n", "\r\n") if crlf else new
        c = text.count(o)
        if c != 1:
            errors.append(f"{rel}: expected 1 match, found {c}: {old[:70]!r}")
            continue
        files[rel][0] = text.replace(o, n)

    if errors:
        print("ABORTED - nothing written. Problems:")
        for e in errors:
            print("  -", e)
        return 1

    for rel, (text, _) in files.items():
        (ROOT / rel).write_bytes(text.encode("utf-8"))
        print("patched", rel)
    print("OK. Next: npx tsc --noEmit && npm run build")
    return 0


if __name__ == "__main__":
    sys.exit(main())
