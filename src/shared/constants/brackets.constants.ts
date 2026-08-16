/** Arena brackets — shared by the router and both domains. */

export type Bracket = "1v1" | "2v2" | "3v3"

export interface BracketMeta {
  id: Bracket
  label: string
  teamSize: number
}

export const BRACKETS = [
  { id: "1v1", label: "1v1", teamSize: 1 },
  { id: "2v2", label: "2v2", teamSize: 2 },
  { id: "3v3", label: "3v3", teamSize: 3 },
] as const satisfies readonly BracketMeta[]

export const DEFAULT_BRACKET: Bracket = "1v1"

export function isBracket(value: string): value is Bracket {
  return value === "1v1" || value === "2v2" || value === "3v3"
}
