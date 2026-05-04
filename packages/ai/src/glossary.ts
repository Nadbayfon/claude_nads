export type Locale = "en" | "ca" | "es";

export const glossary: Record<string, Record<Exclude<Locale, "en">, string>> = {
  "wedding planner":  { ca: "wedding planner",        es: "wedding planner" },
  "welcome dinner":   { ca: "sopar de benvinguda",    es: "cena de bienvenida" },
  "provider proposal":{ ca: "pressupost del proveïdor", es: "presupuesto del proveedor" },
  "payment milestone":{ ca: "fita de pagament",        es: "hito de pago" },
  "VAT":              { ca: "IVA",                     es: "IVA" },
  "wedding day":      { ca: "dia de la boda",          es: "día de la boda" },
  "site visit":       { ca: "visita al lloc",          es: "visita al lugar" },
  "open bar":         { ca: "barra lliure",            es: "barra libre" },
  "florist":          { ca: "florista",                es: "floristería" },
  "photographer":     { ca: "fotògraf",                es: "fotógrafo" },
  "videographer":     { ca: "videògraf",               es: "videógrafo" },
  "catering":         { ca: "càtering",                es: "catering" },
};
