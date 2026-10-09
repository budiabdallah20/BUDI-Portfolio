export type Lang = "en" | "fr";

export type NavId =
  | "home"
  | "about"
  | "services"
  | "projects"
  | "skills"
  | "certificates"
  | "contact";

export type WeatherGroup =
  | "clear"
  | "partly"
  | "overcast"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "storm";

export interface RoleBio {
  title: string;
  bio: string;
}

export interface HighlightCard {
  title: string;
  sub: string;
}

export type ServiceCategory = "development" | "design" | "backend" | "growth";

export interface ServiceItem {
  title: string;
  desc: string;
  tags: string[];
  points: string[];
  category: ServiceCategory;
}

export type ProjectStatus = "completed" | "in-progress";

export interface ProjectItem {
  title: string;
  desc: string;
  tech: string[];
  status: ProjectStatus;
  opensource: boolean;
  category: string;
  github: string;
  period: string;
  year: string;
}

export interface Dictionary {
  /** BCP-47 tag used by Intl formatters. */
  intlLocale: string;
  nav: Record<NavId, string>;
  menu: { open: string; close: string; label: string };
  controls: {
    language: string;
    switchToFrench: string;
    switchToEnglish: string;
    toLight: string;
    toDark: string;
  };
  bar: {
    timeLabel: string;
    weatherLabel: string;
    weather: Record<WeatherGroup, string>;
    unavailable: string;
  };
  hero: {
    greeting: string;
    dayParts: { morning: string; afternoon: string; evening: string; night: string };
    inSuez: string;
    roles: RoleBio[];
    photoAlt: string;
    hireMe: string;
    explore: string;
    downloadCv: string;
    follow: string;
    socials: string;
    available: string;
    unavailable: string;
    location: string;
    currently: string;
    building: string;
    scroll: string;
    scrollNext: string;
    card: {
      showCard: string;
      flipBack: string;
      title: string;
      role: string;
      scanHint: string;
      save: string;
      copyEmail: string;
      copied: string;
      whatsapp: string;
      tapBack: string;
    };
  };
  code: { roleValue: string; statusValue: string };
  loader: { role: string; loading: string; folio: string; skip: string };
  play: {
    hint: string;
    goto: string;
    chapters: { kicker: string; a: string; b: string; body: string }[];
    finaleKicker: string;
    finaleA: string;
    finaleB: string;
    stats: { tech: string; lang: string; spec: string };
    cta: string;
    note: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    lede: string;
    motto: string;
    photoAlt: string;
    whatsapp: string;
    copy: string;
    copied: string;
    supportTitle: string;
    vodafone: string;
    vodafoneNote: string;
    instapay: string;
    soon: string;
    vcard: string;
    faqTitle: string;
    faq: { q: string; a: string }[];
    cairo: string;
  };
  services: {
    eyebrow: string;
    title: string;
    lede: string;
    filters: { id: ServiceCategory | "all"; label: string }[];
    items: ServiceItem[];
    details: string;
    ctaTitle: string;
    ctaButton: string;
    processLabel: string;
    process: { title: string; desc: string }[];
  };
  projects: {
    eyebrow: string;
    title: string;
    lede: string;
    filters: { id: "all" | ProjectStatus | "opensource"; label: string }[];
    items: ProjectItem[];
    stats: { total: string; done: string; progress: string; open: string };
    code: string;
    demo: string;
    cta: string;
    showing: string;
    noResults: string;
    reset: string;
    searchPh: string;
  };
  about: {
    eyebrow: string;
    title: string;
    lede: string;
    story: string[];
    cards: HighlightCard[];
    statsLangLabel: string;
    statsLangSub: string;
    statsAgeLabel: string;
    statsAgeSub: string;
    statsDaysLabel: string;
    statsDaysSub: string;
    statsCakeLabel: string;
    eduTitle: string;
    eduDept: string;
    eduFaculty: string;
    eduUni: string;
    levels: { label: string; motto: string }[];
    graduatedLabel: string;
    graduatedMotto: string;
    photoAlt: string;
  };
}

const en: Dictionary = {
  intlLocale: "en-GB",
  nav: {
    home: "Home",
    about: "About",
    services: "Services",
    projects: "Projects",
    skills: "Skills",
    certificates: "Certificates",
    contact: "Contact",
  },
  menu: { open: "Open menu", close: "Close menu", label: "Site menu" },
  controls: {
    language: "Language",
    switchToFrench: "Switch language to French",
    switchToEnglish: "Switch language to English",
    toLight: "Switch to light theme",
    toDark: "Switch to dark theme",
  },
  bar: {
    timeLabel: "Local time in Cairo",
    weatherLabel: "Weather in Suez",
    weather: {
      clear: "Clear",
      partly: "Partly cloudy",
      overcast: "Overcast",
      fog: "Fog",
      drizzle: "Drizzle",
      rain: "Rain",
      snow: "Snow",
      storm: "Storm",
    },
    unavailable: "Unavailable",
  },
  hero: {
    greeting: "Hello, I'm",
    dayParts: {
      morning: "Good morning",
      afternoon: "Good afternoon",
      evening: "Good evening",
      night: "Good night",
    },
    inSuez: "in Suez",
    roles: [
      {
        title: "Full-Stack Developer",
        bio: "I build fast, modern web platforms — from sharp interfaces to solid back-ends. React, Next.js and TypeScript, engineered for performance and crafted with care.",
      },
      {
        title: "Frontend Developer",
        bio: "I craft sharp, responsive interfaces with React and Next.js — clean layouts, smooth motion, and pixel-level attention on every screen size.",
      },
      {
        title: "Cybersecurity Learner",
        bio: "Currently leveling up in cybersecurity — secure-coding habits, OWASP Top 10 basics, and hands-on practice to ship safer software.",
      },
      {
        title: "Software Engineer",
        bio: "I treat code like engineering — readable, tested, and structured to stay maintainable long after the first deploy.",
      },
    ],
    photoAlt: "Portrait of Mohamed Abdallah",
    hireMe: "Hire Me",
    explore: "View Projects",
    downloadCv: "Download CV",
    follow: "Follow",
    socials: "Social links",
    available: "Available for work",
    unavailable: "Currently unavailable",
    location: "Egypt — Suez",
    currently: "Currently",
    building: "Building for the web",
    scroll: "Scroll",
    scrollNext: "Scroll to next section",
    card: {
      showCard: "Show contact card",
      flipBack: "Flip back to photo",
      title: "Let's connect",
      role: "Full-Stack Developer",
      scanHint: "Scan to save contact",
      save: "Save contact",
      copyEmail: "Copy email",
      copied: "Copied",
      whatsapp: "WhatsApp",
      tapBack: "Tap to flip back",
    },
  },
  code: { roleValue: "full-stack developer", statusValue: "open for work" },
  loader: {
    role: "Full-Stack Developer",
    loading: "Loading experience",
    folio: "Folio — 2026",
    skip: "Click to skip",
  },
  play: {
    hint: "Scroll to play",
    goto: "Go to part",
    chapters: [
      {
        kicker: "The approach",
        a: "FAST. CLEAN.",
        b: "RELIABLE.",
        body: "Every pixel has a job. Every line has a reason — no bloat, no templates, no shortcuts.",
      },
      {
        kicker: "01 — Interfaces",
        a: "SHARP",
        b: "FRONT-ENDS.",
        body: "React and Next.js interfaces that feel instant — responsive from a 320px phone to a 4K wall.",
      },
      {
        kicker: "02 — Back-ends",
        a: "SOLID",
        b: "FOUNDATIONS.",
        body: "Clean APIs and typed logic with an engineer's discipline — built to stay maintainable.",
      },
      {
        kicker: "03 — Security",
        a: "SAFE BY",
        b: "HABIT.",
        body: "A secure-coding mindset from day one — OWASP-aware and always learning.",
      },
      {
        kicker: "04 — Motion",
        a: "ALIVE,",
        b: "NOT STATIC.",
        body: "Interfaces that move with intent — choreographed reveals, physical micro-interactions, zero jank.",
      },
      {
        kicker: "05 — Systems",
        a: "CONNECTED",
        b: "SYSTEMS.",
        body: "Websites are one layer — I wire interfaces, data, users and automation into one coherent machine: dashboards, CRMs and workflows that run the business.",
      },
      {
        kicker: "06 — Intelligence",
        a: "ALIVE WITH",
        b: "AI.",
        body: "Practical AI where it pays — assistants, summaries and smart search wired into real products, not just demos.",
      },
    ],
    finaleKicker: "By the numbers",
    finaleA: "LET'S BUILD",
    finaleB: "SOMETHING REAL.",
    stats: { tech: "Technologies", lang: "Languages", spec: "Specialties" },
    cta: "Start a project",
    note: "One developer — full stack.",
  },
  contact: {
    eyebrow: "07 · Contact",
    title: "Get In Touch",
    lede: "Let's connect, collaborate, and build something amazing together.",
    motto: "Have an idea? My inbox is always open.",
    photoAlt: "Portrait of Mohamed Abdallah",
    whatsapp: "Chat on WhatsApp",
    copy: "Copy",
    copied: "Copied",
    supportTitle: "Support my work",
    vodafone: "Vodafone Cash",
    vodafoneNote: "Tap to copy — instant transfer",
    instapay: "InstaPay",
    soon: "Coming soon",
    vcard: "Save contact",
    faqTitle: "Quick answers",
    faq: [
      {
        q: "Are you available for work?",
        a: "Yes — open for freelance projects and full-time roles. The fastest way to reach me is WhatsApp.",
      },
      {
        q: "Where are you based?",
        a: "Suez, Egypt — working remotely with clients in any timezone.",
      },
      {
        q: "What should I include in my message?",
        a: "Your goal, timeline and budget range — I'll reply with next steps.",
      },
    ],
    cairo: "Cairo",
  },
  services: {
    eyebrow: "02 · Services",
    title: "What I Do",
    lede: "End-to-end services for products that need to look sharp and work flawlessly.",
    filters: [
      { id: "all", label: "All work" },
      { id: "development", label: "Development" },
      { id: "design", label: "Design" },
      { id: "backend", label: "Backend" },
      { id: "growth", label: "Growth" },
    ],
    items: [
      {
        title: "Full-Stack Web Development",
        desc: "Complete web apps from database to deploy — React, Next.js and TypeScript in one coherent build.",
        tags: ["Next.js", "TypeScript", "Node.js"],
        points: ["End-to-end product builds", "Auth, dashboards & roles", "Deploy pipelines included"],
        category: "development",
      },
      {
        title: "Front-End UI/UX Crafting",
        desc: "Pixel-faithful, animated interfaces — Tailwind precision with motion that feels alive.",
        tags: ["Tailwind CSS", "GSAP", "Motion"],
        points: ["Design-to-code fidelity", "Micro-interactions", "Reusable component systems"],
        category: "design",
      },
      {
        title: "Back-End & API Architecture",
        desc: "Secure, typed REST APIs with clean contracts — auth, validation and errors done right.",
        tags: ["Node.js", "REST", "Auth"],
        points: ["REST resource design", "Auth & access roles", "Validation & error shaping"],
        category: "backend",
      },
      {
        title: "Database Modeling",
        desc: "Schemas that scale — relations, indexes and migrations planned before the first row.",
        tags: ["SQL", "Indexing", "Migrations"],
        points: ["Relational schema design", "Index strategy", "Safe migrations"],
        category: "backend",
      },
      {
        title: "Performance & SEO",
        desc: "Core Web Vitals in the green and pages Google loves — metadata, OG cards and sitemaps.",
        tags: ["Vitals", "Metadata", "Sitemaps"],
        points: ["Vitals 90+ on mobile", "Meta + OG/social cards", "Sitemaps & robots"],
        category: "growth",
      },
      {
        title: "Maintenance & Support",
        desc: "Bug hunts, refactors and upgrades — existing projects get a second life, not a rewrite.",
        tags: ["Debugging", "Refactor", "Upgrades"],
        points: ["Root-cause bug fixes", "Careful refactoring", "Dependency upgrades"],
        category: "growth",
      },
      {
        title: "System Development",
        desc: "Internal tools that run the business — admin panels, workflows and role-based access.",
        tags: ["Dashboards", "CRUD", "Roles"],
        points: ["Admin panels", "Custom workflows", "Role-based access"],
        category: "development",
      },
      {
        title: "AI Integration",
        desc: "Practical AI features wired into real products — chat, summaries and smart search that work.",
        tags: ["Chat", "Summaries", "Search"],
        points: ["Chat assistants", "Auto summaries", "Smart search"],
        category: "development",
      },
      {
        title: "CRM Systems",
        desc: "Customer pipelines under control — leads, follow-ups and reports in one place.",
        tags: ["Pipelines", "Leads", "Reports"],
        points: ["Lead pipelines", "Follow-up flows", "Sales reports"],
        category: "development",
      },
      {
        title: "Automation & Workflows",
        desc: "Repetitive work, deleted — webhooks, scheduled jobs and scripts that run themselves.",
        tags: ["Webhooks", "Cron", "Scripts"],
        points: ["Webhook integrations", "Scheduled jobs", "Glue scripts"],
        category: "development",
      },
    ],
    details: "Details",
    ctaTitle: "Have a project in mind?",
    ctaButton: "Let's talk",
    processLabel: "How I work",
    process: [
      { title: "Discover", desc: "Goals, users, scope — mapped before a line is written." },
      { title: "Design", desc: "Structure and interface — prototyped, then refined." },
      { title: "Build", desc: "Clean, typed code — shipped in reviewable slices." },
      { title: "Launch", desc: "Deploy, measure, polish — then support." },
    ],
  },
  projects: {
    eyebrow: "05 · Projects",
    title: "Featured Projects",
    lede: "A selection of my recent work and personal projects.",
    filters: [
      { id: "all", label: "All work" },
      { id: "completed", label: "Completed" },
      { id: "in-progress", label: "In progress" },
      { id: "opensource", label: "Open source" },
    ],
    items: [
      {
        title: "Kayan — Study Companion",
        desc: "Bilingual Arabic study platform: AI assistant, Pomodoro focus, flashcards, tasks, prayer times and analytics.",
        tech: ["JavaScript", "Three.js", "HTML", "CSS", "Node.js"],
        status: "in-progress",
        opensource: true,
        category: "Education",
        github: "https://github.com/budiabdallah20/kayan",
        period: "09/2026 — 10/2026",
        year: "2026",
      },
      {
        title: "Massar — Personal OS",
        desc: "Arabic life-management app (v10): tasks, lectures, expenses, habits, prayer tracking, memories and an AI buddy.",
        tech: ["JavaScript", "HTML", "CSS"],
        status: "completed",
        opensource: true,
        category: "PWA",
        github: "https://github.com/budiabdallah20/Massar",
        period: "09/2026 — 09/2026",
        year: "2026",
      },
      {
        title: "BUDI Platform",
        desc: "My previous portfolio platform — contact, donations and live dashboards in one place.",
        tech: ["JavaScript", "HTML", "CSS"],
        status: "completed",
        opensource: true,
        category: "Personal",
        github: "https://github.com/budiabdallah20/Budi-s-",
        period: "08/2026 — 09/2026",
        year: "2026",
      },
    ],
    stats: { total: "Total projects", done: "Completed", progress: "In progress", open: "Open source" },
    code: "Code",
    demo: "Live demo",
    cta: "Your project could be next — let's build it",
    showing: "Showing",
    noResults: "No projects match.",
    reset: "Reset",
    searchPh: "Search projects…",
  },
  about: {
    eyebrow: "01 · About",
    title: "About Me",
    lede: "I design and ship complete web products, beautiful outside and engineered inside.",
    story: [
      "I'm Mohamed Abdallah, a full-stack developer from Suez, Egypt. I take products from first sketch to production. Sharp responsive interfaces in React and Next.js, powered by clean APIs and TypeScript from end to end.",
      "I work like an engineer, not just a coder. Readable code, thoughtful architecture and a performance budget on every project. What I ship stays fast, secure and maintainable long after launch.",
      "Right now I am pushing on two fronts. Advanced frontend craft and cybersecurity fundamentals. Great software must also be safe software. If you value quality over shortcuts, we will get along.",
    ],
    cards: [
      { title: "Modern Web Apps", sub: "From landing pages to dashboards — fast, responsive, complete." },
      { title: "Clean & Secure Code", sub: "Readable architecture, OWASP habits, zero shortcuts." },
      { title: "Languages", sub: "Arabic · English · French — code, docs & clients." },
      { title: "Available", sub: "One slot open — let's build yours next." },
    ],
    statsLangLabel: "Languages",
    statsLangSub: "Arabic · English · French",
    statsAgeLabel: "Years old",
    statsAgeSub: "And counting",
    statsDaysLabel: "Days alive",
    statsDaysSub: "Counting live",
    statsCakeLabel: "Days to my birthday",
    eduTitle: "Education",
    eduDept: "Department",
    eduFaculty: "Faculty",
    eduUni: "University",
    levels: [
      { label: " First Level ", motto: "Foundations first — every expert was once a beginner." },
      { label: " Second Level ", motto: "Momentum builds — consistency beats intensity." },
      { label: " Third Level", motto: "Depth over breadth — mastering the craft." },
      { label: " Fourth Level ", motto: "Final stretch — finish stronger than you started." },
    ],
    graduatedLabel: "Graduated",
    graduatedMotto: "Officially graduated — ready for what's next.",
    photoAlt: "Portrait of Mohamed Abdallah",
  },
};

const fr: Dictionary = {
  intlLocale: "fr-FR",
  nav: {
    home: "Accueil",
    about: "À propos",
    services: "Services",
    projects: "Projets",
    skills: "Compétences",
    certificates: "Certificats",
    contact: "Contact",
  },
  menu: { open: "Ouvrir le menu", close: "Fermer le menu", label: "Menu du site" },
  controls: {
    language: "Langue",
    switchToFrench: "Passer le site en français",
    switchToEnglish: "Passer le site en anglais",
    toLight: "Passer au thème clair",
    toDark: "Passer au thème sombre",
  },
  bar: {
    timeLabel: "Heure locale au Caire",
    weatherLabel: "Météo à Suez",
    weather: {
      clear: "Dégagé",
      partly: "Partiellement nuageux",
      overcast: "Couvert",
      fog: "Brouillard",
      drizzle: "Bruine",
      rain: "Pluie",
      snow: "Neige",
      storm: "Orage",
    },
    unavailable: "Indisponible",
  },
  hero: {
    greeting: "Salut, je suis",
    dayParts: {
      morning: "Bonjour",
      afternoon: "Bon après-midi",
      evening: "Bonsoir",
      night: "Bonne nuit",
    },
    inSuez: "à Suez",
    roles: [
      {
        title: "Développeur Full-Stack",
        bio: "Je conçois des plateformes web rapides et modernes — des interfaces soignées aux back-ends solides. React, Next.js et TypeScript, pensés pour la performance et réalisés avec soin.",
      },
      {
        title: "Développeur Frontend",
        bio: "Je crée des interfaces soignées et responsives avec React et Next.js — des mises en page claires, des animations fluides et un vrai souci du détail.",
      },
      {
        title: "Apprenti en cybersécurité",
        bio: "Je monte en compétence en cybersécurité — bonnes pratiques de code sécurisé, bases de l'OWASP Top 10, et beaucoup de pratique pour livrer des logiciels plus sûrs.",
      },
      {
        title: "Ingénieur Logiciel",
        bio: "Je traite le code comme de l'ingénierie — lisible, testé et structuré pour rester maintenable bien après le premier déploiement.",
      },
    ],
    photoAlt: "Portrait de Mohamed Abdallah",
    hireMe: "Me recruter",
    explore: "Voir les projets",
    downloadCv: "Télécharger le CV",
    follow: "Suivre",
    socials: "Réseaux sociaux",
    available: "Disponible",
    unavailable: "Actuellement indisponible",
    location: "Égypte — Suez",
    currently: "Actuellement",
    building: "Je crée pour le web",
    scroll: "Défiler",
    scrollNext: "Défiler vers la section suivante",
    card: {
      showCard: "Voir la carte de contact",
      flipBack: "Retour à la photo",
      title: "Connectons-nous",
      role: "Développeur Full-Stack",
      scanHint: "Scannez pour enregistrer",
      save: "Enregistrer",
      copyEmail: "Copier l'e-mail",
      copied: "Copié",
      whatsapp: "WhatsApp",
      tapBack: "Touchez pour retourner",
    },
  },
  code: { roleValue: "développeur full-stack", statusValue: "disponible" },
  loader: {
    role: "Développeur Full-Stack",
    loading: "Chargement en cours",
    folio: "Folio — 2026",
    skip: "Cliquez pour passer",
  },
  play: {
    hint: "Défiler pour explorer",
    goto: "Aller à la partie",
    chapters: [
      {
        kicker: "L'approche",
        a: "RAPIDE. PROPRE.",
        b: "FIABLE.",
        body: "Chaque pixel a un rôle. Chaque ligne a une raison — ni lourdeur, ni templates, ni raccourcis.",
      },
      {
        kicker: "01 — Interfaces",
        a: "INTERFACES",
        b: "AFFÛTÉES.",
        body: "Des interfaces React et Next.js instantanées — responsives du téléphone 320px au mur 4K.",
      },
      {
        kicker: "02 — Back-ends",
        a: "BASES",
        b: "SOLIDES.",
        body: "Des API propres et une logique typée avec la discipline d'un ingénieur — conçues pour durer.",
      },
      {
        kicker: "03 — Sécurité",
        a: "SÛR PAR",
        b: "HABITUDE.",
        body: "Un réflexe de code sécurisé dès le premier jour — sensibilisé à l'OWASP, toujours en apprentissage.",
      },
      {
        kicker: "04 — Mouvement",
        a: "VIVANT,",
        b: "PAS STATIQUE.",
        body: "Des interfaces qui bougent avec intention — révélations chorégraphiées, micro-interactions physiques, zéro saccade.",
      },
      {
        kicker: "05 — Systèmes",
        a: "SYSTÈMES",
        b: "CONNECTÉS.",
        body: "Le site n'est qu'une couche — je connecte interfaces, données, utilisateurs et automatisations en une machine cohérente : dashboards, CRM et workflows qui font tourner la boîte.",
      },
      {
        kicker: "06 — Intelligence",
        a: "VIVANT AVEC",
        b: "L'IA.",
        body: "De l'IA concrète là où ça paie — assistants, résumés et recherche intelligente câblés à de vrais produits, pas des démos.",
      },
    ],
    finaleKicker: "Par les chiffres",
    finaleA: "CONSTRUISONS",
    finaleB: "QUELQUE CHOSE DE VRAI.",
    stats: { tech: "Technologies", lang: "Langues", spec: "Spécialités" },
    cta: "Démarrer un projet",
    note: "Un développeur — full-stack.",
  },
  contact: {
    eyebrow: "07 · Contact",
    title: "Restons en contact",
    lede: "Connectons-nous, collaborons et construisons quelque chose d'extraordinaire.",
    motto: "Une idée ? Ma boîte mail est toujours ouverte.",
    photoAlt: "Portrait de Mohamed Abdallah",
    whatsapp: "Discuter sur WhatsApp",
    copy: "Copier",
    copied: "Copié",
    supportTitle: "Soutenez mon travail",
    vodafone: "Vodafone Cash",
    vodafoneNote: "Touchez pour copier — transfert instantané",
    instapay: "InstaPay",
    soon: "Bientôt disponible",
    vcard: "Enregistrer le contact",
    faqTitle: "Réponses rapides",
    faq: [
      {
        q: "Êtes-vous disponible ?",
        a: "Oui — ouvert aux missions freelance et aux postes. Le plus rapide : WhatsApp.",
      },
      {
        q: "Où êtes-vous basé ?",
        a: "Suez, Égypte — je travaille à distance, tous fuseaux horaires.",
      },
      {
        q: "Que dois-je inclure dans mon message ?",
        a: "Votre objectif, vos délais et votre budget — je réponds avec les prochaines étapes.",
      },
    ],
    cairo: "Le Caire",
  },
  services: {
    eyebrow: "02 · Services",
    title: "Ce que je fais",
    lede: "Des services de bout en bout pour des produits beaux et irréprochables.",
    filters: [
      { id: "all", label: "Tout" },
      { id: "development", label: "Développement" },
      { id: "design", label: "Design" },
      { id: "backend", label: "Backend" },
      { id: "growth", label: "Croissance" },
    ],
    items: [
      {
        title: "Développement Web Full-Stack",
        desc: "Des applications web complètes, de la base de données au déploiement — React, Next.js et TypeScript dans un build cohérent.",
        tags: ["Next.js", "TypeScript", "Node.js"],
        points: ["Produits complets de bout en bout", "Auth, dashboards et rôles", "Pipelines de déploiement inclus"],
        category: "development",
      },
      {
        title: "Craft UI/UX Front-End",
        desc: "Des interfaces fidèles au pixel et animées — la précision Tailwind avec du mouvement vivant.",
        tags: ["Tailwind CSS", "GSAP", "Motion"],
        points: ["Fidélité maquette-to-code", "Micro-interactions", "Systèmes de composants réutilisables"],
        category: "design",
      },
      {
        title: "Architecture Back-End & API",
        desc: "Des API REST sécurisées et typées aux contrats clairs — auth, validation et erreurs bien gérées.",
        tags: ["Node.js", "REST", "Auth"],
        points: ["Conception REST", "Auth et rôles d'accès", "Validation et erreurs"],
        category: "backend",
      },
      {
        title: "Modélisation Base de Données",
        desc: "Des schémas qui passent l'échelle — relations, index et migrations pensés avant la première ligne.",
        tags: ["SQL", "Indexing", "Migrations"],
        points: ["Schémas relationnels", "Stratégie d'index", "Migrations sûres"],
        category: "backend",
      },
      {
        title: "Performance & SEO",
        desc: "Des Core Web Vitals au vert et des pages que Google adore — métadonnées, cartes OG et sitemaps.",
        tags: ["Vitals", "Metadata", "Sitemaps"],
        points: ["Vitals 90+ sur mobile", "Meta + cartes OG", "Sitemaps & robots"],
        category: "growth",
      },
      {
        title: "Maintenance & Support",
        desc: "Chasse aux bugs, refactors et montées de version — une seconde vie pour vos projets, pas un rewrite.",
        tags: ["Debugging", "Refactor", "Upgrades"],
        points: ["Corrections à la racine", "Refactoring soigneux", "Mises à jour"],
        category: "growth",
      },
      {
        title: "Développement Systèmes",
        desc: "Des outils internes qui font tourner la boîte — panneaux admin, workflows et accès par rôles.",
        tags: ["Dashboards", "CRUD", "Roles"],
        points: ["Panneaux admin", "Workflows sur mesure", "Accès par rôles"],
        category: "development",
      },
      {
        title: "Intégration IA",
        desc: "Des fonctionnalités IA concrètes câblées à de vrais produits — chat, résumés et recherche intelligente.",
        tags: ["Chat", "Summaries", "Search"],
        points: ["Assistants chat", "Résumés auto", "Recherche intelligente"],
        category: "development",
      },
      {
        title: "Systèmes CRM",
        desc: "Des pipelines clients sous contrôle — prospects, relances et rapports au même endroit.",
        tags: ["Pipelines", "Leads", "Reports"],
        points: ["Pipelines de prospects", "Relances", "Rapports de vente"],
        category: "development",
      },
      {
        title: "Automatisation & Workflows",
        desc: "Le travail répétitif, supprimé — webhooks, tâches planifiées et scripts autonomes.",
        tags: ["Webhooks", "Cron", "Scripts"],
        points: ["Intégrations webhooks", "Tâches planifiées", "Scripts de liaison"],
        category: "development",
      },
    ],
    details: "Détails",
    ctaTitle: "Un projet en tête ?",
    ctaButton: "Discutons-en",
    processLabel: "Ma méthode",
    process: [
      { title: "Découverte", desc: "Objectifs, utilisateurs, périmètre — cadrés avant la première ligne." },
      { title: "Design", desc: "Structure et interface — prototypées puis affinées." },
      { title: "Construction", desc: "Un code propre et typé — livré par tranches relisables." },
      { title: "Lancement", desc: "Déploiement, mesure, polish — puis support." },
    ],
  },
  projects: {
    eyebrow: "05 · Projets",
    title: "Projets en vedette",
    lede: "Une sélection de mes travaux récents et projets personnels.",
    filters: [
      { id: "all", label: "Tout" },
      { id: "completed", label: "Terminés" },
      { id: "in-progress", label: "En cours" },
      { id: "opensource", label: "Open source" },
    ],
    items: [
      {
        title: "Kayan — Study Companion",
        desc: "Plateforme d'étude bilingue arabe : assistant IA, focus Pomodoro, flashcards, tâches, prières et analyses.",
        tech: ["JavaScript", "Three.js", "HTML", "CSS", "Node.js"],
        status: "in-progress",
        opensource: true,
        category: "Éducation",
        github: "https://github.com/budiabdallah20/kayan",
        period: "09/2026 — 10/2026",
        year: "2026",
      },
      {
        title: "Massar — Personal OS",
        desc: "App arabe de gestion de vie (v10) : tâches, cours, dépenses, habitudes, prières, souvenirs et un ami IA.",
        tech: ["JavaScript", "HTML", "CSS"],
        status: "completed",
        opensource: true,
        category: "PWA",
        github: "https://github.com/budiabdallah20/Massar",
        period: "09/2026 — 09/2026",
        year: "2026",
      },
      {
        title: "BUDI Platform",
        desc: "Mon ancienne plateforme portfolio — contact, dons et dashboards en direct au même endroit.",
        tech: ["JavaScript", "HTML", "CSS"],
        status: "completed",
        opensource: true,
        category: "Personnel",
        github: "https://github.com/budiabdallah20/Budi-s-",
        period: "08/2026 — 09/2026",
        year: "2026",
      },
    ],
    stats: { total: "Projets au total", done: "Terminés", progress: "En cours", open: "Open source" },
    code: "Code",
    demo: "Démo live",
    cta: "Votre projet pourrait être le prochain — construisons-le",
    showing: "Affichage",
    noResults: "Aucun projet.",
    reset: "Réinitialiser",
    searchPh: "Rechercher…",
  },
  about: {
    eyebrow: "01 · À propos",
    title: "À propos de moi",
    lede: "Je conçois et livre des produits web complets, beaux dehors et solides dedans.",
    story: [
      "Je suis Mohamed Abdallah, développeur full-stack basé à Suez, en Égypte. Je mène les produits du premier croquis à la production. Des interfaces soignées et responsives avec React et Next.js, portées par des API propres et du TypeScript de bout en bout.",
      "Je travaille comme un ingénieur, pas comme un simple codeur. Un code lisible, une architecture réfléchie et un budget de performance sur chaque projet. Ce que je livre reste rapide, sécurisé et maintenable bien après le lancement.",
      "En ce moment, je pousse sur deux fronts. L'artisanat frontend avancé et les fondamentaux de la cybersécurité. Un grand logiciel doit aussi être un logiciel sûr. Si vous préférez la qualité aux raccourcis, on va bien s'entendre.",
    ],
    cards: [
      { title: "Apps Web Modernes", sub: "Des landing pages aux dashboards — rapide, responsive, complet." },
      { title: "Code Propre & Sûr", sub: "Architecture lisible, réflexes OWASP, zéro raccourci." },
      { title: "Langues", sub: "Arabe · Anglais · Français — code, docs & clients." },
      { title: "Disponible", sub: "Une place libre — construisons votre projet." },
    ],
    statsLangLabel: "Langues",
    statsLangSub: "Arabe · Anglais · Français",
    statsAgeLabel: "Ans",
    statsAgeSub: "Et ça continue",
    statsDaysLabel: "Jours vécus",
    statsDaysSub: "Compteur en direct",
    statsCakeLabel: "Jours avant mon anniversaire",
    eduTitle: "Formation",
    eduDept: "Département",
    eduFaculty: "Faculté",
    eduUni: "Université",
    levels: [
      { label: "Niveau Un", motto: "Les bases d'abord — tout expert a été débutant." },
      { label: "Niveau Deux", motto: "L'élan se construit — la régularité bat l'intensité." },
      { label: "Niveau Trois", motto: "La profondeur avant tout — maîtriser son art." },
      { label: "Niveau Quatre", motto: "Dernière ligne droite — finir plus fort qu'au départ." },
    ],
    graduatedLabel: "Diplômé",
    graduatedMotto: "Diplômé officiellement — prêt pour la suite.",
    photoAlt: "Portrait de Mohamed Abdallah",
  },
};

export const dictionaries: Record<Lang, Dictionary> = { en, fr };

export function isLang(value: string | null): value is Lang {
  return value === "en" || value === "fr";
}
