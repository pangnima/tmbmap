import { Compass, LoaderCircle, X } from 'lucide-react'
import { useState } from 'react'
import { EXPLORE_CODES, type KakaoPlace } from '../lib/categories'

interface Props {
  map: kakao.maps.Map | null
  savedIds: Set<string>
  active: boolean
  onResult: (items: KakaoPlace[]) => void
}

// 현재 보이는 지도 영역의 음식점·카페·관광명소를 카테고리별 최대 15개씩 가져온다
export default function ExploreButton({ map, savedIds, active, onResult }: Props) {
  const [loading, setLoading] = useState(false)

  const explore = async () => {
    if (!map) return
    setLoading(true)
    const places = new kakao.maps.services.Places(map)
    const lists = await Promise.all(
      EXPLORE_CODES.map(
        (code) =>
          new Promise<KakaoPlace[]>((resolve) =>
            places.categorySearch(code, (data, status) => resolve(status === kakao.maps.services.Status.OK ? data : []), {
              useMapBounds: true,
            }),
          ),
      ),
    )
    onResult(lists.flat().filter((p) => !savedIds.has(p.id)))
    setLoading(false)
  }

  return (
    <button
      onClick={active ? () => onResult([]) : explore}
      disabled={loading}
      className={`pointer-events-auto inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold shadow-lg ring-1 ring-black/5 transition-colors disabled:opacity-70 ${
        active ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'bg-white text-zinc-900 hover:bg-zinc-50'
      }`}
    >
      {loading ? (
        <>
          <LoaderCircle className="size-4 animate-spin" /> 찾는 중…
        </>
      ) : active ? (
        <>
          <X className="size-4" /> 후보 지우기
        </>
      ) : (
        <>
          <Compass className="size-4 text-orange-500" /> 이 지역 둘러보기
        </>
      )}
    </button>
  )
}
