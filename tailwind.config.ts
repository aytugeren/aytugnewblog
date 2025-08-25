// tailwind.config.ts
import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography"; // opsiyonel ama blog için güzel

const config: Config = {
  // v4'te tuple şeklinde yazılır:
  darkMode: ["class", ".dark"],
theme: {
  extend: {
    keyframes: {
      fade: {
        "0%,100%": { opacity: 0 },
        "20%,80%": { opacity: 1 },
      },
    },
  animation: {
    pulse: "pulse 1s step-start infinite",
  },
  },
},
  plugins: [typography],
};

export default config;
