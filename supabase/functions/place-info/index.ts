// 네이버 검색 API 프록시: 홈페이지(지역 검색) + 블로그 후기
// 2026-07-31부터 개발자센터 신규 발급이 종료되어 NAVER API HUB(네이버 클라우드)를 사용한다
// 비밀키: NAVER_CLIENT_ID, NAVER_CLIENT_SECRET (HUB Application의 Client ID / Client Secret)

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const strip = (s = '') =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

const norm = (s: string) => strip(s).replace(/\s/g, '')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const id = Deno.env.get('NAVER_CLIENT_ID')
  const secret = Deno.env.get('NAVER_CLIENT_SECRET')
  if (!id || !secret) return json({ error: 'not_configured' }, 503)

  const { name, region } = await req.json().catch(() => ({}))
  if (typeof name !== 'string' || !name.trim()) return json({ error: 'name required' }, 400)

  const query = encodeURIComponent(`${region ?? ''} ${name}`.trim())
  const search = (path: string) =>
    fetch(`https://naverapihub.apigw.ntruss.com/search/v1/${path}`, {
      headers: { 'X-NCP-APIGW-API-KEY-ID': id, 'X-NCP-APIGW-API-KEY': secret },
    }).then((r) => (r.ok ? r.json() : { items: [], status: r.status }))

  const [local, blog] = await Promise.all([
    search(`local?query=${query}&display=5`),
    search(`blog?query=${query}&display=5&sort=sim`),
  ])

  // 키가 틀리는 등 둘 다 실패하면 '후기 없음'으로 숨기지 말고 오류로 알린다
  if (local.status && blog.status) return json({ error: 'naver_failed', status: blog.status }, 502)

  // 이름이 일치하는 가게의 링크만 홈페이지로 인정 (엉뚱한 가게 링크 방지)
  const target = norm(name)
  const match = (local.items ?? []).find((i: { title: string }) => {
    const t = norm(i.title)
    return t.includes(target) || target.includes(t)
  })

  return json({
    homepage: match?.link || null,
    blogs: (blog.items ?? []).map((b: Record<string, string>) => ({
      title: strip(b.title),
      description: strip(b.description),
      link: b.link,
      blogger: b.bloggername,
      date: b.postdate,
    })),
  })
})
