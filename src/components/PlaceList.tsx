import { Car, Heart, MapPin, Plus, User } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { DriveTimes } from '../lib/api'
import { CATEGORIES, CATEGORY_KEYS } from '../lib/categories'
import { distanceM, formatDistance, formatDuration } from '../lib/geo'
import type { Place } from '../lib/supabase'
import { btn } from '../lib/ui'
import { AvatarStack, CategoryTile } from './ui'

type Sort = 'like' | 'distance' | 'recent'
const MEDALS = ['🥇', '🥈', '🥉']

interface Props {
  places: Place[]
  base: Place | null
  drive: DriveTimes | null
  votersOf: Map<string, string[]>
  voter: string | null
  title: string
  hint?: string
  open: boolean
  onToggleOpen: () => void
  onEditName: () => void
  onLike: (placeId: string) => void
  onSelect: (id: string) => void
  onAdd: () => void
}

export default function PlaceList({ places, base, drive, votersOf, voter, title, hint, open, onToggleOpen, onEditName, onLike, onSelect, onAdd }: Props) {
  const [sort, setSort] = useState<Sort>('like')

  // 도로 거리(있으면) 또는 직선거리(m). 숙소 자신은 맨 뒤
  const distOf = (p: Place) => (base && p.id !== base.id ? (drive?.[p.id]?.m ?? distanceM(base, p)) : Infinity)

  const sorted = useMemo(() => {
    const list = [...places]
    const likeCount = (p: Place) => votersOf.get(p.id)?.length ?? 0
    if (sort === 'like') list.sort((a, b) => likeCount(b) - likeCount(a) || distOf(a) - distOf(b))
    else if (sort === 'distance') list.sort((a, b) => distOf(a) - distOf(b))
    else list.sort((a, b) => b.created_at.localeCompare(a.created_at))
    return list
    // distOf는 base·drive에서 파생
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [places, sort, votersOf, base, drive])

  const summary = CATEGORY_KEYS.map((c) => [c, places.filter((p) => p.category === c).length] as const).filter(([, n]) => n > 0)
  const sorts: [Sort, string][] = [
    ['like', '추천순'],
    ...(base ? [['distance', '가까운 순'] as [Sort, string]] : []),
    ['recent', '최신등록순'],
  ]

  return (
    <>
      {/* 모바일에서는 헤더를 눌러 목록을 펼치고 접는다 */}
      <div onClick={onToggleOpen} className="flex cursor-pointer items-start justify-between gap-3 px-5 pt-3 pb-3 md:cursor-default md:pt-5">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-bold tracking-tight text-zinc-900 md:text-2xl">{title}</h2>
          <p className="mt-0.5 truncate text-[13px] text-zinc-500">
            {summary.length === 0 ? '아직 저장한 장소가 없어요' : summary.map(([c, n]) => `${CATEGORIES[c].label} ${n}`).join(' · ')}
            {base && <span className="text-violet-600"> · 🏨 {base.name} 기준</span>}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEditName()
          }}
          className={`${btn.tonal} ${btn.sm} max-w-36 shrink-0 rounded-full`}
        >
          <User className="size-4" />
          <span className="truncate">{voter ?? '이름 설정'}</span>
        </button>
      </div>

      {hint && <div className="mx-5 mb-3 rounded-xl bg-violet-50 px-3 py-2 text-xs text-violet-700">{hint}</div>}

      <div className={`${open ? 'flex' : 'hidden'} min-h-0 flex-1 flex-col md:flex`}>
        {places.length > 0 && (
          <div className="px-5 pb-3">
            <div className="flex rounded-xl bg-zinc-100 p-1">
              {sorts.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSort(key)}
                  className={`flex-1 rounded-lg py-1.5 text-sm font-semibold transition ${sort === key ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <ul className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto bg-zinc-50/70 px-4 py-3 md:px-5">
          {places.length === 0 && (
            <li className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-10 text-center ring-1 ring-zinc-100">
              <MapPin className="size-8 text-orange-400" />
              <p className="text-sm text-zinc-500">
                가고 싶은 곳을 검색해서 추가하거나
                <br />
                지도에서 '이 지역 둘러보기'를 눌러보세요
              </p>
              <button onClick={onAdd} className={`${btn.primary} ${btn.md}`}>
                <Plus className="size-4" /> 장소 추가
              </button>
            </li>
          )}

          {sorted.map((p, i) => {
            const voters = votersOf.get(p.id) ?? []
            const liked = !!voter && voters.includes(voter)
            const medal = sort === 'like' && voters.length > 0 ? MEDALS[i] : undefined
            const d = drive?.[p.id]
            return (
              <li key={p.id} className="flex items-center gap-1 rounded-2xl bg-white shadow-sm ring-1 ring-zinc-100 transition hover:shadow-md hover:ring-zinc-200">
                <button onClick={() => onSelect(p.id)} className="flex min-w-0 flex-1 items-center gap-3.5 p-3.5 text-left">
                  <span className="relative">
                    <CategoryTile category={p.category} />
                    {medal && <span className="absolute -top-2 -left-2 text-lg drop-shadow">{medal}</span>}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-[15px] font-bold text-zinc-900">{p.name}</span>
                    <span className="flex items-center gap-1 truncate text-[13px] text-zinc-500">
                      {CATEGORIES[p.category].label}
                      {base && p.id === base.id && <span className="font-semibold text-violet-600">· 기준 숙소</span>}
                      {base && p.id !== base.id && (
                        <>
                          <span>·</span>
                          {d ? (
                            <>
                              <Car className="size-3.5 shrink-0" />
                              <span className="font-semibold text-orange-600">{formatDuration(d.s)}</span>
                              <span>· {formatDistance(d.m)}</span>
                            </>
                          ) : (
                            <span>직선 {formatDistance(distanceM(base, p))}</span>
                          )}
                        </>
                      )}
                    </span>
                    {p.memo && <span className="truncate text-xs text-zinc-400">{p.memo}</span>}
                    {voters.length > 0 && (
                      <span className="mt-1">
                        <AvatarStack names={voters} />
                      </span>
                    )}
                  </span>
                </button>
                {!(base && p.id === base.id) && (
                  <button
                    onClick={() => onLike(p.id)}
                    aria-pressed={liked}
                    aria-label="가고 싶어요"
                    className={`mr-3.5 inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-sm font-bold transition-colors ${
                      liked ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-zinc-100 text-zinc-500 hover:bg-rose-50 hover:text-rose-500'
                    }`}
                  >
                    <Heart className="size-4" fill={liked ? 'currentColor' : 'none'} />
                    {voters.length}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </>
  )
}
