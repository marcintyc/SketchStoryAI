export type PathStep = {
  kind: 'path'
  id: string
  d: string
  stroke: string
  strokeWidth: number
  durationMs: number
}

export type TextStep = {
  kind: 'text'
  id: string
  x: number
  y: number
  content: string
  fontSize: number
  textAnchor?: 'start' | 'middle' | 'end'
  durationMs: number
}

export type StoryStep = PathStep | TextStep

function clamp(min: number, val: number, max: number) {
  return Math.max(min, Math.min(val, max))
}

export function createStoryboardFromPrompt(prompt: string, width: number, height: number): StoryStep[] {
  const padding = 80
  const right = width - padding
  const bottom = height - padding

  const safePrompt = prompt.trim().slice(0, 80)

  // Simple layout
  const title: TextStep = {
    kind: 'text',
    id: 'title',
    x: width / 2,
    y: 70,
    content: safePrompt.length ? `"${safePrompt}"` : 'Twoja historia',
    fontSize: 28,
    textAnchor: 'middle',
    durationMs: 800,
  }

  // Board rectangle
  const boardPath = `M ${padding} ${padding + 40} H ${right} V ${bottom} H ${padding} Z`
  const board: PathStep = {
    kind: 'path',
    id: 'board',
    d: boardPath,
    stroke: '#111',
    strokeWidth: 3,
    durationMs: 1800,
  }

  // Bubble (speech cloud)
  const cx = padding + 220
  const cy = padding + 150
  const r = 70
  const bubblePath = `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy}`
  const bubble: PathStep = {
    kind: 'path',
    id: 'bubble',
    d: bubblePath,
    stroke: '#111',
    strokeWidth: 3,
    durationMs: 1400,
  }

  // Arrow to a box
  const arrowFromX = cx + r
  const arrowFromY = cy
  const boxX = width - padding - 240
  const boxY = padding + 140
  const boxW = 200
  const boxH = 120

  const arrowPath = `M ${arrowFromX} ${arrowFromY} C ${arrowFromX + 80} ${arrowFromY - 80}, ${boxX - 80} ${boxY + boxH + 40}, ${boxX} ${boxY + boxH / 2}`
  const arrow: PathStep = {
    kind: 'path',
    id: 'arrow',
    d: arrowPath,
    stroke: '#111',
    strokeWidth: 3,
    durationMs: 1100,
  }

  const boxPath = `M ${boxX} ${boxY} H ${boxX + boxW} V ${boxY + boxH} H ${boxX} Z`
  const box: PathStep = {
    kind: 'path',
    id: 'box',
    d: boxPath,
    stroke: '#111',
    strokeWidth: 3,
    durationMs: 1200,
  }

  const captionLeft: TextStep = {
    kind: 'text',
    id: 'caption-left',
    x: cx,
    y: cy + r + 36,
    content: 'Pomysł / Wejście',
    fontSize: 18,
    textAnchor: 'middle',
    durationMs: 600,
  }

  const captionRight: TextStep = {
    kind: 'text',
    id: 'caption-right',
    x: boxX + boxW / 2,
    y: boxY + boxH + 36,
    content: 'Scena / Wyjście',
    fontSize: 18,
    textAnchor: 'middle',
    durationMs: 600,
  }

  return [title, board, bubble, arrow, box, captionLeft, captionRight]
}