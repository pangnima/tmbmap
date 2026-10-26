import type { Category, NewPlace } from './supabase'

export type KakaoPlace = kakao.maps.services.PlacesSearchResultItem

export const CATEGORIES: Record<Category, { label: string; emoji: string; color: string }> = {
  food: { label: '맛집', emoji: '🍽️', color: '#ef4444' },
  cafe: { label: '카페', emoji: '☕', color: '#b45309' },
  activity: { label: '즐길거리', emoji: '🎡', color: '#2563eb' },
  stay: { label: '숙소', emoji: '🏨', color: '#7c3aed' },
  etc: { label: '기타', emoji: '📍', color: '#6b7280' },
}

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as Category[]

// '이 지역 둘러보기'에서 조회할 카카오 카테고리 코드
export const EXPLORE_CODES = ['FD6', 'CE7', 'AT4'] as const

export function categoryFromKakao(code: string | string[] | undefined): Category {
  const c = Array.isArray(code) ? code[0] : code
  switch (c) {
    case 'FD6':
      return 'food'
    case 'CE7':
      return 'cafe'
    case 'AT4':
    case 'CT1':
      return 'activity'
    case 'AD5':
      return 'stay'
    default:
      return 'etc'
  }
}

export function toNewPlace(item: KakaoPlace, tripId: string | null, category?: Category, memo?: string): NewPlace {
  return {
    trip_id: tripId,
    name: item.place_name,
    category: category ?? categoryFromKakao(item.category_group_code),
    lat: Number(item.y),
    lng: Number(item.x),
    address: item.road_address_name || item.address_name || null,
    phone: item.phone || null,
    kakao_place_id: item.id,
    place_url: item.place_url || null,
    memo: memo?.trim() || null,
  }
}
