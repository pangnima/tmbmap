import { supabase } from './supabase'

export interface Blog {
  title: string
  description: string
  link: string
  blogger: string
  date: string
}

export interface PlaceInfo {
  homepage: string | null
  blogs: Blog[]
}

export type DriveTimes = Record<string, { m: number; s: number } | null>

// 세션 동안만 기억하는 간단한 캐시 (같은 장소를 다시 열면 재요청하지 않음)
const infoCache = new Map<string, Promise<PlaceInfo | null>>()

// 서버 비밀키가 설정되지 않았으면(503) null을 돌려주고 화면에서 해당 영역을 숨긴다
export function fetchPlaceInfo(name: string, region: string) {
  const key = `${region}|${name}`
  if (!infoCache.has(key)) {
    infoCache.set(
      key,
      supabase.functions
        .invoke<PlaceInfo>('place-info', { body: { name, region } })
        .then(({ data, error }) => (error ? null : data)),
    )
  }
  return infoCache.get(key)!
}

export async function fetchDriveTimes(origin: { lat: number; lng: number }, dests: { id: string; lat: number; lng: number }[]) {
  if (dests.length === 0) return null
  const { data, error } = await supabase.functions.invoke<DriveTimes>('drive-times', { body: { origin, dests } })
  return error ? null : data
}
