#!/usr/bin/env python3
"""Build the app's Q&A data from the edited production corpus.

Reads  /mnt/project-files/qa-app/prod/edited/*.jsonl  (override with --src)
Writes assets/data/qa.json         (full public set; git-ignored for now)
       assets/data/qa.sample.json  (first N ready records; committed for development)
       assets/data/similar.json    ("לא רק אתם": coarse bucket per public id, see similar_buckets)

PRIVACY: the source corpus contains client names and recording metadata. Only the
whitelisted PUBLIC_FIELDS below are ever written. Never add source, source_quotes,
recording_id, unit, privacy_removed, fact_check, edit_note, notes or any other field.
"""
import argparse
import glob
import json
import math
import os
import re
import sys
from collections import Counter, defaultdict

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


# ---------- "לא רק אתם": near-duplicate questions ----------

NIQQUD = re.compile("[\u0591-\u05BD\u05BF-\u05C7]")
FINALS = str.maketrans("ךםןףץ", "כמנפצ")
STOP = set(
    (
        "של את על עם זה זו זאת הוא היא הם הן אני אנחנו אתה אתם אתן לא כן יש אין מה מי איך למה האם כי אם או "
        "גם רק כל עוד אבל אז כמו יותר מאוד היה הייתה היתה להיות לי לו לה לך לכם להם שלי שלו שלה שלך שלנו "
        "שלהם אל מן בין כדי אחרי לפני כאשר כך כבר ואם וגם ולא שלא זהו הזה הזאת אותו אותה אותי אותך אותם עצמי "
        "איזה איזו כמה מתי כיצד מדוע נכון אפשר צריך כדאי עליי עלי לעשות"
    ).translate(FINALS).split()
)

# Validated on random samples of pairs (see README): below these values most "similar" pairs were
# different questions on the same subject; at or above them about 9 in 10 were the same question.
SIM_JACCARD = 0.25
SIM_COSINE = 0.45
SIM_MIN = 3  # never show a bucket for fewer than 3 askers (small clusters could identify someone)


def stems(text):
    t = NIQQUD.sub("", text).translate(FINALS).replace('"', "").replace("'", "")
    out = set()
    for w in re.split(r"[^א-ת0-9]+", t):
        if len(w) < 2 or w in STOP:
            continue
        for _ in range(2):  # drop up to two prefix letters (ו ה ב ל מ ש כ), keeping 3+ letter stems
            if len(w) >= 4 and w[0] in "והבלמשכ":
                w = w[1:]
            else:
                break
        if w not in STOP:
            out.add(w)
    return out


def bucket(n):
    if n < SIM_MIN:
        return None
    if n < 10:
        return "few"
    if n < 100:
        return "tens"
    return "hundreds"


def similar_buckets(recs):
    """recs: list of (public_id_or_None, question, recording_id) over every asked question in the corpus.

    Two questions are near-duplicates when both their stem-set Jaccard and TF-IDF cosine pass the
    thresholds. An answer's count is the number of DISTINCT recordings among itself and its
    near-duplicates (one person asking twice counts once). Only coarse buckets leave this function.
    """
    toks = [stems(q) for _, q, _ in recs]
    n = len(recs)
    df = Counter(w for t in toks for w in t)
    idf = {w: math.log(n / c) for w, c in df.items()}
    vecs = []
    for t in toks:
        norm = math.sqrt(sum(idf[w] ** 2 for w in t)) or 1.0
        vecs.append({w: idf[w] / norm for w in t})
    inv = defaultdict(list)
    for i, t in enumerate(toks):
        for w in t:
            inv[w].append(i)
    common = max(50, n // 10)  # words in >10% of questions do not nominate candidates
    neighbours = defaultdict(set)
    pairs = 0
    for i, t in enumerate(toks):
        dot = Counter()
        for w in t:
            if df[w] > common:
                continue
            for j in inv[w]:
                if j > i:
                    dot[j] += vecs[i][w] * vecs[j][w]
        for j, cos in dot.items():
            if cos < SIM_COSINE:
                continue
            jac = len(t & toks[j]) / (len(t | toks[j]) or 1)
            if jac >= SIM_JACCARD:
                pairs += 1
                neighbours[i].add(j)
                neighbours[j].add(i)
    out, sizes = {}, Counter()
    for i, (pid, _, rec) in enumerate(recs):
        if not pid:
            continue
        askers = {rec} | {recs[j][2] for j in neighbours[i]}
        b = bucket(len(askers))
        sizes[b or "none"] += 1
        if b:
            out[pid] = b
    return out, sizes, pairs


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
    asked = []  # (public id or None, question, recording_id) for the similarity counts; never written out
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
                if rec.get("status") not in ("ready", "rav_review"):
                    continue
                rid = (rec.get("source") or {}).get("recording_id") or f"?{rec.get('id')}"
                if rec.get("status") != "ready":
                    asked.append((None, (rec.get("question") or "").strip(), rid))
                    continue
                r = clean(rec)
                if not r["id"] or not r["question"] or not r["answer"]:
                    bad += 1
                    continue
                if r["question"] in seen_q or r["id"] in seen_id:
                    dupes += 1
                    asked.append((None, r["question"], rid))  # the same question asked again still counts
                    continue
                seen_q.add(r["question"])
                seen_id.add(r["id"])
                ready.append(r)
                asked.append((r["id"], r["question"], rid))

    out_dir = os.path.join(ROOT, "assets", "data")
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, "qa.json"), "w", encoding="utf-8") as fh:
        json.dump(ready, fh, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(out_dir, "qa.sample.json"), "w", encoding="utf-8") as fh:
        json.dump(ready[: args.sample], fh, ensure_ascii=False, indent=1)

    similar, sizes, pairs = similar_buckets(asked)
    with open(os.path.join(out_dir, "similar.json"), "w", encoding="utf-8") as fh:
        json.dump(dict(sorted(similar.items())), fh, ensure_ascii=False, indent=0)

    topics = Counter(t for r in ready for t in r["topics"])
    print(f"files: {len(files)}")
    print("status: " + ", ".join(f"{k}={v}" for k, v in status.most_common()))
    print(f"ready kept: {len(ready)}  duplicate questions dropped: {dupes}  malformed: {bad}")
    print(f"sample: {min(args.sample, len(ready))}")
    print(f"similar: {len(asked)} asked questions, {pairs} near-duplicate pairs; buckets: "
          + ", ".join(f"{k}={sizes[k]}" for k in ("none", "few", "tens", "hundreds")))
    print("topics: " + ", ".join(f"{k} {v}" for k, v in topics.most_common()))


if __name__ == "__main__":
    main()
