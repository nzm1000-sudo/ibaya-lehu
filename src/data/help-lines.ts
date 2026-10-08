import { S } from '@/constants/strings';

export type HelpLine = {
  key: keyof typeof S.hardNow.lines;
  /** What a tap opens: a phone call or a web page. */
  url: string;
  /** Shown big on the row: the number, or empty for a web chat. */
  number: string;
};

/**
 * Help lines, verified 2026-10-08 against the organisations' own sites. Re-check before every release.
 */
export const HELP_LINES: HelpLine[] = [
  // ער"ן, עזרה ראשונה נפשית: 1201, 24/7 ("התקשרו 1201", "מצילה חיים 24/7 בטלפון וברשת").
  // Source: https://www.eran.org.il/  (also https://www.kolzchut.org.il/he/ער"ן_-_עזרה_ראשונה_נפשית_בטלפון_ובאינטרנט:
  // "קו טלפון חירום ארצי בכל שעות היממה – 1201"). Israel has no separate national suicide line: 1201 is ער"ן's number.
  { key: 'eran', url: 'tel:1201', number: '1201' },
  // סה"ר, סיוע והקשבה ברשת: anonymous chat on the site. Hours on the Hebrew site: א׳-ה׳ 16:00-03:00,
  // שישי, שבת וערבי חג 18:00-00:00. Source: https://sahar.org.il/  (English page: https://sahar.org.il/about-us)
  { key: 'sahar', url: 'https://sahar.org.il/', number: '' },
  // מגן דוד אדום: "מספר חרום 101". Source: https://www.mdais.org/101
  { key: 'mda', url: 'tel:101', number: '101' },
  // משטרת ישראל, מוקד 100. Source: https://www.police.gov.il/join/100 (מוקד 100 on the police's own site)
  { key: 'police', url: 'tel:100', number: '100' },
];
