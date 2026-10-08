/** Hebrew text normalization for local search. */

const NIQQUD = /[֑-ֽֿ-ׇ]/g; // cantillation + vowel points (keeps maqaf U+05BE, handled below)
const FINALS: Record<string, string> = { ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' };
const PREFIX_LETTERS = 'והבלמשכ';

/** Strips niqqud, folds final letters, lowercases latin, drops quote marks (״ ׳ " '). */
export function normalize(text: string): string {
  return text
    .normalize('NFC')
    .replace(NIQQUD, '')
    .replace(/[־\-–—]/g, ' ')
    .replace(/[׳״"'`]/g, '')
    .replace(/[ךםןףץ]/g, (c) => FINALS[c])
    .toLowerCase();
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^א-תa-z0-9]+/)
    .filter(Boolean);
}

/** The token plus forms with up to 3 leading prefix letters (ו ה ב ל מ ש כ) removed; stems keep ≥3 letters. */
export function prefixVariants(token: string): string[] {
  const out = [token];
  let s = token;
  for (let i = 0; i < 3; i++) {
    if (s.length >= 4 && PREFIX_LETTERS.includes(s[0])) {
      s = s.slice(1);
      out.push(s);
    } else break;
  }
  return out;
}

const STOP_RAW =
  'של את על עם זה זו זאת הוא היא הם הן אני אנחנו אתה אתם אתן לא כן יש אין מה מי איך למה האם כי אם או גם רק כל עוד אבל אז כמו יותר מאוד היה הייתה היתה להיות לי לו לה לך לכם להם שלי שלו שלה שלך שלנו שלהם אל מן בין כדי אחרי לפני כאשר כך כבר ואם וגם ולא שלא זהו הזה הזאת אותו אותה אותי אותך אותם עצמי איזה איזו כמה מתי';
export const STOPWORDS = new Set(STOP_RAW.split(' ').map(normalize));
