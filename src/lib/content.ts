/**
 * Single source of truth for all landing-page copy.
 * Keeping content here keeps section components presentational and easy to tune.
 *
 * NOTE: testimonials, names, and metrics below are illustrative placeholders
 * for the marketing mock — replace with real, attributable data before launch.
 */

export const NAV_LINKS = [
  { label: "Manifesto", href: "#manifesto" },
  { label: "How it works", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "Proof", href: "#proof" },
  { label: "FAQ", href: "#faq" },
] as const;

/** Context "moments" that scroll in the trusted strip — the Moodify voice. */
export const MOMENTS = [
  "2AM drive in the rain",
  "Heartbroken but optimistic",
  "Deep focus, do not disturb",
  "Gym — feel invincible",
  "Sunday slow morning",
  "Nostalgic with old friends",
  "Exhausted, need energy",
  "Studying, emotionally distracted",
  "Golden hour, windows down",
  "Pre-game adrenaline",
  "Crying, but make it pretty",
  "Coding flow state",
] as const;

export const HOW_STEPS = [
  {
    no: "01",
    kicker: "INPUT",
    title: "Connect your universe",
    body: "Link Spotify and your Liked Songs and playlists become your Master Playlists — the music you already love. We read, we never post.",
    tags: ["SPOTIFY OAUTH", "READ-ONLY", "MASTER PLAYLISTS"],
  },
  {
    no: "02",
    kicker: "CONTEXT",
    title: "Name the moment — or don't",
    body: "Type one sentence about where you are and how you feel. Or stay silent and let Moodify infer context from time, weather and motion. Never a survey.",
    tags: ["SEMANTIC ANCHORING", "PASSIVE CONTEXT", "ZERO FRICTION"],
  },
  {
    no: "03",
    kicker: "RESULT",
    title: "Press play, get understood",
    body: "A queue built for this exact moment, drawn from songs you already love. React once and your Emotional Taste Graph gets sharper every time.",
    tags: ["CONTEXTUAL QUEUE", "LEARNS LIVE", "JUST START PLAYING"],
  },
] as const;

export const BENEFITS = [
  {
    title: "Beat decision fatigue",
    body: "You always know how you feel. You rarely know the song. Moodify closes that gap in one tap — stop scrolling, start feeling.",
    stat: "0 sec",
    statLabel: "to the right song",
  },
  {
    title: "From music you already love",
    body: "Recommendations originate from your Master Playlists — not random catalog noise. Familiar enough to trust, surprising enough to delight.",
    stat: "100%",
    statLabel: "from your universe",
  },
  {
    title: "It actually gets you",
    body: "Every reaction feeds a private Emotional Taste Graph. The more you listen, the more it understands why a song matters to you.",
    stat: "73%",
    statLabel: "say it beats Spotify*",
  },
  {
    title: "Effortless by design",
    body: "No interviews. No forms. No homework. A bold “Just Start Playing” button at every step means you are never more than a tap from music.",
    stat: "1 tap",
    statLabel: "to skip everything",
  },
] as const;

export const FEATURES = [
  {
    icon: "playlist",
    title: "Master Playlists",
    body: "Your Liked Songs and chosen playlists become the universe we recommend from. We surface what you love — never random filler.",
    tags: ["LIKED SONGS", "YOUR PLAYLISTS", "ZERO RANDOMNESS"],
  },
  {
    icon: "compass",
    title: "Passive Context",
    body: "Time, weather, motion and place quietly inform the queue. Context assists — it never decides. Your intent always wins.",
    tags: ["TIME · WEATHER", "MOTION · PLACE", "INTENT-FIRST"],
  },
  {
    icon: "graph",
    title: "Emotional Taste Graph",
    body: "A living map of why songs matter to you — memory, mood, situation, social fit. Years of this are the moat Spotify can't copy.",
    tags: ["pgvector", "PER-USER", "COMPOUNDING"],
  },
  {
    icon: "loop",
    title: "Dynamic Feedback",
    body: "Sparing, intelligent questions chosen for maximum learning. “Did this fit?” “Too intense?” Tap once, the queue adapts in real time.",
    tags: ["SMART PROMPTS", "TAP TO TUNE", "ADAPTS LIVE"],
  },
  {
    icon: "quote",
    title: "Semantic Anchoring",
    body: "Describe a vibe in plain words — “late drives after the breakup, staying hopeful.” We decode the emotional, situational and energy signals.",
    tags: ["ONE SENTENCE", "SIGNAL EXTRACTION", "INSTANT PROFILE"],
  },
  {
    icon: "play",
    title: "Just Start Playing",
    body: "The non-negotiable. Skip onboarding, prompts, everything — and get music instantly. The fastest path from feeling to song, always.",
    tags: ["NO SIGNUP WALL", "ONE TAP", "ALWAYS AVAILABLE"],
  },
] as const;

export const STATS = [
  { value: 9000, suffix: "+", label: "Listeners tuning in" },
  { value: 12, suffix: "M", label: "Moments understood" },
  { value: 73, suffix: "%", label: "Say it beats Spotify*" },
  { value: 4.9, suffix: "★", label: "Average app rating", decimals: 1 },
] as const;

export const TESTIMONIALS = [
  {
    quote:
      "I typed “2AM, rain, can't sleep, don't want to feel worse.” It built a queue I'd never have found in my own library. It just understood.",
    name: "Maya R.",
    handle: "@mayalistens",
    meta: "2,140 liked songs",
  },
  {
    quote:
      "Spotify keeps showing me the same 40 songs. Moodify pulls from my actual taste and matches it to my day. First app that feels like it gets me.",
    name: "Devin O.",
    handle: "@devinplays",
    meta: "playlist curator",
  },
  {
    quote:
      "The feedback questions are weirdly perfect — never annoying, always the one thing it needed to know. My queues got scary-accurate in a week.",
    name: "Priya S.",
    handle: "@pri.fm",
    meta: "1,008 liked songs",
  },
  {
    quote:
      "I press ‘Just Start Playing’ and it nails the gym energy every time. No mood tax, no setup. It reads the room.",
    name: "Marcus T.",
    handle: "@marcuslifts",
    meta: "daily user",
  },
  {
    quote:
      "It found the exact heartbreak-but-hopeful lane I didn't know how to describe. I cried. In a good way. Then I replayed it four times.",
    name: "Elena K.",
    handle: "@elenak",
    meta: "3,512 liked songs",
  },
] as const;

export const FAQS = [
  {
    q: "Is Moodify a music player or a Spotify replacement?",
    a: "Neither. Spotify handles playback and stays the source of truth. Moodify is the intelligence layer on top — a contextual recommendation engine and emotional music advisor that decides what to play for this moment.",
  },
  {
    q: "Do I have to fill out a survey or onboarding quiz?",
    a: "Never. Onboarding feels like a game, not a tax form — quick swipes and one-sentence vibes. And a “Just Start Playing” button lets you skip all of it and get music instantly, every time.",
  },
  {
    q: "What data do you access from Spotify?",
    a: "Read-only access to your Liked Songs and playlists to build your Master Playlists. We never post on your behalf, never change your library, and you can disconnect anytime.",
  },
  {
    q: "How is this different from Spotify's own recommendations?",
    a: "Spotify optimizes behavioral prediction — what you play. Moodify models emotional understanding — why you play it, and what fits the moment you're in. Same song, different meaning depending on context.",
  },
  {
    q: "Do I need to pay to try it?",
    a: "No. Connecting Spotify, building Master Playlists and core recommendations are free. Premium unlocks deeper contextual recommendations and your full emotional memory graph.",
  },
] as const;

export const FOOTER_GROUPS = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "#how" },
      { label: "Features", href: "#features" },
      { label: "The moat", href: "#features" },
      { label: "Pricing", href: "#cta" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Manifesto", href: "#manifesto" },
      { label: "Proof", href: "#proof" },
      { label: "FAQ", href: "#faq" },
      { label: "Contact", href: "#cta" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Spotify data use", href: "#" },
      { label: "Disconnect", href: "#" },
    ],
  },
] as const;
