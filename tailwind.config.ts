// tailwind.config.ts
import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography"; // opsiyonel ama blog için güzel

const config: Config = {
  // v4'te tuple şeklinde yazılır:
  darkMode: ["class", ".dark"],
  theme: { extend: {} },
  // v4'te content alanı gerekmiyor, çıkarabiliriz
  plugins: [typography],
};

export default config;
