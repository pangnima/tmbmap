// 네이버 블로그 postdate(YYYYMMDD) → "오늘", "5일 전", "3주 전", "2026.03.14"
export function relativeDate(yyyymmdd: string) {
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(yyyymmdd)
  if (!m) return yyyymmdd
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000)
  if (days <= 0) return '오늘'
  if (days < 7) return `${days}일 전`
  if (days < 30) return `${Math.floor(days / 7)}주 전`
  if (days < 365) return `${Math.floor(days / 30)}개월 전`
  return `${m[1]}.${m[2]}.${m[3]}`
}

const AVATAR_COLORS = [
  'bg-orange-100 text-orange-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
]

// 같은 이름은 항상 같은 색
export function initialColor(name: string) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}
