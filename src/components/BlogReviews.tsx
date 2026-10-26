import { ExternalLink } from 'lucide-react'
import type { PlaceInfo } from '../lib/api'
import { relativeDate } from '../lib/format'
import { btn } from '../lib/ui'
import { Avatar } from './ui'

// info: undefined = 불러오는 중, null = 서버 키 미설정 등으로 사용 불가(섹션 숨김)
export default function BlogReviews({ info, query }: { info: PlaceInfo | null | undefined; query: string }) {
  if (info === null) return null

  return (
    <section className="flex flex-col gap-3">
      <h3 className="flex items-center gap-2 text-[15px] font-bold text-zinc-900">
        <span className="inline-flex size-5 items-center justify-center rounded-md bg-[#03c75a] text-[11px] font-black text-white">N</span>
        블로그 후기
      </h3>

      {info === undefined &&
        [0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse rounded-2xl bg-white p-4 ring-1 ring-zinc-100">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-full bg-zinc-200" />
              <div className="h-3 w-24 rounded bg-zinc-200" />
            </div>
            <div className="mt-3 h-4 w-4/5 rounded bg-zinc-200" />
            <div className="mt-2 h-3 w-full rounded bg-zinc-100" />
            <div className="mt-1.5 h-3 w-2/3 rounded bg-zinc-100" />
          </div>
        ))}

      {info?.blogs.length === 0 && <p className="rounded-2xl bg-zinc-50 p-4 text-center text-sm text-zinc-500">아직 찾은 후기가 없어요</p>}

      {info?.blogs.map((b) => (
        <a
          key={b.link}
          href={b.link}
          target="_blank"
          rel="noreferrer"
          className="group rounded-2xl bg-white p-4 ring-1 ring-zinc-100 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-zinc-200"
        >
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Avatar name={b.blogger || '?'} size={24} />
            <span className="min-w-0 truncate font-medium text-zinc-700">{b.blogger}</span>
            <span className="shrink-0">· {relativeDate(b.date)}</span>
            <ExternalLink className="ml-auto size-4 shrink-0 text-zinc-300 group-hover:text-zinc-500" />
          </div>
          <div className="mt-2 line-clamp-2 text-[15px] leading-snug font-semibold text-zinc-900">{b.title}</div>
          <p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-zinc-500">{b.description}</p>
        </a>
      ))}

      {info && (
        <a
          href={`https://search.naver.com/search.naver?ssc=tab.blog.all&query=${encodeURIComponent(query)}`}
          target="_blank"
          rel="noreferrer"
          className={`${btn.tonal} ${btn.md}`}
        >
          네이버에서 후기 더보기 <ExternalLink className="size-4" />
        </a>
      )}
    </section>
  )
}
