import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(url && anonKey)

// 환경변수가 없으면 App에서 설정 안내 화면을 띄우므로 여기선 빈 값으로 만들지 않는다
export const supabase = supabaseConfigured ? createClient(url, anonKey) : null!

export type Category = 'food' | 'cafe' | 'activity' | 'stay' | 'etc'

export interface Trip {
  id: string
  name: string
  created_at: string
}

export interface Place {
  id: string
  trip_id: string | null
  name: string
  category: Category
  lat: number
  lng: number
  address: string | null
  phone: string | null
  kakao_place_id: string | null
  place_url: string | null
  memo: string | null
  created_at: string
}

export type NewPlace = Omit<Place, 'id' | 'created_at'>

export interface Like {
  place_id: string
  voter: string
}
