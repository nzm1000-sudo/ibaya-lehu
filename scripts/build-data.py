#!/usr/bin/env python3
"""Build the app's Q&A data from the edited production corpus.

Reads  /mnt/project-files/qa-app/prod/edited/*.jsonl  (override with --src)
       /mnt/project-files/qa-app/prod/raw/*.jsonl     (every extracted question, any status; --raw)
Writes assets/data/qa.json         (full public set; git-ignored for now)
       assets/data/qa.sample.json  (first N ready records; committed for development)
       assets/data/similar.json    ("לא רק אתם": coarse bucket per public id, see similar_buckets)
       assets/data/related.json    ("שאלות דומות": up to 4 public ids per public id, see related_ids)
       assets/data/curated/glossary.candidates.json  (how many public answers use each candidate term)
       assets/data/curated/other-side.candidates.json ("הצד השני": candidate pairs of public ids)
and checks assets/data/curated/other-side.json: any pair whose two answers come from the same
recording is removed (never link two records of one consultation; that could identify a couple).

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

PUBLIC_FIELDS = ("id", "question", "answer", "topics", "applies_when", "not_when", "faith", "source_kind", "sensitive")
# A record is "sensitive" (no sharing, never in notifications, hard-now or seasons) when its sensitivity is
# one of these or it carries safety_flag. Only the boolean is public, never the category.
SENSITIVE_KINDS = {"medical", "mental_health", "abuse_risk", "legal"}
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def is_sensitive(rec):
    return rec.get("sensitivity") in SENSITIVE_KINDS or bool(rec.get("safety_flag"))


def clean(rec, also_sensitive=False):
    out = {k: rec.get(k) for k in PUBLIC_FIELDS}
    out["question"] = (out["question"] or "").strip()
    out["answer"] = (out["answer"] or "").strip()
    out["topics"] = [t for t in (out["topics"] or []) if isinstance(t, str) and t.strip()]
    out["applies_when"] = (out["applies_when"] or "").strip() or None
    out["not_when"] = (out["not_when"] or "").strip() or None
    out["faith"] = bool(out["faith"])
    out["source_kind"] = out["source_kind"] or None
    out["sensitive"] = is_sensitive(rec) or also_sensitive
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

# Calibrated on samples of 30 pairs per threshold (review/not-alone-calibration.md): at 0.40 about
# 3 in 4 pairs were the same question, at 0.45 about 5 in 6; below that most were neighbouring
# questions on the same subject.
SIM_COSINE = 0.45
SIM_MIN_SHARED = 2  # and at least two shared content words (short questions otherwise match on one word)
SIM_MIN = 3  # never show a bucket for fewer than 3 askers (small clusters could identify someone)
STOP_SIM = STOP | set(
    (
        "באמת משהו דבר דברים הרבה פעם פעמים תמיד הזמן זמן כלל אחד אחת שום ממש בכלל איתו איתה איתי אליו אליה "
        "אליי עליו עליה עלינו אצלי אצלו לנו אותנו שלכם יכול יכולה יכולים רוצה רוצים מישהו מישהי עדיף נראה "
        "עכשיו שוב לעצמי עצמו עצמה שזה שהוא שהיא שאני ואני כאן שם פה בו בה בהם"
    ).translate(FINALS).split()
)


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


def sim_tokens(text):
    """Normalized Hebrew tokens in order: no niqqud, no final letters, up to two prefix letters
    (ו ה ב ל מ ש כ) and one plural / feminine / 1st-person ending folded, stopwords removed."""
    t = NIQQUD.sub("", text).translate(FINALS)
    t = re.sub("[\"'׳״]", "", t)
    out = []
    for w in re.split(r"[^א-ת0-9]+", t):
        if len(w) < 2 or w in STOP_SIM:
            continue
        for _ in range(2):
            if len(w) >= 4 and w[0] in "והבלמשכ":
                w = w[1:]
            else:
                break
        for suf in ("ים", "ות", "תי", "ה", "ת", "י"):
            if len(w) - len(suf) >= 3 and w.endswith(suf):
                w = w[: -len(suf)]
                break
        if len(w) >= 2 and w not in STOP_SIM:
            out.append(w)
    return out


def sim_features(text):
    """Token unigrams plus adjacent-token bigrams (bigrams reward the same phrasing, not just the same subject)."""
    t = sim_tokens(text)
    c = Counter(t)
    c.update(a + "_" + b for a, b in zip(t, t[1:]))
    return c


def bucket(n):
    if n < SIM_MIN:
        return None
    if n < 10:
        return "few"
    if n < 100:
        return "tens"
    return "hundreds"


def similar_buckets(shipped, raw):
    """shipped: (public id, question, recording_id) of each public answer.
    raw: (question, recording_id) of EVERY extracted question in the corpus (any status).

    TF-IDF (sublinear tf, smoothed idf over the raw corpus) cosine of unigram + bigram features.
    An answer's count is the number of DISTINCT recordings among its own and those of the raw questions
    with cosine >= SIM_COSINE and >= SIM_MIN_SHARED shared words (one person asking twice counts once).
    Only coarse buckets leave this function; never counts or recording ids.
    """
    docs = [sim_features(q) for q, _ in raw]
    n = len(docs)
    df = Counter(w for d in docs for w in d)
    unseen = math.log(1 + n) + 1

    def vec(c):
        v = {w: (1 + math.log(k)) * (math.log((1 + n) / (1 + df[w])) + 1 if w in df else unseen) for w, k in c.items()}
        norm = math.sqrt(sum(x * x for x in v.values())) or 1.0
        return {w: x / norm for w, x in v.items()}

    inv = defaultdict(list)
    for j, d in enumerate(docs):
        for w, x in vec(d).items():
            inv[w].append((j, x))
    out, sizes, pairs = {}, Counter(), 0
    for pid, q, rec in shipped:
        f = sim_features(q)
        words = {w for w in f if "_" not in w}
        dot = Counter()
        for w, x in vec(f).items():
            for j, y in inv.get(w, ()):
                dot[j] += x * y
        askers = {rec}
        for j, cos in dot.items():
            if cos >= SIM_COSINE and raw[j][1] != rec and len(words & docs[j].keys()) >= SIM_MIN_SHARED:
                pairs += 1
                askers.add(raw[j][1])
        b = bucket(len(askers))
        sizes[b or "none"] += 1
        if b:
            out[pid] = b
    return out, sizes, pairs


def related_ids(recs, n=4, topic_bonus=0.05):
    """recs: (public id, question, answer, topics, recording_id). For each answer, the n closest others by
    TF-IDF cosine over question (counted twice) + answer words, small bonus for a shared first topic.
    Never pairs two answers from the same recording (that could tie two parts of one consultation)."""
    docs = []
    for _, q, a, _, _ in recs:
        c = Counter(sim_tokens(q))
        c.update(c)  # question words count double
        c.update(sim_tokens(a))
        docs.append(c)
    N = len(docs)
    df = Counter(w for d in docs for w in d)
    vecs = []
    for d in docs:
        v = {w: (1 + math.log(k)) * (math.log((1 + N) / (1 + df[w])) + 1) for w, k in d.items() if df[w] < N * 0.2}
        norm = math.sqrt(sum(x * x for x in v.values())) or 1.0
        vecs.append({w: x / norm for w, x in v.items()})
    inv = defaultdict(list)
    for j, v in enumerate(vecs):
        for w, x in v.items():
            inv[w].append((j, x))
    out = {}
    for i, v in enumerate(vecs):
        dot = Counter()
        for w, x in v.items():
            for j, y in inv[w]:
                dot[j] += x * y
        t0 = recs[i][3][0] if recs[i][3] else None
        scored = []
        for j, cos in dot.items():
            if j == i or recs[j][4] == recs[i][4]:
                continue
            bonus = topic_bonus if t0 and recs[j][3] and recs[j][3][0] == t0 else 0
            scored.append((cos + bonus, j))
        scored.sort(reverse=True)
        out[recs[i][0]] = [recs[j][0] for _, j in scored[:n]]
    return out


# ---------- glossary: frequent Hebrew / Aramaic / professional terms in the answers ----------

# Seed lexicon of terms a general reader may not know. Counts decide which get a draft definition in
# assets/data/curated/glossary.json (editors approve each one).
GLOSSARY_SEED = (
    "השתדלות|ביטחון|שלום בית|טראומה|פוסט טראומה|יצר הרע|עין הרע|זיווג|שידוך|כיבוד הורים|מניפולציה|אגו|"
    "אינטואיציה|מחשבות טורדניות|הפרעה טורדנית|ריצוי|מנגנוני הגנה|מנגנון הגנה|דחיית סיפוקים|כתובה|"
    "טהרת המשפחה|מקווה|מעשר|כרת|עולם הבא|פסיכוסומטיקה|צניעות|התקף חרדה|פרדיגמה|יראת שמיים|לשון הרע|"
    "פוסק|גט|סגולה|חרם|השגחה|ייסורים|גזירה|תיקון|קדושה|מידות|עבודת המידות|תסביך|דינמיקה|אסרטיביות|"
    "תלותיות|נרקיסיזם|ויסות רגשי|הסתר פנים|בעל תשובה|חזר בתשובה|מסירות נפש|שמירת נגיעה|גיור|חומרה|קולא"
).split("|")
PREFIXES = ("", "ה", "ו", "ב", "ל", "מ", "ש", "כ", "וה", "שה", "מה", "בה", "לה", "וב", "ול", "ומ", "וש")


def glossary_counts(answers):
    out = {}
    for term in GLOSSARY_SEED:
        alts = "|".join(re.escape(p + term) for p in PREFIXES)
        rx = re.compile(r"(?<![א-ת])(?:" + alts + r")(?![א-ת])")
        out[term] = sum(1 for a in answers if rx.search(a))
    return dict(sorted(out.items(), key=lambda kv: -kv[1]))


# ---------- "הצד השני של השאלה": the same situation asked from the other side ----------

ROLES = {
    "wife": r"(?<![א-ת])(?:ו|ש|ל|מ|עם )?(?:בעלי|בן זוגי|בן הזוג שלי)(?![א-ת])",
    "husband": r"(?<![א-ת])(?:ו|ש|ל|מ|עם )?(?:אשתי|בת זוגי|בת הזוג שלי)(?![א-ת])",
    "parent": r"(?:הבן שלי|הבת שלי|בני המתבגר|בתי המתבגרת|הבן המתבגר|הבת המתבגרת|ילדיי המתבגרים|הילד שלי|בני הבוגר|בתי הבוגרת)",
    "child": r"(?<![א-ת])(?:ה?הורים שלי|הוריי|אמא שלי|אבא שלי|אמי|אבי)(?![א-ת])",
    "partner": r"(?:השותף שלי|השותפה שלי|שותף לעסק|השותף|שותפות)",
}
OTHER_SIDE = [("wife", "husband"), ("parent", "child"), ("partner", "partner")]
ROLE_WORDS = None


def other_side_candidates(recs, per_record=3, min_score=0.07):
    """recs: (public id, question, answer, topics, recording_id) of ready records.

    A record gets a role when its question names exactly one side (wife / husband, parent / child,
    business partner). Candidates pair opposite roles that share a topic and come from DIFFERENT
    recordings, ranked by TF-IDF cosine of question (weighted x2) + answer opening, role words removed.
    Only public ids and a score leave this function; editors pick pairs into other-side.json.
    """
    global ROLE_WORDS
    ROLE_WORDS = stems("בעלי אשתי בן זוגי בת זוגי הזוג שלי הבן הבת שלי מתבגר מתבגרת הורים הוריי אמא אבא אמי אבי שותף שותפה שותפות")
    by_role = defaultdict(list)
    for r in recs:
        roles = [k for k, rx in ROLES.items() if re.search(rx, r[1])]
        if len(roles) == 1:
            by_role[roles[0]].append(r)
    docs = {r[0]: (stems(r[1]) | stems(r[2][:300])) - ROLE_WORDS for rs in by_role.values() for r in rs}
    n = len(docs) or 1
    df = Counter(w for t in docs.values() for w in t)
    vec = {}
    for pid, t in docs.items():
        q = stems(next(r[1] for rs in by_role.values() for r in rs if r[0] == pid)) - ROLE_WORDS
        v = {w: math.log(n / df[w]) * (2 if w in q else 1) for w in t}
        norm = math.sqrt(sum(x * x for x in v.values())) or 1.0
        vec[pid] = {w: x / norm for w, x in v.items()}
    out = []
    for a, b in OTHER_SIDE:
        for ra in by_role[a]:
            scored = []
            for rb in by_role[b]:
                if rb[0] == ra[0] or rb[4] == ra[4] or not set(ra[3]) & set(rb[3]):
                    continue
                va, vb = vec[ra[0]], vec[rb[0]]
                sc = sum(x * vb.get(w, 0.0) for w, x in va.items())
                if sc >= min_score:
                    scored.append((sc, rb[0]))
            scored.sort(reverse=True)
            for sc, bid in scored[:per_record]:
                out.append({"a": ra[0], "b": bid, "kind": f"{a}/{b}", "score": round(sc, 3)})
    out.sort(key=lambda x: -x["score"])
    return out


def check_other_side(path, recording_of):
    """Drops curated pairs whose answers share a recording. Returns how many were dropped."""
    if not os.path.exists(path):
        return 0
    with open(path, encoding="utf-8") as fh:
        d = json.load(fh)
    keep = [p for p in d["items"] if recording_of.get(p["a"]) and recording_of.get(p["a"]) != recording_of.get(p["b"])]
    dropped = len(d["items"]) - len(keep)
    if dropped:
        d["items"] = keep
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(d, fh, ensure_ascii=False, indent=1)
    return dropped


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default="/mnt/project-files/qa-app/prod/edited")
    ap.add_argument("--raw", default="/mnt/project-files/qa-app/prod/raw")
    ap.add_argument("--sample", type=int, default=300)
    args = ap.parse_args()

    files = sorted(glob.glob(os.path.join(args.src, "*.jsonl")))
    if not files:
        sys.exit(f"no .jsonl files in {args.src}")

    # Every extracted question (any status) for "לא רק אתם", plus the raw record's own sensitivity /
    # safety_flag (OR-ed with the edited record's, to be safe). Recording ids never leave this script.
    raw_asked = []
    raw_sensitive = set()
    raw_files = sorted(glob.glob(os.path.join(args.raw, "*.jsonl")))
    for fn in raw_files:
        with open(fn, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    rec = json.loads(line)
                except json.JSONDecodeError:
                    continue
                q = (rec.get("question") or "").strip()
                if not q:
                    continue
                raw_asked.append((q, (rec.get("source") or {}).get("recording_id") or f"?{rec.get('id')}"))
                if is_sensitive(rec):
                    raw_sensitive.add(rec.get("id"))

    status = Counter()
    seen_q, seen_id = set(), set()
    dupes = bad = 0
    ready = []
    shipped = []  # (public id, question, recording_id) for the similarity counts; never written out
    recording_of = {}  # public id -> recording_id; used only for checks, never written out
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
                rid = (rec.get("source") or {}).get("recording_id") or f"?{rec.get('id')}"
                r = clean(rec, rec.get("id") in raw_sensitive)
                if not r["id"] or not r["question"] or not r["answer"]:
                    bad += 1
                    continue
                if r["question"] in seen_q or r["id"] in seen_id:
                    dupes += 1
                    continue
                seen_q.add(r["question"])
                seen_id.add(r["id"])
                ready.append(r)
                shipped.append((r["id"], r["question"], rid))
                recording_of[r["id"]] = rid

    out_dir = os.path.join(ROOT, "assets", "data")
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, "qa.json"), "w", encoding="utf-8") as fh:
        json.dump(ready, fh, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(out_dir, "qa.sample.json"), "w", encoding="utf-8") as fh:
        json.dump(ready[: args.sample], fh, ensure_ascii=False, indent=1)

    similar, sizes, pairs = similar_buckets(shipped, raw_asked)
    with open(os.path.join(out_dir, "similar.json"), "w", encoding="utf-8") as fh:
        json.dump(dict(sorted(similar.items())), fh, ensure_ascii=False, indent=0)

    gloss = glossary_counts([r["answer"] for r in ready])
    os.makedirs(os.path.join(out_dir, "curated"), exist_ok=True)
    with open(os.path.join(out_dir, "curated", "glossary.candidates.json"), "w", encoding="utf-8") as fh:
        json.dump({"_about": "answers (of the public set) that use each candidate term; see GLOSSARY_SEED", "counts": gloss},
                  fh, ensure_ascii=False, indent=1)

    pairs_in = [(r["id"], r["question"], r["answer"], r["topics"], recording_of[r["id"]]) for r in ready]
    related = related_ids(pairs_in)
    with open(os.path.join(out_dir, "related.json"), "w", encoding="utf-8") as fh:
        json.dump(related, fh, ensure_ascii=False, separators=(",", ":"))
    cands = other_side_candidates(pairs_in)
    with open(os.path.join(out_dir, "curated", "other-side.candidates.json"), "w", encoding="utf-8") as fh:
        json.dump({"_about": "candidate pairs (public ids only, always from different recordings); editors pick into other-side.json",
                   "items": cands[:400]}, fh, ensure_ascii=False, indent=1)
    dropped = check_other_side(os.path.join(out_dir, "curated", "other-side.json"), recording_of)

    topics = Counter(t for r in ready for t in r["topics"])
    print(f"files: {len(files)}")
    print("status: " + ", ".join(f"{k}={v}" for k, v in status.most_common()))
    print(f"ready kept: {len(ready)}  duplicate questions dropped: {dupes}  malformed: {bad}")
    print(f"sample: {min(args.sample, len(ready))}")
    print(f"sensitive: {sum(r['sensitive'] for r in ready)} of {len(ready)} public records")
    print(f"similar: {len(raw_asked)} raw questions ({len(raw_files)} files), {pairs} near-duplicate pairs; buckets: "
          + ", ".join(f"{k}={sizes[k]}" for k in ("none", "few", "tens", "hundreds")))
    print("glossary: " + ", ".join(f"{k} {v}" for k, v in list(gloss.items())[:15]))
    print(f"other side: {len(cands)} candidate pairs; curated pairs dropped (same recording): {dropped}")
    print("topics: " + ", ".join(f"{k} {v}" for k, v in topics.most_common()))


if __name__ == "__main__":
    main()
