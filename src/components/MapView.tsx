import { CustomOverlayMap, Map, MarkerClusterer, Polyline } from 'react-kakao-maps-sdk'
import { CATEGORIES, categoryFromKakao, type KakaoPlace } from '../lib/categories'
import type { Place } from '../lib/supabase'

const SEOUL = { lat: 37.5665, lng: 126.978 }
// 이 레벨 이하로 확대하면 마커 옆에 이름을 표시
const NAME_LEVEL = 6

interface Props {
  places: Place[]
  candidates: KakaoPlace[]
  selectedId: string | null
  // 숙소 → 선택한 장소 점선
  route: { lat: number; lng: number }[] | null
  level: number
  onCreate: (map: kakao.maps.Map) => void
  onLevelChange: (level: number) => void
  onSelect: (id: string | null) => void
}

export default function MapView({ places, candidates, selectedId, route, level, onCreate, onLevelChange, onSelect }: Props) {
  const showNames = level <= NAME_LEVEL

  return (
    <Map
      center={SEOUL}
      level={level}
      className="absolute inset-0"
      onCreate={onCreate}
      onZoomChanged={(map) => onLevelChange(map.getLevel())}
      onClick={() => onSelect(null)}
    >
      {route && <Polyline path={route} strokeWeight={3} strokeColor="#7c3aed" strokeOpacity={0.8} strokeStyle="dash" />}

      <MarkerClusterer averageCenter minLevel={9} disableClickZoom={false}>
        {places.map((p) => (
          <CustomOverlayMap key={p.id} position={{ lat: p.lat, lng: p.lng }} yAnchor={1} zIndex={p.id === selectedId ? 10 : 1} clickable>
            <Pin
              emoji={CATEGORIES[p.category].emoji}
              color={CATEGORIES[p.category].color}
              name={showNames || p.id === selectedId ? p.name : undefined}
              selected={p.id === selectedId}
              onClick={() => onSelect(p.id)}
            />
          </CustomOverlayMap>
        ))}
      </MarkerClusterer>

      {candidates.map((c) => (
        <CustomOverlayMap key={c.id} position={{ lat: Number(c.y), lng: Number(c.x) }} yAnchor={1} zIndex={c.id === selectedId ? 10 : 0} clickable>
          <Pin
            emoji={CATEGORIES[categoryFromKakao(c.category_group_code)].emoji}
            name={showNames || c.id === selectedId ? c.place_name : undefined}
            selected={c.id === selectedId}
            candidate
            onClick={() => onSelect(c.id)}
          />
        </CustomOverlayMap>
      ))}
    </Map>
  )
}

interface PinProps {
  emoji: string
  color?: string
  name?: string
  selected?: boolean
  candidate?: boolean
  onClick: () => void
}

function Pin({ emoji, color, name, selected, candidate, onClick }: PinProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`flex items-center gap-1 rounded-full border-2 bg-white px-1 py-0.5 text-sm font-semibold whitespace-nowrap text-zinc-900 shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-transform ${name ? 'pr-2.5' : ''} ${
        selected ? 'z-10 scale-115 ring-3 ring-orange-400/70' : 'hover:scale-105'
      } ${candidate ? 'border-dashed border-gray-400 bg-white/90 text-gray-600' : ''}`}
      style={candidate ? undefined : { borderColor: color }}
    >
      <span className={candidate ? 'grayscale' : ''}>{emoji}</span>
      {name && <span className="max-w-36 truncate font-medium">{name}</span>}
    </button>
  )
}
