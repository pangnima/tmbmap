import { Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { CATEGORIES, CATEGORY_KEYS } from '../lib/categories'
import { btn } from '../lib/ui'
import type { Category, Trip } from '../lib/supabase'

interface Props {
  trips: Trip[]
  tripId: string | null
  onTripChange: (id: string | null) => void
  onAddTrip: (name: string) => void
  enabled: Set<Category>
  counts: Record<Category, number>
  onToggle: (c: Category) => void
  onSearch: () => void
}

export default function TopBar({ trips, tripId, onTripChange, onAddTrip, enabled, counts, onToggle, onSearch }: Props) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (name.trim()) onAddTrip(name.trim())
    setName('')
    setAdding(false)
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-2 p-3">
      <div className="pointer-events-auto flex gap-2">
        {adding ? (
          <form onSubmit={submit} className="flex flex-1 gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="여행 이름 (예: 제주 11월)"
              className="h-11 min-w-0 flex-1 rounded-xl bg-white px-3 shadow-md ring-1 ring-black/5 outline-none focus:ring-2 focus:ring-orange-300"
            />
            <button className={`${btn.primary} ${btn.md} shadow-md`}>추가</button>
            <button type="button" onClick={() => setAdding(false)} className={`${btn.tonal} ${btn.md} bg-white shadow-md`}>
              취소
            </button>
          </form>
        ) : (
          <>
            <select
              value={tripId ?? ''}
              onChange={(e) => (e.target.value === '+' ? setAdding(true) : onTripChange(e.target.value || null))}
              className="h-11 min-w-0 flex-1 rounded-xl bg-white px-3 font-semibold text-zinc-900 shadow-md ring-1 ring-black/5 outline-none"
            >
              <option value="">🗺️ 전체 보기</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  ✈️ {t.name}
                </option>
              ))}
              <option value="+">＋ 새 여행 만들기</option>
            </select>
            <button onClick={onSearch} className={`${btn.primary} ${btn.md} shadow-md`}>
              <Plus className="size-4" strokeWidth={2.5} /> 장소
            </button>
          </>
        )}
      </div>

      <div className="pointer-events-auto flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        {CATEGORY_KEYS.map((c) => {
          const on = enabled.has(c)
          return (
            <button
              key={c}
              onClick={() => onToggle(c)}
              aria-pressed={on}
              className={`h-8 shrink-0 rounded-full px-3 text-sm font-semibold shadow-sm ring-1 ring-black/5 transition-colors ${on ? '' : 'bg-white/75 text-zinc-400'}`}
              // 켜진 칩은 카테고리 색을 연하게 채운다 (지도 위에서도 잘 보이도록 불투명하게)
              style={on ? { backgroundColor: `color-mix(in srgb, ${CATEGORIES[c].color} 14%, white)`, color: CATEGORIES[c].color } : undefined}
            >
              {CATEGORIES[c].emoji} {CATEGORIES[c].label} {counts[c] > 0 && <span className="opacity-60">{counts[c]}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
