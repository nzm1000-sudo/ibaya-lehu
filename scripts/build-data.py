#!/usr/bin/env python3
"""Build the app's Q&A data from the edited production corpus.

Reads  /mnt/project-files/qa-app/prod/edited/*.jsonl  (override with --src)
Writes assets/data/qa.json         (full public set; git-ignored for now)
       assets/data/qa.sample.json  (first N ready records; committed for development)

PRIVACY: the source corpus contains client names and recording metadata. Only the
whitelisted PUBLIC_FIELDS below are ever written. Never add source, source_quotes,
recording_id, unit, privacy_removed, fact_check, edit_note, notes or any other field.
"""
import argparse
import glob
import json
import os
import sys
from collections import Counter

PUBLIC_FIELDS = ("id", "question", "answer", "topics", "applies_when", "not_when", "faith", "source_kind")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def clean(rec):
    out = {k: rec.get(k) for k in PUBLIC_FIELDS}
    out["question"] = (out["question"] or "").strip()
    out["answer"] = (out["answer"] or "").strip()
    out["topics"] = [t for t in (out["topics"] or []) if isinstance(t, str) and t.strip()]
    out["applies_when"] = (out["applies_when"] or "").strip() or None
    out["not_when"] = (out["not_when"] or "").strip() or None
    out["faith"] = bool(out["faith"])
    out["source_kind"] = out["source_kind"] or None
    assert set(out) == set(PUBLIC_FIELDS)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default="/mnt/project-files/qa-app/prod/edited")
    ap.add_argument("--sample", type=int, default=300)
    args = ap.parse_args()

    files = sorted(glob.glob(os.path.join(args.src, "*.jsonl")))
    if not files:
        sys.exit(f"no .jsonl files in {args.src}")

    status = Counter()
    seen_q, seen_id = set(), set()
    dupes = bad = 0
    ready = []
    for fn in files:
        with open(fn, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    rec = json.loads(line)
                except json.JSONDecodeError:
                    bad += 1
                    continue
                status[rec.get("status")] += 1
                if rec.get("status") != "ready":
                    continue
                r = clean(rec)
                if not r["id"] or not r["question"] or not r["answer"]:
                    bad += 1
                    continue
                if r["question"] in seen_q or r["id"] in seen_id:
                    dupes += 1
                    continue
                seen_q.add(r["question"])
                seen_id.add(r["id"])
                ready.append(r)

    out_dir = os.path.join(ROOT, "assets", "data")
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, "qa.json"), "w", encoding="utf-8") as fh:
        json.dump(ready, fh, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(out_dir, "qa.sample.json"), "w", encoding="utf-8") as fh:
        json.dump(ready[: args.sample], fh, ensure_ascii=False, indent=1)

    topics = Counter(t for r in ready for t in r["topics"])
    print(f"files: {len(files)}")
    print("status: " + ", ".join(f"{k}={v}" for k, v in status.most_common()))
    print(f"ready kept: {len(ready)}  duplicate questions dropped: {dupes}  malformed: {bad}")
    print(f"sample: {min(args.sample, len(ready))}")
    print("topics: " + ", ".join(f"{k} {v}" for k, v in topics.most_common()))


if __name__ == "__main__":
    main()
