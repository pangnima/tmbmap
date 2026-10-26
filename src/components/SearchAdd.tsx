import { ArrowLeft, Search, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { CATEGORIES, CATEGORY_KEYS, categoryFromKakao, toNewPlace, type KakaoPlace } from '../lib/categories'
import type { Category, NewPlace, Trip } from '../lib/supabase'
import { btn } from '../lib/ui'
import { CategoryTile } from './ui'

interface Props {
  map: kakao.maps.Map | null
  trips: Trip[]
  tripId: string | null
  savedIds: Set<string>
  onSave: (place: NewPlace) => Promise<unknown>
  onClose: () => void
}

export default function SearchAdd({ map, trips, tripId, savedIds, onSave, onClose }: Props) {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<KakaoPlace[] | null>(null)
  const [chosen, setChosen] = useState<KakaoPlace | null>(null)
  const [category, setCategory] = useState<Category>('food')
  const [memo, setMemo] = useState('')
  const [targetTrip, setTargetTrip] = useState(tripId)
  const [saving, setSaving] = useState(false)

  const search = (e: FormEvent) => {
    e.preventDefault()
    if (!keyword.trim()) return
    // 현재 지도 중심을 기준으로 가까운 결과를 우선
    new kakao.maps.services.Places().keywordSearch(
      keyword,
      (data, status) => setResults(status === kakao.maps.services.Status.OK ? data : []),
      map ? { location: map.getCenter() } : undefined,
    )
  }

  const choose = (item: KakaoPlace) => {
    setChosen(item)
    setCategory(categoryFromKakao(item.category_group_code))
  }

  const save = async () => {
    if (!chosen) return
    setSaving(true)
    await onSave(toNewPlace(chosen, targetTrip, category, memo))
    setSaving(false)
    onClose()
  }

  const field = 'h-11 rounded-xl bg-zinc-100 px-3 text-[15px] outline-none placeholder:text-zinc-400 focus:bg-white focus:ring-2 focus:ring-orange-300'

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center" onClick={onClose}>
      <div
        className="flex max-h-[88%] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          {chosen ? (
            <button onClick={() => setChosen(null)} className={`${btn.tonal} ${btn.sm} -ml-1`}>
              <ArrowLeft className="size-4" /> 다시 검색
            </button>
          ) : (
            <h2 className="text-xl font-bold tracking-tight">장소 추가</h2>
          )}
          <button onClick={onClose} aria-label="닫기" className={`${btn.tonal} size-9 rounded-full`}>
            <X className="size-4" />
          </button>
        </div>

        {chosen ? (
          <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-5">
            <div className="flex items-center gap-3">
              <CategoryTile category={category} />
              <div className="min-w-0">
                <div className="truncate text-lg font-bold">{chosen.place_name}</div>
                <div className="truncate text-sm text-zinc-500">{chosen.road_address_name || chosen.address_name}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_KEYS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                  className={`h-9 rounded-full px-3.5 text-sm font-semibold transition-colors ${category === c ? 'text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                  style={category === c ? { backgroundColor: CATEGORIES[c].color } : undefined}
                >
                  {CATEGORIES[c].emoji} {CATEGORIES[c].label}
                </button>
              ))}
            </div>
            <select value={targetTrip ?? ''} onChange={(e) => setTargetTrip(e.target.value || null)} className={field}>
              <option value="">여행 미지정</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  ✈️ {t.name}
                </option>
              ))}
            </select>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="메모 (추천 메뉴, 영업시간 등)"
              rows={3}
              className={`${field} h-auto resize-none py-3`}
            />
            <button onClick={save} disabled={saving} className={`${btn.primary} ${btn.md} w-full rounded-2xl`}>
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={search} className="flex gap-2 px-5 pb-4">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                <input
                  autoFocus
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="가게 이름, 지역 + 메뉴 (예: 성수 파스타)"
                  className={`${field} w-full pl-9`}
                />
              </div>
              <button className={`${btn.primary} ${btn.md}`}>검색</button>
            </form>
            <ul className="flex flex-col gap-1 overflow-y-auto px-3 pb-4">
              {results?.length === 0 && <li className="px-4 py-8 text-center text-sm text-zinc-500">검색 결과가 없어요</li>}
              {results?.map((r) => {
                const saved = savedIds.has(r.id)
                return (
                  <li key={r.id}>
                    <button
                      disabled={saved}
                      onClick={() => choose(r)}
                      className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors hover:bg-zinc-50 disabled:opacity-50"
                    >
                      <CategoryTile category={categoryFromKakao(r.category_group_code)} size={40} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate font-semibold">{r.place_name}</span>
                          {saved && <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-500">저장됨</span>}
                        </span>
                        <span className="block truncate text-xs text-zinc-500">
                          {r.category_name.split(' > ').slice(-1)[0]} · {r.road_address_name || r.address_name}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
