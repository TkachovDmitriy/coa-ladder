/**
 * Conquest of Azeroth class colors — used for table badges and chart accents.
 * Color reinforces the class name; it never carries meaning alone (the label
 * is always present), so near-duplicate hues across 20 classes are acceptable.
 */

// Class colors matched to the official ascensionlogs class palette.
export const CLASS_COLORS: Record<string, string> = {
  Barbarian: "#b06322",
  Bloodmage: "#9e1b1b",
  Chronomancer: "#f5e24f",
  Cultist: "#b44ae0",
  Felsworn: "#7ed721",
  Guardian: "#b3ab93",
  "Knight of Xoroth": "#fb2b2b",
  Necromancer: "#40d9a0",
  Primalist: "#dfa878",
  Pyromancer: "#f56f1a",
  Ranger: "#c6e155",
  Reaper: "#34b389",
  Runemaster: "#3fc7e4",
  Starcaller: "#59d4e6",
  "Sun Cleric": "#f2a53c",
  Templar: "#f2eea0",
  Tinker: "#e9e9ea",
  Venomancer: "#8ec73f",
  "Witch Doctor": "#ec42d6",
  "Witch Hunter": "#6a52e6",
  Stormbringer: "#2f8ff0",
}

export const UNKNOWN_CLASS_COLOR = "#6b7280"

export function classColor(className: string | null): string {
  if (!className) return UNKNOWN_CLASS_COLOR
  return CLASS_COLORS[className] ?? UNKNOWN_CLASS_COLOR
}

/**
 * Class icons live in public/classes/{slug}.jpg, where slug is the class name
 * lowercased with non-letters stripped (e.g. "Sun Cleric" -> "suncleric").
 */
function iconSlug(className: string): string {
  return className.toLowerCase().replace(/[^a-z]/g, "")
}

export function classIcon(className: string | null): string | null {
  if (!className) return null
  return `${import.meta.env.BASE_URL}classes/${iconSlug(className)}.jpg`
}
