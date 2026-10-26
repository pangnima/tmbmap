import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useKakaoLoader } from 'react-kakao-maps-sdk'
import ExploreButton from './components/ExploreButton'
import MapView from './components/MapView'
import PlaceSheet from './components/PlaceSheet'
import SearchAdd from './components/SearchAdd'
import TopBar from './components/TopBar'
import { usePlaces } from './hooks/usePlaces'
import { fetchDriveTimes, type DriveTimes } from './lib/api'
import { CATEGORY_KEYS, toNewPlace, type KakaoPlace } from './lib/categories'
import { supabaseConfigured, type Category } from './lib/supabase'

const KAKAO_KEY = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined
const VOTER_KEY = 'voter'
const TRIP_KEY = 'trip'

// 브라우저 저장소가 막힌 환경(사생활 보호 모드 등)에서도 앱이 멈추지 않도록 감싼다
const storage = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k)
    } catch {
      return null
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v)
    } catch {
      /* 저장 실패는 무시 */
    }
  },
}

export default function App() {
  if (!KAKAO_KEY || !supabaseConfigured) {
    return (
      <Notice>
        <code>.env.local</code> 파일에 <code>VITE_KAKAO_JS_KEY</code>, <code>VITE_SUPABASE_URL</code>, <code>VITE_SUPABASE_ANON_KEY</code>를 설정한 뒤
        개발 서버를 다시 시작하세요. (<code>.env.example</code> 참고)
      </Notice>
    )
  }
  return <MapApp appkey={KAKAO_KEY} />
}

function MapApp({ appkey }: { appkey: string }) {
  const [kakaoLoading, kakaoError] = useKakaoLoader({ appkey, libraries: ['services', 'clusterer'] })
  const { trips, places, likes, loading, error, setError, addTrip, addPlace, updatePlace, deletePlace, toggleLike } = usePlaces()

  const [map, setMap] = useState<kakao.maps.Map | null>(null)
  const [level, setLevel] = useState(8)
  // 여행 선택: ?trip=<id> 링크 → 마지막으로 본 여행 → 가장 최근 여행 순으로 기본값을 정한다
  // undefined = 아직 고르지 않음, null = '전체 보기'를 직접 고름
  const [tripChoice, setTripChoice] = useState<string | null | undefined>(() => {
    const fromUrl = new URLSearchParams(location.search).get('trip')
    if (fromUrl) return fromUrl
    const saved = storage.get(TRIP_KEY)
    return saved === null ? undefined : saved || null
  })
  const [voter, setVoter] = useState<string | null>(() => storage.get(VOTER_KEY))
  const [drive, setDrive] = useState<{ baseId: string; times: DriveTimes } | null>(null)
  const [enabled, setEnabled] = useState<Set<Category>>(() => new Set(CATEGORY_KEYS))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<KakaoPlace[]>([])
  const [searchOpen, setSearchOpen] = useState(false)

  const choiceMissing = !!tripChoice && !loading && !trips.some((t) => t.id === tripChoice)
  const tripId = tripChoice === undefined || choiceMissing ? (trips.at(-1)?.id ?? null) : tripChoice
  const setTripId = (id: string | null) => {
    setTripChoice(id)
    storage.set(TRIP_KEY, id ?? '')
  }

  const tripPlaces = useMemo(() => (tripId ? places.filter((p) => p.trip_id === tripId) : places), [places, tripId])
  const visible = useMemo(() => tripPlaces.filter((p) => enabled.has(p.category)), [tripPlaces, enabled])
  const savedIds = useMemo(() => new Set(places.map((p) => p.kakao_place_id).filter((id): id is string => !!id)), [places])
  const counts = useMemo(() => {
    const c = Object.fromEntries(CATEGORY_KEYS.map((k) => [k, 0])) as Record<Category, number>
    tripPlaces.forEach((p) => c[p.category]++)
    return c
  }, [tripPlaces])

  const selectedPlace = places.find((p) => p.id === selectedId) ?? null
  const selectedCandidate = candidates.find((c) => c.id === selectedId) ?? null

  // 거리 기준 숙소: 선택한 여행의 첫 번째 숙소
  const base = useMemo(() => (tripId ? (tripPlaces.find((p) => p.category === 'stay') ?? null) : null), [tripId, tripPlaces])
  const tripName = trips.find((t) => t.id === tripId)?.name ?? ''

  const selectedPos = selectedPlace ?? (selectedCandidate && { lat: Number(selectedCandidate.y), lng: Number(selectedCandidate.x) })
  const route = base && selectedPos && selectedPlace?.id !== base.id ? [base, selectedPos] : null

  // 공유하기 쉽도록 선택한 여행을 주소에 반영
  useEffect(() => {
    const url = new URL(location.href)
    if (tripId) url.searchParams.set('trip', tripId)
    else url.searchParams.delete('trip')
    history.replaceState(null, '', url)
  }, [tripId])

  // 숙소 → 각 장소 차량 거리·시간 (서버 키가 없으면 null이라 직선거리만 표시)
  const destKey = tripPlaces.map((p) => p.id).join()
  useEffect(() => {
    if (!base) return
    const dests = tripPlaces.filter((p) => p.id !== base.id).slice(0, 30)
    let alive = true
    fetchDriveTimes(base, dests.map(({ id, lat, lng }) => ({ id, lat, lng }))).then((times) => {
      if (alive && times) setDrive({ baseId: base.id, times })
    })
    return () => {
      alive = false
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [base?.id, destKey])
  const driveTimes = base && drive?.baseId === base.id ? drive.times : null

  // 여행을 바꾸거나 처음 로드되면 해당 장소들이 모두 보이도록 지도 범위를 맞춘다
  useEffect(() => {
    if (!map || loading || tripPlaces.length === 0) return
    if (tripPlaces.length === 1) {
      map.setLevel(4)
      map.setCenter(new kakao.maps.LatLng(tripPlaces[0].lat, tripPlaces[0].lng))
    } else {
      const bounds = new kakao.maps.LatLngBounds()
      tripPlaces.forEach((p) => bounds.extend(new kakao.maps.LatLng(p.lat, p.lng)))
      // 위: 검색바·칩, 아래: 모바일 하단 시트 미리보기 높이
      map.setBounds(bounds, 140, 40, window.innerWidth >= 768 ? 40 : 120, 40)
    }
    // 장소를 추가할 때마다 범위가 바뀌지 않도록 tripId·로딩 변화에만 반응
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [map, tripId, loading])

  // 지도 영역 크기가 바뀌면(창 크기 변경, PC↔모바일 전환) 카카오 지도를 다시 그린다
  const mapColRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = mapColRef.current
    if (!map || !el) return
    const ro = new ResizeObserver(() => map.relayout())
    ro.observe(el)
    return () => ro.disconnect()
  }, [map])

  const select = (id: string | null) => {
    setSelectedId(id)
    const target = places.find((p) => p.id === id) ?? candidates.find((c) => c.id === id)
    if (!map || !target) return
    const [lat, lng] = 'lat' in target ? [target.lat, target.lng] : [Number(target.y), Number(target.x)]
    map.panTo(new kakao.maps.LatLng(lat, lng))
  }

  const toggleCategory = (c: Category) =>
    setEnabled((prev) => {
      const next = new Set(prev)
      if (next.has(c)) next.delete(c)
      else next.add(c)
      return next
    })

  const handleAddTrip = async (name: string) => {
    const trip = await addTrip(name)
    if (trip) setTripId(trip.id)
  }

  const saveCandidate = async (item: KakaoPlace) => {
    const saved = await addPlace(toNewPlace(item, tripId))
    if (!saved) return
    setCandidates((prev) => prev.filter((c) => c.id !== item.id))
    setSelectedId(saved.id)
  }

  if (kakaoError) return <Notice>카카오 지도를 불러오지 못했습니다. JavaScript 키와 Kakao Developers의 Web 플랫폼 도메인 등록을 확인하세요.</Notice>
  if (kakaoLoading) return <Notice>지도를 불러오는 중…</Notice>

  return (
    <div className="relative flex h-full overflow-hidden bg-zinc-100">
      {/* 왼쪽: 지도 열 (모바일에서는 전체 화면) */}
      <div ref={mapColRef} className="relative min-w-0 flex-1">
        <MapView
          places={visible}
          candidates={candidates}
          selectedId={selectedId}
          route={route}
          level={level}
          onCreate={setMap}
          onLevelChange={setLevel}
          onSelect={select}
        />

        <TopBar
          trips={trips}
          tripId={tripId}
          onTripChange={(id) => {
            setTripId(id)
            setSelectedId(null)
          }}
          onAddTrip={handleAddTrip}
          enabled={enabled}
          counts={counts}
          onToggle={toggleCategory}
          onSearch={() => setSearchOpen(true)}
        />

        <div className="pointer-events-none absolute inset-x-0 top-26 z-10 flex justify-center">
          <ExploreButton map={map} savedIds={savedIds} active={candidates.length > 0} onResult={setCandidates} />
        </div>

        {error && (
          <button onClick={() => setError(null)} className="absolute inset-x-3 top-40 z-40 rounded-xl bg-red-600 px-4 py-3 text-left text-sm text-white shadow-lg">
            오류: {error} (탭하여 닫기)
          </button>
        )}
      </div>

      {/* 오른쪽: 정보 패널 (PC 40%) / 모바일 하단 시트 */}
      <PlaceSheet
        places={visible}
        place={selectedPlace}
        candidate={selectedCandidate}
        base={base}
        drive={driveTimes}
        likes={likes}
        voter={voter}
        region={tripName}
        hint={!tripId && trips.length > 0 ? '✈️ 위에서 여행을 고르면 숙소 기준 거리가 보여요' : undefined}
        onVoterChange={(name) => {
          setVoter(name)
          storage.set(VOTER_KEY, name)
        }}
        onToggleLike={(placeId, name) => toggleLike(placeId, name, likes.some((l) => l.place_id === placeId && l.voter === name))}
        onSelect={select}
        onUpdate={updatePlace}
        onDelete={(id) => {
          deletePlace(id)
          setSelectedId(null)
        }}
        onSaveCandidate={saveCandidate}
        onAdd={() => setSearchOpen(true)}
      />

      {searchOpen && (
        <SearchAdd
          map={map}
          trips={trips}
          tripId={tripId}
          savedIds={savedIds}
          onSave={async (p) => {
            const saved = await addPlace(p)
            if (!saved) return
            // 다른 여행에 저장했다면 그 여행으로 전환해 바로 보이게 한다
            if (tripId && saved.trip_id !== tripId) setTripId(saved.trip_id)
            setSelectedId(saved.id)
            map?.panTo(new kakao.maps.LatLng(saved.lat, saved.lng))
          }}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </div>
  )
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center p-6 text-center leading-relaxed text-gray-600">
      <p className="max-w-md break-keep">{children}</p>
    </div>
  )
}
