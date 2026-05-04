export const tokens = {
  charcoal: "#2C2825",
  gold: "#C9A96E",
  goldDark: "#7A6A3D",
  goldAccent: "#8B6914",
  goldTint: "#E8D5B0",
  cream: "#F5F0E8",
  paper: "#FAF7F2",
  white: "#FFFFFF",
  muted: "#9B9590",
  mutedSoft: "#E0D8CC",
  okGreen: "#3D7A52",
  okBg: "#EAF4EE",
  errorRed: "#B84040",
  errorBg: "#FAF0F0",
  infoBlue: "#5A6A8A",
  infoBg: "#EEF1F8",
  amberFlag: "#E8D5B0",
} as const;

export type Token = keyof typeof tokens;

export const sectionColours = {
  pre_setup: { fill: "#E8D5B0", text: "#2C2825" },
  welcome: { fill: "#F5F0E8", text: "#2C2825" },
  haldi: { fill: "#FAF5E4", text: "#2C2825" },
  mehendi: { fill: "#F5F0E8", text: "#2C2825" },
  sangeet: { fill: "#EEF1F8", text: "#2C2825" },
  ceremony: { fill: "#C9A96E", text: "#FFFFFF" },
  cocktail: { fill: "#F5F0E8", text: "#2C2825" },
  reception: { fill: "#2C2825", text: "#FFFFFF" },
  late_night: { fill: "#1A1A1A", text: "#FFFFFF" },
  brunch: { fill: "#FAF7F2", text: "#2C2825" },
} as const;

export const fonts = {
  ui: "'Inter', system-ui, sans-serif",
  display: "'Crimson Pro', Georgia, serif",
  legacyExport: "'Georgia', serif",
} as const;
