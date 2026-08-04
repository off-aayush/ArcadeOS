import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      colors: {
        // ArcadeOS Design System — Dark Gaming Palette
        brand: {
          DEFAULT: "hsl(262, 83%, 58%)",    // primary purple
          50:  "hsl(262, 100%, 97%)",
          100: "hsl(262, 100%, 93%)",
          200: "hsl(262, 100%, 85%)",
          300: "hsl(262, 90%, 75%)",
          400: "hsl(262, 85%, 65%)",
          500: "hsl(262, 83%, 58%)",        // DEFAULT
          600: "hsl(262, 80%, 50%)",
          700: "hsl(262, 78%, 42%)",
          800: "hsl(262, 75%, 34%)",
          900: "hsl(262, 72%, 26%)",
          950: "hsl(262, 70%, 15%)",
        },
        accent: {
          DEFAULT: "hsl(195, 100%, 50%)",   // cyan accent
          50:  "hsl(195, 100%, 97%)",
          400: "hsl(195, 100%, 60%)",
          500: "hsl(195, 100%, 50%)",
          600: "hsl(195, 100%, 40%)",
        },
        success: {
          DEFAULT: "hsl(142, 71%, 45%)",
          dark:    "hsl(142, 71%, 30%)",
        },
        warning: {
          DEFAULT: "hsl(38, 92%, 50%)",
          dark:    "hsl(38, 92%, 35%)",
        },
        danger: {
          DEFAULT: "hsl(0, 84%, 60%)",
          dark:    "hsl(0, 84%, 40%)",
        },
        surface: {
          DEFAULT: "hsl(230, 15%, 10%)",   // page bg
          card:    "hsl(230, 13%, 13%)",   // card bg
          hover:   "hsl(230, 13%, 16%)",   // hover state
          border:  "hsl(230, 13%, 20%)",   // border
          muted:   "hsl(230, 10%, 40%)",   // muted text
        },
      },
      backgroundImage: {
        "gradient-radial":  "radial-gradient(var(--tw-gradient-stops))",
        "gradient-brand":   "linear-gradient(135deg, hsl(262,83%,58%), hsl(195,100%,50%))",
        "gradient-surface": "linear-gradient(180deg, hsl(230,15%,12%), hsl(230,15%,8%))",
      },
      boxShadow: {
        "glow-brand":   "0 0 20px -5px hsl(262,83%,58%,0.5)",
        "glow-success": "0 0 20px -5px hsl(142,71%,45%,0.4)",
        "glow-danger":  "0 0 20px -5px hsl(0,84%,60%,0.4)",
        "glow-accent":  "0 0 20px -5px hsl(195,100%,50%,0.4)",
        card: "0 4px 24px rgba(0,0,0,0.4)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      animation: {
        "pulse-slow":    "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "spin-slow":     "spin 3s linear infinite",
        "fade-in":       "fadeIn 0.3s ease-out",
        "slide-up":      "slideUp 0.3s ease-out",
        "scale-in":      "scaleIn 0.2s ease-out",
        "glow-pulse":    "glowPulse 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.6" },
        },
      },
    },
  },
  plugins: [forms],
};

export default config;
