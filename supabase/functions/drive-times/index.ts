// 카카오모빌리티 자동차 길찾기 프록시: 기준점 → 여러 목적지의 거리(m)·시간(초)
// 비밀키: KAKAO_REST_KEY

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

interface Point {
  lat: number
  lng: number
}

const isPoint = (p: Point) => Number.isFinite(p?.lat) && Number.isFinite(p?.lng)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const key = Deno.env.get('KAKAO_REST_KEY')
  if (!key) return json({ error: 'not_configured' }, 503)

  const { origin, dests } = await req.json().catch(() => ({}))
  if (!isPoint(origin) || !Array.isArray(dests) || dests.length > 30 || !dests.every(isPoint)) {
    return json({ error: 'invalid input' }, 400)
  }

  const entries = await Promise.all(
    dests.map(async (d: Point & { id: string }) => {
      const url =
        'https://apis-navi.kakaomobility.com/v1/directions' +
        `?origin=${origin.lng},${origin.lat}&destination=${d.lng},${d.lat}&summary=true`
      try {
        const res = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` } })
        const route = (await res.json()).routes?.[0]
        return [d.id, route?.result_code === 0 ? { m: route.summary.distance, s: route.summary.duration } : null]
      } catch {
        return [d.id, null]
      }
    }),
  )

  return json(Object.fromEntries(entries))
})
