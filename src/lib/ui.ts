// 모든 버튼은 채움(fill) 스타일 — 테두리만 있는 버튼은 쓰지 않는다
const base =
  'inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50'

export const btn = {
  primary: `${base} bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700`,
  tonal: `${base} bg-zinc-100 text-zinc-800 hover:bg-zinc-200 active:bg-zinc-300`,
  danger: `${base} bg-red-50 text-red-600 hover:bg-red-100`,
  dark: `${base} bg-zinc-900 text-white hover:bg-zinc-800`,
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-[15px]',
}
