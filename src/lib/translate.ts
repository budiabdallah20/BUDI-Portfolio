/**
 * EN → FR auto-translation for the dashboard editors.
 *
 * Chain: MyMemory (free, no key) → Google GTX (free, CORS-open fallback).
 * It is a drafting aid, never a gate: every failure throws a readable Error
 * and the caller keeps whatever succeeded — French fields stay hand-editable.
 */

const MYMEMORY = "https://api.mymemory.translated.net/get";
const GTX = "https://translate.googleapis.com/translate_a/single";
const TIMEOUT_MS = 12000;
/** MyMemory anonymous quota (~500 chars) — longer text goes in chunks. */
const CHUNK_LEN = 450;

function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function splitChunks(text: string, max: number): string[] {
  if (text.length <= max) return [text];
  const parts: string[] = [];
  const sentences = text.split(/(?<=[.!?…])\s+/);
  let cur = "";
  for (const s of sentences) {
    if ((cur + " " + s).trim().length > max && cur !== "") {
      parts.push(cur.trim());
      cur = s;
    } else {
      cur = `${cur} ${s}`.trim();
    }
  }
  if (cur.trim() !== "") parts.push(cur.trim());
  // A single monster sentence with no breaks — hard cut it.
  const out: string[] = [];
  for (const p of parts) {
    if (p.length <= max) out.push(p);
    else for (let i = 0; i < p.length; i += max) out.push(p.slice(i, i + max));
  }
  return out;
}

async function fetchJSON(url: string, init?: RequestInit): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    if (!res.ok) throw new Error(`busy (${res.status})`);
    return (await res.json()) as unknown;
  } finally {
    window.clearTimeout(timer);
  }
}

async function viaMyMemory(chunk: string): Promise<string> {
  const json = (await fetchJSON(
    `${MYMEMORY}?q=${encodeURIComponent(chunk)}&langpair=${encodeURIComponent("en|fr")}`,
  )) as {
    responseData?: { translatedText?: unknown };
    responseStatus?: unknown;
    responseDetails?: unknown;
  };
  const text =
    typeof json.responseData?.translatedText === "string" ? json.responseData.translatedText : "";
  if (json.responseStatus !== 200 || text.trim() === "") {
    const detail = typeof json.responseDetails === "string" ? json.responseDetails : "";
    throw new Error(detail || "empty response");
  }
  if (/MYMEMORY WARNING|INVALID EMAIL|QUERY LENGTH LIMIT/i.test(text)) {
    throw new Error("quota hit");
  }
  return decodeEntities(text);
}

async function viaGoogle(chunk: string): Promise<string> {
  const json = (await fetchJSON(
    `${GTX}?client=gtx&sl=en&tl=fr&dt=t&q=${encodeURIComponent(chunk)}`,
  )) as unknown;
  // Shape: [[["Bonjour","Hello",null,null,1]],null,"en"]
  if (!Array.isArray(json) || !Array.isArray(json[0])) throw new Error("empty response");
  const out = (json[0] as unknown[])
    .map((seg) => (Array.isArray(seg) && typeof seg[0] === "string" ? seg[0] : ""))
    .join("");
  if (out.trim() === "") throw new Error("empty response");
  return decodeEntities(out);
}

async function oneChunk(chunk: string): Promise<string> {
  try {
    return await viaMyMemory(chunk);
  } catch (e1) {
    try {
      return await viaGoogle(chunk);
    } catch {
      if (e1 instanceof DOMException && e1.name === "AbortError") {
        throw new Error("Translation timed out — check connection.");
      }
      if (e1 instanceof Error && /quota|429/i.test(e1.message)) {
        // Quota on primary — GTX already tried; report clearly.
        throw new Error("Free translation quota hit — try shorter text later.");
      }
      if (e1 instanceof Error) throw new Error(`${e1.message} — try again.`);
      throw new Error("Translation failed — try again.");
    }
  }
}

/** Translate one English string to French (chunked for long text). */
export async function translateEnToFr(text: string): Promise<string> {
  const clean = text.trim();
  if (clean === "") return "";
  const chunks = splitChunks(clean, CHUNK_LEN);
  const out: string[] = [];
  for (const c of chunks) out.push(await oneChunk(c));
  return out.join(" ");
}

/** Translate a list of strings, preserving order. */
export async function translateList(texts: string[]): Promise<string[]> {
  const out: string[] = [];
  for (const t of texts) out.push(await translateEnToFr(t));
  return out;
}
