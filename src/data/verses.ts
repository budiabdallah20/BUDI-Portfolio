/** Quranic verses shown across the portfolio + dashboard.
 *  The site footer rotates one per day (deterministic, SSR-safe);
 *  the dashboard cycles them live. Add a row here — both follow. */

export interface Verse {
  ar: string;
  en: string;
  fr: string;
  ref: string;
}

export const VERSES: Verse[] = [
  {
    ar: "وَقُلِ اعْمَلُوا فَسَيَرَى اللَّهُ عَمَلَكُمْ وَرَسُولُهُ وَالْمُؤْمِنُونَ",
    en: "And say: Work, and Allah will see your work.",
    fr: "Et dis : Agissez, et Allah verra vos actes.",
    ref: "Quran 9:105",
  },
  {
    ar: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
    en: "My Lord, increase me in knowledge.",
    fr: "Seigneur, accrois mes connaissances.",
    ref: "Quran 20:114",
  },
  {
    ar: "وَاتَّقُوا اللَّهَ ۖ وَيُعَلِّمُكُمُ اللَّهُ",
    en: "Be mindful of Allah, and Allah will teach you.",
    fr: "Craignez Allah, et Allah vous enseignera.",
    ref: "Quran 2:282",
  },
  {
    ar: "يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ",
    en: "Allah raises those who believe and those given knowledge in ranks.",
    fr: "Allah élève en rangs ceux qui croient et ceux qui ont reçu le savoir.",
    ref: "Quran 58:11",
  },
  {
    ar: "هَلْ يَسْتَوِي الَّذِينَ يَعْلَمُونَ وَالَّذِينَ لَا يَعْلَمُونَ",
    en: "Are those who know equal to those who do not know?",
    fr: "Ceux qui savent sont-ils égaux à ceux qui ne savent pas ?",
    ref: "Quran 39:9",
  },
  {
    ar: "وَأَنَّ سَعْيَهُ سَوْفَ يُرَىٰ",
    en: "And that his effort will be seen.",
    fr: "Et que son effort sera vu.",
    ref: "Quran 53:40",
  },
  {
    ar: "وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ ۚ عَلَيْهِ تَوَكَّلْتُ",
    en: "My success is only through Allah — in Him I trust.",
    fr: "Ma réussite ne vient que d'Allah — en Lui je place ma confiance.",
    ref: "Quran 11:88",
  },
  {
    ar: "وَكُلَّ شَيْءٍ أَحْصَيْنَاهُ فِي إِمَامٍ مُّبِينٍ",
    en: "And everything We have counted in a clear record.",
    fr: "Et toute chose, Nous l'avons comptée dans un registre clair.",
    ref: "Quran 36:12",
  },
];

/** Deterministic daily pick — same verse on server and client, all day. */
export function verseOfDay(date: Date): Verse {
  const start = new Date(date.getFullYear(), 0, 0).getTime();
  const day = Math.floor((date.getTime() - start) / 86400000);
  return VERSES[((day % VERSES.length) + VERSES.length) % VERSES.length] ?? VERSES[0]!;
}
