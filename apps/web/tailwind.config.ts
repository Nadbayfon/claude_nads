import type { Config } from "tailwindcss";
import { preset } from "@crystal/ui/tailwind-preset";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [preset as Config],
};

export default config;
