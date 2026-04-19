export interface ValidationSite {
  id: string;
  name: string;
  url: string;
  description: string;
  categories: string[];
  keywords?: string[];
  /** True if the site always blocks server-side scraping or requires login */
  auth_required?: boolean;
}

export const VALIDATION_SITES: ValidationSite[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    url: "https://www.linkedin.com",
    description: "Work history, endorsements, recommendations.",
    categories: [
      "career",
      "business",
      "technology",
      "finance",
      "communication",
      "interview_prep",
    ],
  },
  {
    id: "strava",
    name: "Strava",
    url: "https://www.strava.com",
    description: "Running, cycling, swimming, and endurance logs.",
    categories: ["fitness"],
    auth_required: true,
    keywords: [
      "run",
      "running",
      "marathon",
      "cycling",
      "cycle",
      "bike",
      "triathlon",
      "swim",
      "endurance",
      "hike",
    ],
  },
  {
    id: "orangetheory",
    name: "Orangetheory Fitness",
    url: "https://www.orangetheoryfitness.com",
    description: "HIIT and heart-rate-based training history.",
    categories: ["fitness"],
    keywords: ["hiit", "interval", "class", "trainer", "strength"],
    auth_required: true,
  },
  {
    id: "peloton",
    name: "Peloton",
    url: "https://www.onepeloton.com",
    description: "Cycling, running, strength, and yoga workout history.",
    categories: ["fitness"],
    keywords: ["cycle", "spin", "yoga", "strength", "tread"],
    auth_required: true,
  },
  {
    id: "etsy",
    name: "Etsy",
    url: "https://www.etsy.com",
    description: "Handmade goods shop, reviews, sales history.",
    categories: ["creative", "business", "home_skills"],
    auth_required: true,
    keywords: [
      "craft",
      "handmade",
      "knit",
      "crochet",
      "sew",
      "pottery",
      "ceramic",
      "jewelry",
      "woodwork",
    ],
  },
  {
    id: "github",
    name: "GitHub",
    url: "https://github.com",
    description: "Code portfolio, open-source contributions, activity graph.",
    categories: ["technology"],
    keywords: ["code", "programming", "software", "developer", "engineer"],
  },
  {
    id: "stackoverflow",
    name: "Stack Overflow",
    url: "https://stackoverflow.com",
    description: "Q&A reputation, tag expertise, accepted answers.",
    categories: ["technology"],
  },
  {
    id: "behance",
    name: "Behance",
    url: "https://www.behance.net",
    description: "Visual design, illustration, and creative portfolios.",
    categories: ["creative"],
    keywords: ["design", "illustration", "art", "photo", "visual", "ux", "ui"],
  },
  {
    id: "dribbble",
    name: "Dribbble",
    url: "https://dribbble.com",
    description: "UI/UX and design work-in-progress shots.",
    categories: ["creative", "technology"],
    keywords: ["design", "ux", "ui", "product"],
  },
  {
    id: "soundcloud",
    name: "SoundCloud",
    url: "https://soundcloud.com",
    description: "Original music, remixes, DJ sets.",
    categories: ["creative"],
    keywords: ["music", "song", "produce", "dj", "audio", "vocal", "guitar", "piano"],
  },
  {
    id: "spotify-artist",
    name: "Spotify for Artists",
    url: "https://artists.spotify.com",
    description: "Released music, monthly listeners, catalog depth.",
    categories: ["creative"],
    keywords: ["music", "song", "band", "artist", "produce"],
  },
  {
    id: "youtube",
    name: "YouTube",
    url: "https://www.youtube.com",
    description: "Tutorial channels, performances, teaching clips.",
    categories: [
      "creative",
      "fitness",
      "cooking",
      "technology",
      "learning",
      "home_skills",
      "language",
    ],
    keywords: ["teach", "tutorial", "channel", "demo", "perform"],
  },
  {
    id: "substack",
    name: "Substack",
    url: "https://substack.com",
    description: "Long-form writing with subscriber counts.",
    categories: ["creative", "business", "career", "finance", "mental_health"],
    keywords: ["write", "writing", "blog", "essay", "journalist"],
  },
  {
    id: "medium",
    name: "Medium",
    url: "https://medium.com",
    description: "Written articles, claps, follower counts.",
    categories: ["creative", "business", "career", "technology"],
    keywords: ["write", "writing", "blog", "article"],
  },
  {
    id: "goodreads",
    name: "Goodreads",
    url: "https://www.goodreads.com",
    description: "Reading history, reviews, reading challenges.",
    categories: ["learning"],
    keywords: ["book", "read", "literature"],
  },
  {
    id: "allrecipes",
    name: "Allrecipes",
    url: "https://www.allrecipes.com",
    description: "Published recipes, ratings, follower activity.",
    categories: ["cooking"],
  },
  {
    id: "instagram",
    name: "Instagram",
    url: "https://www.instagram.com",
    description: "Visual portfolio: food, fitness, crafts, fashion.",
    categories: ["creative", "cooking", "fitness", "home_skills", "business"],
    auth_required: true,
    keywords: ["photo", "food", "travel", "fashion", "style"],
  },
  {
    id: "coursera",
    name: "Coursera",
    url: "https://www.coursera.org",
    description: "Completed courses, specializations, certificates.",
    categories: ["learning", "career", "technology", "business", "finance"],
    keywords: ["course", "certificate", "certification"],
  },
  {
    id: "duolingo",
    name: "Duolingo",
    url: "https://www.duolingo.com",
    description: "Language-learning streaks, levels, leaderboards.",
    categories: ["language"],
  },
  {
    id: "twitch",
    name: "Twitch",
    url: "https://www.twitch.tv",
    description: "Live teaching streams, subscriber count.",
    categories: ["technology", "creative", "learning"],
    keywords: ["stream", "game", "live", "teach"],
  },
  {
    id: "allrecipes-mealprep",
    name: "Yummly",
    url: "https://www.yummly.com",
    description: "Recipe collections and cooking activity.",
    categories: ["cooking"],
  },
  {
    id: "mint",
    name: "Mint / Personal-finance dashboards",
    url: "https://mint.intuit.com",
    description: "Budgeting and net-worth track record (share screenshots).",
    categories: ["finance"],
  },
  {
    id: "toastmasters",
    name: "Toastmasters",
    url: "https://www.toastmasters.org",
    description: "Public-speaking credentials and club history.",
    categories: ["communication", "career"],
    keywords: ["speak", "presentation", "speech"],
  },
  {
    id: "ravelry",
    name: "Ravelry",
    url: "https://www.ravelry.com",
    description: "Knitting and crochet projects and patterns.",
    categories: ["creative", "home_skills"],
    keywords: ["knit", "crochet", "yarn"],
  },
];

export interface RankedSite {
  site: ValidationSite;
  score: number;
  matchedSkills: string[];
}

export function rankSites(
  skills: Array<{ category: string; skill_name: string }>,
): RankedSite[] {
  return VALIDATION_SITES.map((site) => {
    let score = 0;
    const matchedSkills: string[] = [];
    for (const s of skills) {
      let localScore = 0;
      if (site.categories.includes(s.category)) localScore += 3;
      if (
        site.keywords?.some((k) =>
          s.skill_name.toLowerCase().includes(k.toLowerCase()),
        )
      ) {
        localScore += 2;
      }
      if (localScore > 0) {
        score += localScore;
        matchedSkills.push(s.skill_name);
      }
    }
    return { site, score, matchedSkills };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}
