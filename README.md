# Moodify — Landing Page

> **Music that gets the moment.** Spotify knows _what_ you play. Moodify knows _why_.

A premium, no-auth marketing landing page for **Moodify (internal: Delulu FM)** — the
emotional-intelligence layer that sits on top of Spotify. Built to make a first-time
visitor understand the product's purpose, audience, value, workflow, and next action
**by scrolling alone** — no login, no signup, no onboarding.

---

## ✦ Stack

| Layer      | Choice                                                |
| ---------- | ----------------------------------------------------- |
| Framework  | **Next.js 14** (App Router) + **TypeScript**          |
| Styling    | **Tailwind CSS 3.4** + a small custom design system   |
| Motion     | **Framer Motion** (scroll reveals, micro-interactions)|
| 3D         | **Three.js** — GPU particle galaxy hero backdrop      |
| Fonts      | Playfair Display (display) · Inter (body) · Space Mono |

**Aesthetic:** _“Fuse”_ — the editorial / terminal structure of a design-tools store
(mono brackets, windowed UI, spec-tags) warmed into a music + emotion brand.
**Palette:** Midnight `#0A0A0F` · electric periwinkle `#6C5CE7` / glow `#8B7FFF` ·
ember accent `#FF5C38` · off-white `#EDEDF2`.

---

## ✦ Run it

```bash
npm install      # already done if you saw deps install
npm run dev      # http://localhost:3000
```

Production:

```bash
npm run build && npm run start
```

> Requires Node 18.17+ (you have v23 — good). No environment variables, no external
> services, no image assets — every visual is generated with CSS / SVG / WebGL, so it
> runs fully offline.

---

## ✦ Architecture

```
src/
├─ app/
│  ├─ layout.tsx        # fonts, SEO metadata, <html>/<body>, skip-link
│  ├─ page.tsx          # composes all sections (server component)
│  └─ globals.css       # design tokens, terminal chrome, grain, motion-safety
├─ lib/
│  └─ content.ts        # ALL copy in one place (single source of truth)
└─ components/
   ├─ GalaxyField.tsx   # Three.js cursor-reactive particle galaxy (client)
   ├─ Nav.tsx           # sticky nav + mobile sheet (client)
   ├─ Hero.tsx          # galaxy hero + "now playing / context engine" console
   ├─ MomentsStrip.tsx  # scrolling "moments" marquee
   ├─ Manifesto.tsx     # the thesis: one song, four meanings · Spotify vs Moodify
   ├─ HowItWorks.tsx    # 3-step flow (Connect → Context → Play)
   ├─ Benefits.tsx      # outcome-focused payoff grid
   ├─ Demo.tsx          # interactive: pick a moment → signals + queue (client)
   ├─ Features.tsx      # 6 capability cards
   ├─ Proof.tsx         # animated stats · testimonials · security strip
   ├─ Faq.tsx           # accordion (client)
   ├─ FinalCta.tsx      # conversion CTA + waitlist capture (client)
   ├─ Footer.tsx        # nav, legal, Spotify disclaimer
   └─ ui/               # primitives: TerminalWindow, Tag, SectionHeader, Reveal,
                        #   MoodArt, Equalizer, CountUp, Marquee, Background, Logo, icons
```

**Server vs client:** Section layout is rendered on the server (RSC). Only genuinely
interactive pieces (`"use client"`) ship JS — nav, hero, demo, FAQ, CTA, and the motion
primitives. The galaxy is `dynamic(..., { ssr: false })` so WebGL never touches the server.

### The galaxy (`GalaxyField.tsx`) — done like a pro, not a noob

- **GPU-driven:** all motion (differential rotation, shimmer, cursor repulsion) lives in
  the **vertex shader** via a `uTime` uniform + baked per-particle attributes. The CPU is
  idle, so ~26k particles hold 60fps.
- **Real cursor void:** the pointer is raycast onto the galaxy plane and fed to the shader
  as a world-space uniform; particles part _around_ it (the dark bubble in the reference).
- **Hygiene:** capped DPR (≤2), `ResizeObserver`, `IntersectionObserver` + tab-visibility
  pausing (no battery drain off-screen), graceful WebGL-unavailable bail, and **full
  disposal** of geometry / material / renderer on unmount.
- **Accessible:** `prefers-reduced-motion` renders a single static frame and attaches no
  listeners.

---

## ✦ Mandatory landing structure → mapped

| Required section        | Implementation                                              |
| ----------------------- | ----------------------------------------------------------- |
| Hero (above the fold)   | Value prop, sub-headline, dual CTA, live product console    |
| How it works (3 steps)  | Connect → Name the moment → Press play                      |
| Benefits                | Decision-fatigue, from-music-you-love, “gets you”, effortless |
| Product demonstration   | Hero console · interactive **Demo** · feature cards         |
| Trust & credibility     | **Proof**: stats, testimonials, security/data strip         |
| Features                | 6 visual cards with spec-tags                               |
| Final CTA               | “Start feeling understood” + waitlist                       |

Non-negotiable **“Just Start Playing”** appears in the nav, hero, and final CTA — the
product is never hidden behind auth.

---

## ✦ Accessibility & performance

- Semantic landmarks (`header`/`nav`/`main`/`section`/`footer`), single `h1`, ordered headings.
- Keyboard skip-link, visible focus rings, `aria-expanded`/`aria-pressed` on toggles.
- Global `prefers-reduced-motion` kill-switch (animations + marquee + galaxy + parallax).
- `next/font` self-hosting (no layout shift, no third-party font request).
- Zero image payload — CSS/SVG/WebGL visuals only.

---

## ✦ Testing strategy (recommended next)

- **Unit/Component:** Vitest + React Testing Library for `CountUp`, `Demo` state, `Faq`.
- **E2E/visual:** Playwright — assert hero renders, anchors scroll, FAQ toggles, CTA submits;
  add Percy/Playwright snapshots for the dark theme.
- **a11y:** `@axe-core/playwright` on the home route.
- **Lighthouse/CI:** budget for LCP < 2.5s, CLS ~0, and a WebGL-off fallback check.

## ✦ Deployment

- **Vercel** (zero-config for Next.js): push to GitHub → import → deploy. Preview per PR.
- Add a real OG image (`app/opengraph-image.tsx`) before launch.

## ✦ Future scaling

- Wire the CTA email to **Resend** or a **Supabase** edge function (currently stubbed).
- Add **PostHog** (analytics) + **Sentry** (monitoring) per the product stack.
- Promote `content.ts` to a CMS/MDX if marketing needs to edit copy without deploys.
- Localize via `next-intl` when expanding beyond English.

---

_Testimonials, metrics, and names on the page are illustrative placeholders for this
preview — replace with attributable data before launch._
