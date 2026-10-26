import { useMemo, useState, type FormEvent } from 'react'
import type { DriveTimes } from '../lib/api'
import type { KakaoPlace } from '../lib/categories'
import type { Like, Place } from '../lib/supabase'
import PlaceDetail, { CandidateDetail } from './PlaceDetail'
import PlaceList from './PlaceList'
import { btn } from '../lib/ui'

interface Props {
  places: Place[]
  place: Place | null
  candidate: KakaoPlace | null
  base: Place | null
  drive: DriveTimes | null
  likes: Like[]
  voter: string | null
  region: string
  hint?: string
  onVoterChange: (name: string) => void
  onToggleLike: (placeId: string, voter: string) => void
  onSelect: (id: string | null) => void
  onUpdate: (id: string, patch: Partial<Place>) => void
  onDelete: (id: string) => void
  onSaveCandidate: (item: KakaoPlace) => void
  onAdd: () => void
}

// PC: 화면 오른쪽 40% 패널 / 모바일: 지도 위 하단 시트
export default function PlaceSheet(props: Props) {
  const { places, place, candidate, base, drive, likes, voter, onSelect } = props
  const [open, setOpen] = useState(false)
  const [editingName, setEditingName] = useState(false)
  // 이름 없이 ❤️를 누르면 이름을 받은 뒤 이어서 처리
  const [pendingLike, setPendingLike] = useState<string | null>(null)

  const votersOf = useMemo(() => {
    const m = new Map<string, string[]>()
    likes.forEach((l) => m.set(l.place_id, [...(m.get(l.place_id) ?? []), l.voter]))
    return m
  }, [likes])

  const like = (placeId: string) => {
    if (!voter) {
      setPendingLike(placeId)
      setEditingName(true)
    } else props.onToggleLike(placeId, voter)
  }

  const saveName = (name: string) => {
    props.onVoterChange(name)
    setEditingName(false)
    if (pendingLike) props.onToggleLike(pendingLike, name)
    setPendingLike(null)
  }

  const detailOpen = Boolean(place || candidate)

  return (
    <aside
      className={`absolute inset-x-0 bottom-0 z-20 flex flex-col overflow-hidden rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] ${
        detailOpen ? 'max-h-[78%]' : 'max-h-[62%]'
      } md:static md:z-auto md:h-full md:max-h-none md:w-[40%] md:max-w-[720px] md:min-w-[380px] md:shrink-0 md:rounded-none md:border-l md:border-zinc-200 md:pb-0 md:shadow-none`}
    >
      <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-zinc-300 md:hidden" />

      {editingName && (
        <NameForm
          initial={voter ?? ''}
          onSave={saveName}
          onCancel={() => {
            setEditingName(false)
            setPendingLike(null)
          }}
        />
      )}

      {place ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <PlaceDetail
            key={place.id}
            place={place}
            base={base}
            drive={drive}
            voters={votersOf.get(place.id) ?? []}
            voter={voter}
            region={props.region}
            onLike={like}
            onBack={() => onSelect(null)}
            onUpdate={props.onUpdate}
            onDelete={props.onDelete}
          />
        </div>
      ) : candidate ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <CandidateDetail item={candidate} base={base} onBack={() => onSelect(null)} onSave={props.onSaveCandidate} />
        </div>
      ) : (
        <PlaceList
          places={places}
          base={base}
          drive={drive}
          votersOf={votersOf}
          voter={voter}
          title={props.region || '전체 장소'}
          hint={props.hint}
          open={open}
          onToggleOpen={() => setOpen(!open)}
          onEditName={() => setEditingName(true)}
          onLike={like}
          onSelect={onSelect}
          onAdd={props.onAdd}
        />
      )}
    </aside>
  )
}

function NameForm({ initial, onSave, onCancel }: { initial: string; onSave: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (name.trim()) onSave(name.trim())
  }
  return (
    <form onSubmit={submit} className="m-4 mb-1 flex flex-col gap-3 rounded-2xl bg-orange-50 p-4">
      <div>
        <div className="text-[15px] font-bold text-zinc-900">투표에 쓸 이름을 알려주세요</div>
        <div className="text-xs text-zinc-500">동행자들이 누가 어디를 좋아하는지 볼 수 있어요</div>
      </div>
      <div className="flex gap-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 철수"
          maxLength={20}
          className="h-11 min-w-0 flex-1 rounded-xl bg-white px-3 outline-none focus:ring-2 focus:ring-orange-300"
        />
        <button className={`${btn.primary} ${btn.md}`}>확인</button>
        <button type="button" onClick={onCancel} className={`${btn.tonal} ${btn.md} bg-white`}>
          취소
        </button>
      </div>
    </form>
  )
}
