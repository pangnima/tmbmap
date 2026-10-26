import { ArrowLeft, Car, Globe, Heart, Map as MapIcon, Navigation, NotebookPen, Phone, Plus, Trash, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { fetchPlaceInfo, type DriveTimes, type PlaceInfo } from '../lib/api'
import { categoryFromKakao, type KakaoPlace } from '../lib/categories'
import { distanceM, formatDistance, formatDuration } from '../lib/geo'
import type { Category, Place } from '../lib/supabase'
import BlogReviews from './BlogReviews'
import { btn } from '../lib/ui'
import { AvatarStack, CategoryBadge } from './ui'

interface Point {
  lat: number
  lng: number
}

function directionsUrl(name: string, to: Point, base: Place | null) {
  const dest = `${encodeURIComponent(name)},${to.lat},${to.lng}`
  return base
    ? `https://map.kakao.com/link/from/${encodeURIComponent(base.name)},${base.lat},${base.lng}/to/${dest}`
    : `https://map.kakao.com/link/to/${dest}`
}

function Header({ category, label, title, address, onBack }: { category: Category; label?: string; title: string; address?: string | null; onBack: () => void }) {
  return (
    <>
      <div className="sticky top-0 z-10 flex items-center bg-white/90 px-4 py-2 backdrop-blur">
        <button onClick={onBack} className={`${btn.tonal} ${btn.sm} -ml-1`}>
          <ArrowLeft className="size-4" /> 목록
        </button>
      </div>
      <div className="flex flex-col gap-2 px-5 pt-1">
        <div>
          <CategoryBadge category={category} label={label} />
        </div>
        <h2 className="text-2xl leading-tight font-bold tracking-tight text-zinc-900">{title}</h2>
        {address && <p className="text-sm text-zinc-500">{address}</p>}
      </div>
    </>
  )
}

interface Action {
  icon: LucideIcon
  label: string
  href: string
  external?: boolean
}

function QuickActions({ actions }: { actions: Action[] }) {
  return (
    <div className="flex gap-2">
      {actions.map(({ icon: Icon, label, href, external }) => (
        <a
          key={label}
          href={href}
          {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
          className="flex h-16 flex-1 flex-col items-center justify-center gap-1 rounded-2xl bg-zinc-100 text-xs font-semibold text-zinc-700 transition-colors hover:bg-orange-50 hover:text-orange-600"
        >
          <Icon className="size-5" />
          {label}
        </a>
      ))}
    </div>
  )
}

function DistanceStats({ base, to, drive }: { base: Place; to: Point; drive?: { m: number; s: number } | null }) {
  const stats = [
    { label: '차로', value: drive ? formatDuration(drive.s) : '—', strong: true },
    { label: '도로 거리', value: drive ? formatDistance(drive.m) : '—' },
    { label: '직선거리', value: formatDistance(distanceM(base, to)) },
  ]
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        <Car className="size-3.5" /> {base.name}에서
      </div>
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-2xl px-3 py-2.5 ${s.strong ? 'bg-orange-50' : 'bg-zinc-50'}`}>
            <div className="text-[11px] text-zinc-500">{s.label}</div>
            <div className={`text-lg font-bold ${s.strong ? 'text-orange-600' : 'text-zinc-900'}`}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface Props {
  place: Place
  base: Place | null
  drive: DriveTimes | null
  voters: string[]
  voter: string | null
  region: string
  onLike: (placeId: string) => void
  onBack: () => void
  onUpdate: (id: string, patch: Partial<Place>) => void
  onDelete: (id: string) => void
}

export default function PlaceDetail({ place, base, drive, voters, voter, region, onLike, onBack, onUpdate, onDelete }: Props) {
  const [memo, setMemo] = useState(place.memo ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  // undefined = 불러오는 중, null = 사용 불가
  const [info, setInfo] = useState<PlaceInfo | null | undefined>(undefined)
  const isBase = base?.id === place.id
  const liked = !!voter && voters.includes(voter)
  // 여행 이름(예: 대부도)이 없으면 주소의 시/군 이름으로 검색 범위를 좁힌다
  const searchRegion = region || place.address?.split(' ')[1] || ''

  // 삭제 확인 상태는 잠시 후 자동 해제
  useEffect(() => {
    if (!confirmDelete) return
    const t = setTimeout(() => setConfirmDelete(false), 3000)
    return () => clearTimeout(t)
  }, [confirmDelete])

  useEffect(() => {
    let alive = true
    fetchPlaceInfo(place.name, searchRegion).then((r) => alive && setInfo(r))
    return () => {
      alive = false
    }
  }, [place.name, searchRegion])

  const actions: Action[] = [
    ...(place.phone ? [{ icon: Phone, label: '전화', href: `tel:${place.phone}` }] : []),
    { icon: Navigation, label: isBase || !base ? '길찾기' : '숙소에서 길찾기', href: directionsUrl(place.name, place, isBase ? null : base), external: true },
    ...(place.place_url ? [{ icon: MapIcon, label: '카카오맵', href: place.place_url, external: true }] : []),
    ...(info?.homepage ? [{ icon: Globe, label: '홈페이지', href: info.homepage, external: true }] : []),
  ]

  return (
    <div className="flex flex-col gap-5 pb-6">
      <Header category={place.category} title={place.name} address={place.address} onBack={onBack} />
      <div className="flex flex-col gap-5 px-5">
        <QuickActions actions={actions} />

        {base && !isBase && <DistanceStats base={base} to={place} drive={drive?.[place.id]} />}

        {!isBase && (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onLike(place.id)}
              aria-pressed={liked}
              className={`${btn.md} inline-flex w-full items-center justify-center gap-2 rounded-2xl font-bold transition-colors ${
                liked ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
              }`}
            >
              <Heart className="size-5" fill={liked ? 'currentColor' : 'none'} />
              가고 싶어요 {voters.length > 0 && voters.length}
            </button>
            {voters.length > 0 && (
              <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
                <AvatarStack names={voters} max={6} size={20} />
                {voters.join(', ')}
              </div>
            )}
          </div>
        )}

        <label className="flex flex-col gap-2">
          <span className="flex items-center gap-1.5 text-[15px] font-bold text-zinc-900">
            <NotebookPen className="size-4" /> 메모
          </span>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            onBlur={() => memo !== (place.memo ?? '') && onUpdate(place.id, { memo: memo.trim() || null })}
            placeholder="추천 메뉴, 영업시간 등을 적어두세요"
            rows={3}
            className="resize-none rounded-2xl bg-zinc-50 px-4 py-3 text-sm leading-relaxed text-zinc-800 outline-none placeholder:text-zinc-400 focus:bg-white focus:ring-2 focus:ring-orange-300"
          />
        </label>

        <BlogReviews info={info} query={`${searchRegion} ${place.name}`.trim()} />

        <button
          onClick={() => (confirmDelete ? onDelete(place.id) : setConfirmDelete(true))}
          className={`${btn.danger} ${btn.sm} self-center`}
        >
          <Trash className="size-4" />
          {confirmDelete ? '한 번 더 누르면 삭제됩니다' : '이 장소 삭제'}
        </button>
      </div>
    </div>
  )
}

export function CandidateDetail({ item, base, onBack, onSave }: { item: KakaoPlace; base: Place | null; onBack: () => void; onSave: (item: KakaoPlace) => void }) {
  const pos = { lat: Number(item.y), lng: Number(item.x) }
  const actions: Action[] = [
    ...(item.phone ? [{ icon: Phone, label: '전화', href: `tel:${item.phone}` }] : []),
    { icon: Navigation, label: base ? '숙소에서 길찾기' : '길찾기', href: directionsUrl(item.place_name, pos, base), external: true },
    ...(item.place_url ? [{ icon: MapIcon, label: '카카오맵', href: item.place_url, external: true }] : []),
  ]

  return (
    <div className="flex flex-col gap-5 pb-6">
      <Header
        category={categoryFromKakao(item.category_group_code)}
        label={item.category_name.split(' > ').slice(-1)[0]}
        title={item.place_name}
        address={item.road_address_name || item.address_name}
        onBack={onBack}
      />
      <div className="flex flex-col gap-5 px-5">
        <QuickActions actions={actions} />
        {base && <DistanceStats base={base} to={pos} />}
        <button onClick={() => onSave(item)} className={`${btn.primary} ${btn.md} w-full rounded-2xl`}>
          <Plus className="size-5" /> 내 지도에 저장
        </button>
      </div>
    </div>
  )
}
