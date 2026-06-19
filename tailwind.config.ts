import type { Config } from "tailwindcss";

/**
 * Moodify design system.
 * "Fuse" aesthetic: editorial/terminal structure (mono brackets, windowed UI)
 * warmed into a music/emotion brand. Midnight + electric periwinkle palette.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Canvas / surfaces (near-black, layered)
        ink: {
          DEFAULT: "#0A0A0F", // page canvas
          800: "#0D0D14",
          700: "#101018", // raised surface
          600: "#14141E", // cards
          500: "#1A1A26", // inset / inputs
          400: "#23232F", // hover surface
        },
        // Brand — electric periwinkle
        brand: {
          DEFAULT: "#6C5CE7",
          light: "#8B7FFF", // glow
          lighter: "#A99CFF",
          dark: "#5A4BD4",
          deep: "#4636B8",
        },
        // Accent — dither ember
        ember: {
          DEFAULT: "#FF5C38",
          light: "#FF7A59",
          soft: "#FF9B7E",
        },
        // Text
        paper: {
          DEFAULT: "#EDEDF2", // primary text
          dim: "#B7B7C6", // secondary
          mute: "#7C7C8C", // tertiary / captions
          faint: "#54545F", // disabled / hairline labels
        },
        line: {
          DEFAULT: "rgba(255,255,255,0.08)",
          strong: "rgba(255,255,255,0.14)",
          brand: "rgba(108,92,231,0.35)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "Space Mono", "ui-monospace", "monospace"],
      },
      fontSize: {
        // Fluid display sizes
        "display-sm": ["clamp(2.4rem, 6vw, 3.6rem)", { lineHeight: "0.98", letterSpacing: "-0.02em" }],
        "display": ["clamp(3rem, 9vw, 6rem)", { lineHeight: "0.95", letterSpacing: "-0.025em" }],
        "display-lg": ["clamp(3.4rem, 11vw, 8rem)", { lineHeight: "0.92", letterSpacing: "-0.03em" }],
      },
      letterSpacing: {
        label: "0.22em",
        wide2: "0.32em",
      },
      maxWidth: {
        container: "1240px",
        prose2: "62ch",
      },
      borderRadius: {
        win: "14px",
        card: "18px",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(108,92,231,0.30), 0 18px 60px -18px rgba(108,92,231,0.55)",
        "glow-lg": "0 0 0 1px rgba(108,92,231,0.35), 0 30px 90px -20px rgba(108,92,231,0.6)",
        ember: "0 0 0 1px rgba(255,92,56,0.30), 0 18px 60px -18px rgba(255,92,56,0.5)",
        win: "0 30px 80px -30px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06)",
        inset: "inset 0 1px 0 0 rgba(255,255,255,0.05)",
      },
      backgroundImage: {
        "grid-dots":
          "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
        "brand-radial":
          "radial-gradient(60% 60% at 50% 0%, rgba(108,92,231,0.28) 0%, rgba(108,92,231,0) 70%)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "marquee-rev": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
        eq: {
          "0%,100%": { transform: "scaleY(0.35)" },
          "50%": { transform: "scaleY(1)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-soft": {
          "0%,100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        blink: {
          "0%,49%": { opacity: "1" },
          "50%,100%": { opacity: "0" },
        },
        "scan": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      animation: {
        marquee: "marquee var(--marquee-duration,40s) linear infinite",
        "marquee-rev": "marquee-rev var(--marquee-duration,40s) linear infinite",
        float: "float 6s ease-in-out infinite",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
        "spin-slow": "spin-slow 22s linear infinite",
        blink: "blink 1.1s step-end infinite",
      },
    },
  },
  plugins: [],
};

export default config;
