const CRITERIA = [
  { test: (p: string) => p.length >= 8 },
  { test: (p: string) => /[A-ZА-ЯЁ]/.test(p) },
  { test: (p: string) => /[a-zа-яё]/.test(p) },
  { test: (p: string) => /[0-9]/.test(p) },
  { test: (p: string) => /[^A-Za-zА-ЯЁа-яё0-9\s]/.test(p) },
  { test: (p: string) => !/\s/.test(p) },
]

export function validatePassword(password: string): boolean {
  return password.length >= 8 && CRITERIA.every((c) => c.test(password))
}
