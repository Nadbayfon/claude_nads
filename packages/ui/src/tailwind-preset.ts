import type { Config } from "tailwindcss";
import { tokens, fonts } from "./tokens";

export const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        charcoal: tokens.charcoal,
        gold: tokens.gold,
        "gold-dark": tokens.goldDark,
        "gold-accent": tokens.goldAccent,
        "gold-tint": tokens.goldTint,
        cream: tokens.cream,
        paper: tokens.paper,
        muted: tokens.muted,
        "muted-soft": tokens.mutedSoft,
        "ok-green": tokens.okGreen,
        "ok-bg": tokens.okBg,
        "error-red": tokens.errorRed,
        "error-bg": tokens.errorBg,
        "info-blue": tokens.infoBlue,
        "info-bg": tokens.infoBg,
        "amber-flag": tokens.amberFlag,
      },
      fontFamily: {
        sans: [fonts.ui],
        display: [fonts.display],
      },
    },
  },
};
