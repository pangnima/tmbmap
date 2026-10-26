import { useCallback, useEffect, useState } from 'react'
import { supabase, type Like, type NewPlace, type Place, type Trip } from '../lib/supabase'

// 데이터가 많지 않으므로 전부 불러와 클라이언트에서 필터링한다
export function usePlaces() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [places, setPlaces] = useState<Place[]>([])
  const [likes, setLikes] = useState<Like[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fail = (e: { message: string } | null) => {
    if (e) setError(e.message)
    return !e
  }

  useEffect(() => {
    Promise.all([
      supabase.from('trips').select('*').order('created_at'),
      supabase.from('places').select('*').order('created_at'),
      supabase.from('likes').select('place_id, voter').order('created_at'),
    ]).then(([t, p, l]) => {
      if (fail(t.error) && fail(p.error) && fail(l.error)) {
        setTrips(t.data as Trip[])
        setPlaces(p.data as Place[])
        setLikes(l.data as Like[])
      }
      setLoading(false)
    })
  }, [])

  const addTrip = useCallback(async (name: string) => {
    const { data, error } = await supabase.from('trips').insert({ name }).select().single()
    if (!fail(error)) return null
    setTrips((prev) => [...prev, data as Trip])
    return data as Trip
  }, [])

  const addPlace = useCallback(async (place: NewPlace) => {
    const { data, error } = await supabase.from('places').insert(place).select().single()
    if (!fail(error)) return null
    setPlaces((prev) => [...prev, data as Place])
    return data as Place
  }, [])

  const updatePlace = useCallback(async (id: string, patch: Partial<Place>) => {
    setPlaces((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    const { error } = await supabase.from('places').update(patch).eq('id', id)
    fail(error)
  }, [])

  const deletePlace = useCallback(async (id: string) => {
    const { error } = await supabase.from('places').delete().eq('id', id)
    if (fail(error)) {
      setPlaces((prev) => prev.filter((p) => p.id !== id))
      setLikes((prev) => prev.filter((l) => l.place_id !== id))
    }
  }, [])

  // 화면을 먼저 바꾸고 실패하면 되돌린다
  const toggleLike = useCallback(async (placeId: string, voter: string, liked: boolean) => {
    const same = (l: Like) => l.place_id === placeId && l.voter === voter
    setLikes((prev) => (liked ? prev.filter((l) => !same(l)) : [...prev, { place_id: placeId, voter }]))
    const { error } = liked
      ? await supabase.from('likes').delete().match({ place_id: placeId, voter })
      : await supabase.from('likes').insert({ place_id: placeId, voter })
    if (!fail(error)) setLikes((prev) => (liked ? [...prev, { place_id: placeId, voter }] : prev.filter((l) => !same(l))))
  }, [])

  return { trips, places, likes, loading, error, setError, addTrip, addPlace, updatePlace, deletePlace, toggleLike }
}
