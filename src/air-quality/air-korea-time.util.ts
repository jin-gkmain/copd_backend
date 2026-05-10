/** API dataTime 문자열(한국 현지) → timestamptz (+09:00 고정) */
export function parseAirKoreaDataTime(raw: string | undefined): Date | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hh = m[2].padStart(2, '0');
  return new Date(`${m[1]}T${hh}:${m[3]}:00+09:00`);
}
