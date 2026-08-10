// Manuals now come straight from the Hygraph CMS (GraphQL) instead of the
// old dgc-backend REST API — that backend only ever had a handful of months
// populated with gaps; Hygraph has the full, continuously-updated curriculum.
const HYGRAPH_URL = "https://eu-west-2.cdn.hygraph.com/content/cmir5z9ga02wg06uv7654e2kq/master";
const REQUEST_TIMEOUT_MS = 15000;

export interface HygraphBook {
  title: string;
  author: string;
}

export interface HygraphManual {
  id: string;
  title: string;
  theme: string | null;
  studyDate: string; // "YYYY-MM-DD"
  memoryVerse: string;
  scriptureText: string;
  conclusion: string;
  content: { html: string } | null;
  classDiscussion: { html: string } | null;
  assignment: { html: string } | null;
  declarations: { html: string } | null;
  image: { url: string } | null;
  books: HygraphBook[];
}

async function hygraphRequest<T>(query: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(HYGRAPH_URL, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
  } catch {
    throw new Error("Could not reach the manuals server. Check your internet connection and try again.");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) throw new Error(`Manuals request failed (${response.status})`);

  const json = await response.json();
  if (json.errors?.length) throw new Error(json.errors[0]?.message || "Failed to load manuals.");
  return json.data as T;
}

const MANUAL_FIELDS = `
  id
  memoryVerse
  scriptureText
  studyDate
  theme
  title
  content { html }
  classDiscussion { html }
  assignment { html }
  conclusion
  image { url }
  books { title author }
  declarations { html }
`;

// Fetches every manual currently published — January through whatever's
// live, ordered oldest first so month-grouping and the global unlock
// ordering below both fall out naturally.
export async function fetchAllManualsFromHygraph(): Promise<HygraphManual[]> {
  const data = await hygraphRequest<{ manuals: HygraphManual[] }>(`
    query AllManuals {
      manuals(first: 200, orderBy: studyDate_ASC) {
        ${MANUAL_FIELDS}
      }
    }
  `);
  return Array.isArray(data?.manuals) ? data.manuals : [];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const ORDINAL_SUFFIX = (day: number) => {
  if (day % 10 === 1 && day !== 11) return "st";
  if (day % 10 === 2 && day !== 12) return "nd";
  if (day % 10 === 3 && day !== 13) return "rd";
  return "th";
};

// studyDate is a bare "YYYY-MM-DD" — parsed manually rather than
// `new Date(str)` so it never shifts a day under a negative UTC offset.
function parseISODate(iso: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  if (!match) return null;
  return { year: parseInt(match[1], 10), month: parseInt(match[2], 10), day: parseInt(match[3], 10) };
}

export function monthNameFromISO(iso: string): string {
  const parsed = parseISODate(iso);
  return parsed ? MONTH_NAMES[parsed.month - 1] : "";
}

// Reproduces the old REST API's "4th January, 2026" date string so it stays
// compatible with the existing card/detail rendering and the January-4th
// special-case dispatch in outline.tsx, without touching either.
export function formatOldStyleDate(iso: string): string {
  const parsed = parseISODate(iso);
  if (!parsed) return iso;
  return `${parsed.day}${ORDINAL_SUFFIX(parsed.day)} ${MONTH_NAMES[parsed.month - 1]}, ${parsed.year}`;
}

// Converts Hygraph's RichText HTML into readable plain text — the detail
// screens' text fields (introduction/classDiscussion/declaration) are plain
// <Text>, and their scripture-reference tap-to-view feature scans plain
// strings, so this keeps both working without a full HTML renderer.
export function stripHtml(html?: string | null): string {
  if (!html) return "";
  return html
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/(p|div|h[1-6]|ul|ol|li|br)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// The shape every existing screen (outline.tsx's list, ManualDetail.tsx,
// January4ManualDetail.tsx) already expects — mapping into it here means
// none of those screens need to change at all for the new data source.
export interface CompatManual {
  _id: string;
  id: string;
  title: string;
  theme: string;
  memoryVerse: string;
  text: string;
  introduction: string;
  classDiscussion: string;
  conclusion: string;
  declaration?: string;
  month: string;
  date: string;
  studyDate: string; // raw "YYYY-MM-DD", used for unlock math
  order: number;
  imageUrl?: string;
  recommendedBooks: string[];
}

export function toCompatManual(raw: HygraphManual, order: number): CompatManual {
  return {
    _id: raw.id,
    id: raw.id,
    title: raw.title,
    theme: raw.theme || "",
    memoryVerse: raw.memoryVerse,
    text: raw.scriptureText || "",
    introduction: stripHtml(raw.content?.html),
    classDiscussion: stripHtml(raw.classDiscussion?.html),
    conclusion: raw.conclusion || "",
    declaration: raw.declarations?.html ? stripHtml(raw.declarations.html) : undefined,
    month: monthNameFromISO(raw.studyDate),
    date: formatOldStyleDate(raw.studyDate),
    studyDate: raw.studyDate,
    order,
    imageUrl: raw.image?.url,
    recommendedBooks: (raw.books || []).map((b) => (b.author ? `${b.title} — ${b.author}` : b.title)),
  };
}

// Months whose curriculum isn't ready yet — locked outright regardless of
// the date-based cadence below.
const LOCKED_MONTHS = new Set(["September", "October", "November", "December"]);

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDaysISO(iso: string, days: number): string {
  const parsed = parseISODate(iso);
  if (!parsed) return iso;
  const date = new Date(parsed.year, parsed.month - 1, parsed.day);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// The soonest not-yet-unlocked Sunday across every (non-locked-month)
// manual — that one gets unlocked immediately regardless of the Saturday
// rule below, so there's always a "this week's manual" to read.
export function computeNextUpcomingISO(manuals: CompatManual[]): string | null {
  const today = todayISO();
  const future = manuals
    .filter((m) => !LOCKED_MONTHS.has(m.month) && m.studyDate > today)
    .map((m) => m.studyDate)
    .sort();
  return future.length ? future[0] : null;
}

// Unlock rule: September–December are locked outright. Otherwise, a manual
// unlocks the Saturday before its Sunday studyDate — except the single
// nearest upcoming Sunday, which unlocks right away (so members always have
// this week's manual even before that Saturday arrives). Anything on or
// before today stays unlocked permanently.
export function isManualUnlocked(manual: CompatManual, nextUpcomingISO: string | null): boolean {
  if (LOCKED_MONTHS.has(manual.month)) return false;

  const today = todayISO();
  if (manual.studyDate <= today) return true;
  if (nextUpcomingISO && manual.studyDate === nextUpcomingISO) return true;

  const saturdayBefore = addDaysISO(manual.studyDate, -1);
  return today >= saturdayBefore;
}
