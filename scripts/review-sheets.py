#!/usr/bin/env python3
"""Write Hebrew review sheets (Markdown) for the curated files in assets/data/curated/.

Each sheet lists every item with its question text and the reason it was chosen, so an editor can
approve it by setting "approved": true in the JSON. Output: /mnt/project-files/qa-app/review/ (override with --out).
Reads only the public app data (assets/data/qa.json), never the private corpus.
"""
import argparse
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CUR = os.path.join(ROOT, "assets", "data", "curated")


def load_qa():
    for name in ("qa.json", "qa.sample.json"):
        p = os.path.join(ROOT, "assets", "data", name)
        if os.path.exists(p):
            with open(p, encoding="utf-8") as fh:
                return {r["id"]: r for r in json.load(fh)}
    return {}


def load(name):
    p = os.path.join(CUR, name)
    if not os.path.exists(p):
        return None
    with open(p, encoding="utf-8") as fh:
        return json.load(fh)


def status(item):
    return "מאושר" if item.get("approved") else "טיוטה, ממתין לאישור"


def q_line(qa, rid):
    r = qa.get(rid)
    return f"**{r['question']}**" if r else "_(הרשומה לא נמצאה במאגר הנוכחי)_"


HEADER = """# {title}

{about}

איך מאשרים: בקובץ `assets/data/curated/{file}` משנים `"approved": false` ל־`true` בפריט שאושר.
האפליקציה מציגה רק פריטים מאושרים (חוץ מ"תצוגת טיוטה" לעורכים).

"""


def sheet_hard_now(qa, out):
    d = load("hard-now.json")
    if not d:
        return
    lines = [HEADER.format(title="סקירה: קשה לי עכשיו", about=d["_about"], file="hard-now.json")]
    lines.append("> הערה: המסך הזה רגיש. מומלץ אישור גם של איש מקצוע בתחום בריאות הנפש.\n")
    for i, it in enumerate(d["items"], 1):
        r = qa.get(it["id"])
        lines.append(f"## {i}. `{it['id']}` ({status(it)})\n")
        lines.append(q_line(qa, it["id"]) + "\n")
        if r:
            lines.append(f"> {r['answer']}\n")
        lines.append(f"**למה נבחרה:** {it['reason']}\n")
    write(out, "hard-now.md", lines)


NOTIFY_BLOCKED = re.compile("אובדנ|התאבד|פגיע|אלימ|התעלל|הטרד|מכה|מרביץ|הפלה|בגיד|בוגד|מוות|נפטר|סרטן|מחלה|מינית|התמכר")


def season_candidates(qa, s):
    """Mirror of seasonCandidates() in src/data/seasons.ts."""
    out = []
    for r in qa.values():
        if "אבל ומשבר" in r["topics"] or NOTIFY_BLOCKED.search(r["question"]) or len(r["question"]) > 110:
            continue
        if not set(r["topics"]) & set(s["topics"]):
            continue
        score = sum(1 for k in s["keywords"] if k in r["question"])
        if score:
            out.append((-score, len(r["question"]), r))
    out.sort(key=lambda x: (x[0], x[1]))
    return [r for _, _, r in out]


def sheet_seasons(qa, out):
    d = load("seasons.json")
    if not d:
        return
    lines = [HEADER.format(title="סקירה: עונות השנה", about=d["_about"], file="seasons.json")]
    for i, it in enumerate(d["items"], 1):
        lines.append(f"## {i}. לקראת {it['label']} (`{it['key']}`, {status(it)})\n")
        lines.append(f"- **חלון:** {it['from'][1]} {it['from'][0]} עד {it['to'][1]} {it['to'][0]}")
        lines.append(f"- **נושאים:** {', '.join(it['topics'])}")
        lines.append(f"- **מילות מפתח בשאלה:** {', '.join(it['keywords'])}")
        lines.append(f"- **למה:** {it['reason']}\n")
        cands = season_candidates(qa, it)
        lines.append(f"המסך בוחר 2 ביום מתוך 16 המובילות ({len(cands)} מתאימות בסך הכול). המובילות:\n")
        for r in cands[:16]:
            lines.append(f"1. {r['question']} (`{r['id']}`)")
        lines.append("")
    write(out, "seasons.md", lines)


def write(out, name, lines):
    os.makedirs(out, exist_ok=True)
    with open(os.path.join(out, name), "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))
    print("wrote", os.path.join(out, name))


SHEETS = [sheet_hard_now, sheet_seasons]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="/mnt/project-files/qa-app/review")
    args = ap.parse_args()
    qa = load_qa()
    for f in SHEETS:
        f(qa, args.out)


if __name__ == "__main__":
    main()
