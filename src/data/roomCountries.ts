// ISO codes for countries selectable in the existing account country picker.
const countries = [
  ['IQ', 'العراق'], ['SA', 'السعودية'], ['JO', 'الأردن'], ['KW', 'الكويت'],
  ['AE', 'الإمارات'], ['QA', 'قطر'], ['BH', 'البحرين'], ['OM', 'عُمان'],
  ['SY', 'سوريا'], ['LB', 'لبنان'], ['PS', 'فلسطين'], ['EG', 'مصر'],
  ['YE', 'اليمن'], ['MA', 'المغرب'], ['DZ', 'الجزائر'], ['TN', 'تونس'],
  ['LY', 'ليبيا'], ['SD', 'السودان'], ['TR', 'تركيا'], ['DE', 'ألمانيا'],
  ['US', 'الولايات المتحدة'],
] as const;
const english = new Intl.DisplayNames(['en'], { type: 'region' });
const flagFor = (code: string) => String.fromCodePoint(...[...code].map(letter => letter.charCodeAt(0) + 127397));

export const roomCountries = countries.map(([code, name]) => ({
  code, name, english: english.of(code) ?? code, flag: flagFor(code),
}));

const normalize = (value: string) => value.normalize('NFKC').replace(/[\u0640\u064b-\u065f\u0670]/g, '')
  .replace(/[أإآ]/g, 'ا').toLowerCase().trim().replace(/\s+/g, ' ');
const aliases = new Map<string, string>([
  [normalize('المملكة العربية السعودية'), 'SA'], [normalize('المملكة السعودية'), 'SA'],
  [normalize('الإمارات العربية المتحدة'), 'AE'], [normalize('الولايات المتحدة الأمريكية'), 'US'],
  ['turkey', 'TR'],
]);
for (const { code, name, english: translated } of roomCountries) {
  for (const value of [code, name, translated]) aliases.set(normalize(value), code);
}
export const roomCountryCode = (value: string | null | undefined) => aliases.get(normalize(value ?? '')) ?? '';

export function filterRoomsByCountry<T extends { country: string }>(rooms: T[], selectedCode: string): T[] {
  return selectedCode === 'all' ? rooms : rooms.filter(room => roomCountryCode(room.country) === selectedCode);
}
