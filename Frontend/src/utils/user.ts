export function getUserInitials(fullName?: string): string {
  if (!fullName || typeof fullName !== "string") return "U"
  const initials = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
  return initials || "U"
}