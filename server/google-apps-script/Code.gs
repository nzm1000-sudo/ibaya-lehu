/**
 * אִיבַּעְיָא לְהוּ: receives "לא מצאתם תשובה?" questions from the app and appends them to a sheet.
 *
 * Deploy as a Web App (Execute as: Me, Who has access: Anyone). See SETUP.he.md.
 * The app sends text/plain with a JSON body: {question, created_at, app_version, hp}.
 * Only the time of arrival and the question text are stored. Nothing identifies the sender.
 */

var SHEET_NAME = 'שאלות ללא תשובה';
var MIN_LEN = 3;
var MAX_LEN = 500;
var PER_MINUTE = 30; // all senders together; protects the sheet from floods

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var q = body.question;
    if (typeof q !== 'string') return reply_(false, 'invalid');
    q = q.replace(/\s+/g, ' ').trim();
    if (q.length < MIN_LEN || q.length > MAX_LEN) return reply_(false, 'invalid');
    if (body.hp) return reply_(true); // honeypot filled: a bot. Answer ok, store nothing.

    var cache = CacheService.getScriptCache();
    var key = 'rate:' + Math.floor(Date.now() / 60000);
    var count = Number(cache.get(key) || 0);
    if (count >= PER_MINUTE) return reply_(false, 'rate_limited');
    cache.put(key, String(count + 1), 120);

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      sheet_().appendRow([new Date(), safe_(q)]);
    } finally {
      lock.releaseLock();
    }
    return reply_(true);
  } catch (err) {
    return reply_(false, 'error');
  }
}

/** A quick check that the deployment works: open the Web App URL in a browser. */
function doGet() {
  return reply_(true);
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['זמן קבלה', 'שאלה']);
    sh.setRightToLeft(true);
    sh.setFrozenRows(1);
  }
  return sh;
}

/** Keeps a question that starts with = + - or @ from being read as a spreadsheet formula. */
function safe_(s) {
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

/**
 * Apps Script web apps always answer HTTP 200, so the result is in the JSON: the app keeps a question
 * queued and retries it when ok is false (rate_limited, error), except for "invalid".
 */
function reply_(ok, error) {
  var out = { ok: ok };
  if (error) out.error = error;
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
