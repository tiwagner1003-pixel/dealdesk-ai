export type SectorTemplate = {
  id: string;
  name: string;
  desc: string;
  wacc: number;
  terminal: number;
  exitMultiple: number;
  color: string;
  glyph: string;
};

export const SECTOR_TEMPLATES: SectorTemplate[] = [
  { id: "saas",    name: "SaaS / Software",     desc: "Rule of 40, gross margin >75%, mid-teens FCF margin",      wacc: 9.0,  terminal: 3.0, exitMultiple: 18, color: "#1e5bd8", glyph: "S" },
  { id: "fintech", name: "FinTech / Payments",  desc: "Net revenue take-rate, payment volume growth",             wacc: 9.5,  terminal: 3.0, exitMultiple: 16, color: "#0b1f3a", glyph: "F" },
  { id: "bank",    name: "Bank / Insurer",      desc: "Cost-of-equity, ROTE-driven valuation, capital intensive", wacc: 11.0, terminal: 2.5, exitMultiple: 10, color: "#057a55", glyph: "B" },
  { id: "energy",  name: "Energy / Oil & Gas",  desc: "Reserve-based, commodity-cycle stress, dividend yield",    wacc: 9.5,  terminal: 1.5, exitMultiple: 7,  color: "#b7791f", glyph: "E" },
  { id: "pharma",  name: "Pharma / Biotech",    desc: "Risk-adjusted NPV, patent cliff, pipeline build",          wacc: 8.5,  terminal: 2.0, exitMultiple: 14, color: "#b42318", glyph: "P" },
  { id: "lux",     name: "Luxury / Consumer",   desc: "Brand DCF, organic growth, gross margin defense",          wacc: 8.0,  terminal: 3.0, exitMultiple: 15, color: "#1748b5", glyph: "L" },
  { id: "indust",  name: "Industrial / Cap.G",  desc: "Backlog-driven, capex-heavy, mid-cycle margin",            wacc: 9.0,  terminal: 2.5, exitMultiple: 12, color: "#5a6573", glyph: "I" },
  { id: "ai",      name: "AI / Frontier Tech",  desc: "High burn early, growth-stage, optionality valuation",     wacc: 12.0, terminal: 4.0, exitMultiple: 22, color: "#1e5bd8", glyph: "A" },
];
