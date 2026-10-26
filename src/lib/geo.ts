interface Point {
  lat: number
  lng: number
}

// 하버사인 공식: 두 좌표 사이 직선거리(m)
export function distanceM(a: Point, b: Point) {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371000 * Math.asin(Math.sqrt(h))
}

export const formatDistance = (m: number) => (m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`)

export const formatDuration = (s: number) => {
  const min = Math.max(1, Math.round(s / 60))
  return min < 60 ? `${min}분` : `${Math.floor(min / 60)}시간 ${min % 60}분`
}
