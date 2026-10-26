import { CATEGORIES } from '../lib/categories'
import { initialColor } from '../lib/format'
import type { Category } from '../lib/supabase'

export function Avatar({ name, size = 24 }: { name: string; size?: number }) {
  return (
    <span
      title={name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ring-2 ring-white ${initialColor(name)}`}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {name.slice(0, 1)}
    </span>
  )
}

// 겹쳐 보이는 투표자 아바타 (최대 max명, 나머지는 +n)
export function AvatarStack({ names, max = 4, size = 22 }: { names: string[]; max?: number; size?: number }) {
  if (names.length === 0) return null
  return (
    <span className="flex items-center">
      {names.slice(0, max).map((n, i) => (
        <span key={n} className={i ? '-ml-1.5' : ''}>
          <Avatar name={n} size={size} />
        </span>
      ))}
      {names.length > max && <span className="ml-1 text-xs font-medium text-zinc-500">+{names.length - max}</span>}
    </span>
  )
}

export function CategoryTile({ category, size = 48 }: { category: Category; size?: number }) {
  const c = CATEGORIES[category]
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-2xl"
      style={{ width: size, height: size, backgroundColor: `${c.color}1a`, fontSize: size * 0.46 }}
    >
      {c.emoji}
    </span>
  )
}

export function CategoryBadge({ category, label }: { category: Category; label?: string }) {
  const c = CATEGORIES[category]
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: `${c.color}1a`, color: c.color }}>
      {c.emoji} {label ?? c.label}
    </span>
  )
}
