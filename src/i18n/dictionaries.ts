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
  exhibition: { reset: string; live: string };
  loader: { role: string; loading: string; folio: string; skip: string };
  play: {
    hint: string;
    museum: string;
    navLabel: string;
    skip: string;
    scrollHint: string;
    chapterWord: string;
    enter: string;
    exploreCollection: string;
    replay: string;
    finalLine: string;
    collectionIntro: string;
    counts: {
      skills: [string, string];
      projects: [string, string];
      services: [string, string];
      certificates: [string, string];
      contact: [string, string];
    };
    featuredLabel: string;
    issued: string;
    study: string;
    emailLabel: string;
    whatsappLabel: string;
    chapters: {
      id: string;
      nav: string;
      kicker: string;
      a: string;
      b: string;
      body: string;
      cta: string;
    }[];
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
  exhibition: { reset: "Clear selection", live: "Live Demo" },
  loader: {
    role: "Full-Stack Developer",
    loading: "Loading experience",
    folio: "Folio — 2026",
    skip: "Click to skip",
  },
  play: {
    hint: "The Living Museum — a scroll-controlled tour",
    museum: "The Living Museum",
    navLabel: "Museum chapters",
    skip: "Skip the tour",
    scrollHint: "Scroll to move through the museum",
    chapterWord: "Chapter",
    enter: "Enter the collection",
    exploreCollection: "Explore the complete collection",
    replay: "Replay the tour",
    finalLine: "Every great creation begins with a conversation.",
    collectionIntro: "The guided tour ends here. The full exhibition continues below — every hall, every record, every detail.",
    counts: {
      skills: ["Skill", "Skills"],
      projects: ["Project", "Projects"],
      services: ["Service", "Services"],
      certificates: ["Certificate", "Certificates"],
      contact: ["Conversation", "Conversations"],
    },
    featuredLabel: "Featured masterpiece",
    issued: "Issued record",
    study: "Design study",
    emailLabel: "Email",
    whatsappLabel: "WhatsApp",
    chapters: [
      {
        id: "gate",
        nav: "The Golden Gate",
        kicker: "Chapter 01 · Entrance",
        a: "ENTER THE",
        b: "LIVING MUSEUM.",
        body: "Welcome to the BUDI Museum — where code becomes art. Scroll to open the gate; stop, and the camera waits for you.",
        cta: "Enter the first hall",
      },
      {
        id: "skills",
        nav: "Hall of Skills",
        kicker: "Chapter 02 · The Skills Vault",
        a: "TOOLS OF",
        b: "THE CRAFT.",
        body: "Every artifact is a technology I use daily. The light finds one at a time, so each craft gets its own moment.",
        cta: "Open the vault",
      },
      {
        id: "projects",
        nav: "Hall of Masterpieces",
        kicker: "Chapter 03 · Projects",
        a: "WORK, FRAMED",
        b: "AS ART.",
        body: "Real builds on the pedestal: the problem, the craft and the result. No mockups, no invented clients.",
        cta: "See the masterpieces",
      },
      {
        id: "services",
        nav: "Hall of Creation",
        kicker: "Chapter 04 · Services",
        a: "FROM IDEA",
        b: "TO INSTRUMENT.",
        body: "Each service is a working invention — web platforms, connected systems and the care that keeps them alive.",
        cta: "Explore the services",
      },
      {
        id: "archive",
        nav: "Royal Archive",
        kicker: "Chapter 05 · Certificates",
        a: "PROOF,",
        b: "PRESERVED.",
        body: "Issued credentials and design studies are kept apart and labelled honestly. The archive never pretends.",
        cta: "Open the archive",
      },
      {
        id: "corridor",
        nav: "The Final Corridor",
        kicker: "Chapter 06 · Contact",
        a: "EVERY CREATION",
        b: "STARTS WITH A WORD.",
        body: "Walk to the end of the corridor. Email, WhatsApp or a direct conversation — the door is already open.",
        cta: "Start a conversation",
      },
      {
        id: "collection",
        nav: "The Collection",
        kicker: "Chapter 07 · Exit",
        a: "EXPLORE THE",
        b: "COMPLETE COLLECTION.",
        body: "The tour ends here; the detailed exhibition begins. Move through the halls at your own pace.",
        cta: "Explore the complete collection",
      },
    ],
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
        title: "RAQiB — Academic Operations",
        desc: "Academic operations platform for attendance, lectures, scheduling and grades, with student, professor and admin access.",
        tech: ["Next.js", "TypeScript", "Prisma", "React"],
        status: "in-progress",
        opensource: true,
        category: "Education",
        github: "https://github.com/budiabdallah20/raqib",
        period: "2026 — ongoing",
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
      {
        title: "Budi Dental — Clinic Management",
        desc: "Dental clinic platform in development: patient booking, appointments, patients, billing and practice operations.",
        tech: ["Next.js", "TypeScript", "Supabase", "Prisma"],
        status: "in-progress",
        opensource: false,
        category: "Healthcare SaaS",
        github: "https://github.com/budiabdallah20/dental-system",
        period: "2026 — ongoing",
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
  exhibition: { reset: "Effacer la sélection", live: "Voir le projet" },
  loader: {
    role: "Développeur Full-Stack",
    loading: "Chargement en cours",
    folio: "Folio — 2026",
    skip: "Cliquez pour passer",
  },
  play: {
    hint: "Le Musée Vivant — une visite guidée par le défilement",
    museum: "Le Musée Vivant",
    navLabel: "Chapitres du musée",
    skip: "Passer la visite",
    scrollHint: "Faites défiler pour avancer dans le musée",
    chapterWord: "Chapitre",
    enter: "Entrer dans la collection",
    exploreCollection: "Explorer la collection complète",
    replay: "Revoir la visite",
    finalLine: "Toute grande création commence par une conversation.",
    collectionIntro: "La visite guidée s'arrête ici. L'exposition complète continue plus bas — chaque salle, chaque pièce, chaque détail.",
    counts: {
      skills: ["Compétence", "Compétences"],
      projects: ["Projet", "Projets"],
      services: ["Service", "Services"],
      certificates: ["Certificat", "Certificats"],
      contact: ["Conversation", "Conversations"],
    },
    featuredLabel: "Chef-d'œuvre en vedette",
    issued: "Document délivré",
    study: "Étude visuelle",
    emailLabel: "E-mail",
    whatsappLabel: "WhatsApp",
    chapters: [
      {
        id: "gate",
        nav: "La Porte Dorée",
        kicker: "Chapitre 01 · Entrée",
        a: "ENTREZ DANS",
        b: "LE MUSÉE VIVANT.",
        body: "Bienvenue au Musée BUDI — là où le code devient art. Faites défiler pour ouvrir la porte ; arrêtez-vous, la caméra vous attend.",
        cta: "Entrer dans la première salle",
      },
      {
        id: "skills",
        nav: "Salle des Compétences",
        kicker: "Chapitre 02 · La voûte des savoirs",
        a: "LES OUTILS",
        b: "DU MÉTIER.",
        body: "Chaque pièce est une technologie que j'utilise chaque jour. La lumière n'en éclaire qu'une à la fois, pour donner à chaque savoir son moment.",
        cta: "Ouvrir la voûte",
      },
      {
        id: "projects",
        nav: "Salle des Chefs-d'œuvre",
        kicker: "Chapitre 03 · Projets",
        a: "LE TRAVAIL,",
        b: "COMME UNE ŒUVRE.",
        body: "De vrais projets sur le socle : le problème, le geste et le résultat. Aucune maquette, aucun client inventé.",
        cta: "Voir les chefs-d'œuvre",
      },
      {
        id: "services",
        nav: "Salle de la Création",
        kicker: "Chapitre 04 · Services",
        a: "DE L'IDÉE",
        b: "À L'INSTRUMENT.",
        body: "Chaque service est une invention qui fonctionne — plateformes web, systèmes connectés et l'attention qui les maintient en vie.",
        cta: "Explorer les services",
      },
      {
        id: "archive",
        nav: "Les Archives Royales",
        kicker: "Chapitre 05 · Certificats",
        a: "LA PREUVE,",
        b: "PRÉSERVÉE.",
        body: "Les diplômes délivrés et les études visuelles sont conservés séparément et nommés honnêtement. L'archive ne triche jamais.",
        cta: "Ouvrir les archives",
      },
      {
        id: "corridor",
        nav: "Le Couloir Final",
        kicker: "Chapitre 06 · Contact",
        a: "TOUTE CRÉATION",
        b: "COMMENCE PAR UN MOT.",
        body: "Avancez jusqu'au bout du couloir. E-mail, WhatsApp ou une conversation directe — la porte est déjà ouverte.",
        cta: "Commencer une conversation",
      },
      {
        id: "collection",
        nav: "La Collection",
        kicker: "Chapitre 07 · Sortie",
        a: "EXPLOREZ LA",
        b: "COLLECTION COMPLÈTE.",
        body: "La visite s'achève ici ; l'exposition détaillée commence. Parcourez les salles à votre rythme.",
        cta: "Explorer la collection complète",
      },
    ],
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
        title: "RAQiB — Gestion académique",
        desc: "Plateforme de gestion académique pour les présences, cours, emplois du temps et notes, avec accès étudiant, enseignant et administrateur.",
        tech: ["Next.js", "TypeScript", "Prisma", "React"],
        status: "in-progress",
        opensource: true,
        category: "Éducation",
        github: "https://github.com/budiabdallah20/raqib",
        period: "2026 — en cours",
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
      {
        title: "Budi Dental — Gestion de clinique",
        desc: "Plateforme dentaire en développement : réservation, rendez-vous, patients, facturation et gestion du cabinet.",
        tech: ["Next.js", "TypeScript", "Supabase", "Prisma"],
        status: "in-progress",
        opensource: false,
        category: "SaaS médical",
        github: "https://github.com/budiabdallah20/dental-system",
        period: "2026 — en cours",
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
