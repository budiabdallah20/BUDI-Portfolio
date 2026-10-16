export interface VaultPhoto {
  src: string;
  caption: string;
  story: string;
  tag: string;
}

export const VAULT_PHOTOS: VaultPhoto[] = [
  {
    src: "/images/birthday/1.jpg",
    caption: "البداية — نظرة اللي عارف هو رايح فين",
    story: "أول صورة في الخزنة. الهدوء اللي قبل العاصفة الحلوة — شاب من السويس قرر إن حلمه أكبر من خريطة مدينته.",
    tag: "الثقة",
  },
  {
    src: "/images/birthday/2.jpg",
    caption: "المقاتل — اللي مبيقفش",
    story: "كل مرة وقع فيها قام أقوى. الصورة دي بتفكرك إنك عديت أصعب من كده بكتير ولسه واقف على رجلك.",
    tag: "الصمود",
  },
  {
    src: "/images/birthday/3.jpg",
    caption: "الحالم — عينه على العالم",
    story: "من السويس للعالم. الحلم اللي بدأ على لابتوب صغير بقى مشاريع حقيقية وناس بتدفع عشان شغلك.",
    tag: "الحلم",
  },
  {
    src: "/images/birthday/4.jpg",
    caption: "الذهبية — لحظة الفخر",
    story: "الصورة الأفخم في المجموعة. احتفظ بيها لليوم اللي تحس فيه إنك تعبت — بص عليها وافتكر انت مين.",
    tag: "الفخر",
  },
  {
    src: "/images/birthday/5.jpg",
    caption: "الهادي — القوة في الهدوء",
    story: "مش لازم تزعق عشان تبان قوي. الهدوء بتاعك هو اللي بيخلي شغلك يتكلم عنك.",
    tag: "الهدوء",
  },
  {
    src: "/images/birthday/6.jpg",
    caption: "المركّز — عقل المهندس",
    story: "عقلية الـ Full-Stack: تفكك أي مشكلة كبيرة لحتت صغيرة وتحلها واحدة واحدة. دي سوبر باور مش عند ناس كتير.",
    tag: "التركيز",
  },
  {
    src: "/images/birthday/7.jpg",
    caption: "الواثق — جاهز للعشرينات",
    story: "20 سنة. داخل العقد الذهبي بتاعك. اللي فات كان تسخين — اللي جاي هو البطولة الحقيقية.",
    tag: "الانطلاق",
  },
  {
    src: "/images/general/hero.jpg",
    caption: "The Builder — صانع الأنظمة",
    story: "الصورة اللي الناس شافتك بيها أول مرة. الهوية اللي بنيتها سطر كود ورا سطر كود.",
    tag: "الهوية",
  },
  {
    src: "/images/general/about2.jpg",
    caption: "The Dreamer — الحالم المنظم",
    story: "ورا كل سيستم نضيف فيه واحد سهر عشان يطلع كده. الصورة دي شهادة سهرك.",
    tag: "السهر",
  },
  {
    src: "/images/profile/contact.jpg",
    caption: "The Fighter — المقاتل الأخير",
    story: "اللي بيرد على العميل الساعة 3 الفجر ويصحى يكمل. الالتزام ده هو اللي هيفرقك عن أي حد.",
    tag: "الالتزام",
  },
];

export interface TimelineStop {
  year: string;
  title: string;
  titleAr: string;
  text: string;
}

export const TIMELINE: TimelineStop[] = [
  {
    year: "2006",
    title: "Once upon a time in Suez",
    titleAr: "الحكاية بدأت",
    text: "24 أكتوبر 2006 — طفل اتولد في السويس، محدش كان يعرف إنه هيبقى مهندس أنظمة ويبني عوالم كاملة من الكود.",
  },
  {
    year: "2016",
    title: "The curious kid",
    titleAr: "الفضول",
    text: "10 سنين. بيفك كل حاجة عشان يفهم شغالة إزاي. الموبايل، الكمبيوتر، أي جهاز — الفضول ده هو نفس الوقود بتاع النهاردة.",
  },
  {
    year: "2020",
    title: "First line of code",
    titleAr: "أول سطر كود",
    text: "أول مرة كتبت كود وحسيت بسحر اللحظة: بتكتب حروف، فجأة بتتحول لحاجة شغالة. من هنا الإدمان الحلو بدأ.",
  },
  {
    year: "2023",
    title: "Shipping for real people",
    titleAr: "شغل حقيقي",
    text: "بطلت تتعلم بس — بدأت تسلّم. مشاريع حقيقية، عملاء حقيقيين، فلوس حقيقية. الثقة اتبنت هنا.",
  },
  {
    year: "2024",
    title: "BUDI is born",
    titleAr: "ميلاد بودي",
    text: "البراند اتولد. البورتفوليو الأول، الهوية الذهبية، واسم BUDI بقى عنوان للشغل النضيف.",
  },
  {
    year: "2025",
    title: "Computer Science, Suez Uni",
    titleAr: "علوم حاسب",
    text: "دخلت كلية العلوم — قسم رياضة وحاسب. النظرية بتقابل التطبيق، والمعادلات بتخدم الكود.",
  },
  {
    year: "2026",
    title: "BUDI OS + Massar + Kayan",
    titleAr: "الأنظمة الكبيرة",
    text: "20 سنة وبتدير منظومة: BUDI OS مع 100 حساب، Massar، Kayan. من بورتفوليو لشخص لشركة أنظمة كاملة.",
  },
  {
    year: "2030",
    title: "The vision",
    titleAr: "الرؤية",
    text: "الرسالة اللي كتبتها لنفسك: شركة سوفتوير مصرية بتنافس عالميًا، وفريق كامل اتعلم على إيدك. لسه الطريق مفتوح.",
  },
];

export interface FuelQuote {
  text: string;
  dir: "ltr" | "rtl";
  lang: string;
  by: string;
}

export const FUEL_QUOTES: FuelQuote[] = [
  { text: "استمر… القادم أعظم بإذن الله.", dir: "rtl", lang: "ar", by: "قاعدة بودي #1" },
  { text: "Ship work you're proud to sign.", dir: "ltr", lang: "en", by: "BUDI creed" },
  { text: "متقارنش بدايتك بذروة حد تاني.", dir: "rtl", lang: "ar", by: "تذكير يومي" },
  { text: "From Suez to the world — keep shipping.", dir: "ltr", lang: "en", by: "The mission" },
  { text: "العشرينات للبناء، مش للقلق.", dir: "rtl", lang: "ar", by: "خطة العقد" },
  { text: "Les grands systèmes naissent des petits commits.", dir: "ltr", lang: "fr", by: "Le dicton" },
  { text: "صحتك وأهلك قبل أي ديدلاين.", dir: "rtl", lang: "ar", by: "الأولويات" },
  { text: "Done is better than perfect — then polish.", dir: "ltr", lang: "en", by: "Shipping rule" },
  { text: "ربنا شايف سعيك… كمّل.", dir: "rtl", lang: "ar", by: "وَقُلِ اعْمَلُوا" },
];

export const ANTHEM_VERSES: { ar: string; en: string }[] = [
  {
    ar: "بودي يا بودي… سنة ورا سنة بتكبر، والحلم بيكبر معاك",
    en: "BUDI, oh BUDI… year by year you rise, the dream grows with you",
  },
  {
    ar: "من السويس طالع نور… كود وسهر وضمير",
    en: "From Suez comes the light… code, late nights, and a clean heart",
  },
  {
    ar: "عشرين سنة عدّوا… واللي جاي أحلى بكتير",
    en: "Twenty years gone by… and what's next is so much sweeter",
  },
  {
    ar: "كل سنة وانت طيب يا بطل… العالم كله مستنيك",
    en: "Happy birthday champ… the whole world is waiting for you",
  },
];

export const ANTHEM_CHORUS_AR = "عيد ميلاد سعيد يا بودي — عقبال مليون سنة نجاح";
export const ANTHEM_CHORUS_EN = "Happy birthday BUDI — to a million years of shipping";

export const DEFAULT_WISHES: string[] = [
  "A year of clean deploys and zero 3AM incidents.",
  "Clients who pay on time and dream big.",
  "عام مليء بالصحة والرزق والتوفيق.",
  "From Suez to the world — keep shipping.",
  "Une année de succès, santé et code élégant.",
];

export const BIRTH_YEAR = 2006;
export const BIRTH_MONTH = 10;
export const BIRTH_DAY = 24;
