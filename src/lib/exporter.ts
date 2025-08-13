import type { StoryStep } from './story'

export type ExportOptions = {
  fps?: number
  videoBitsPerSecond?: number
}

export async function exportStoryboardToWebM(
  steps: StoryStep[],
  width: number,
  height: number,
  opts: ExportOptions = {}
): Promise<Blob> {
  const fps = opts.fps ?? 30
  const videoBitsPerSecond = opts.videoBitsPerSecond ?? 4_000_000

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  // Prepare SVG paths for measuring and Path2D for drawing
  const svgNs = 'http://www.w3.org/2000/svg'
  const hiddenSvg = document.createElementNS(svgNs, 'svg')
  hiddenSvg.setAttribute('width', String(width))
  hiddenSvg.setAttribute('height', String(height))
  hiddenSvg.style.position = 'absolute'
  hiddenSvg.style.left = '-99999px'
  hiddenSvg.style.top = '-99999px'
  document.body.appendChild(hiddenSvg)

  const pathHelpers: Record<string, { el: SVGPathElement; total: number; p2d: Path2D; stroke: string; strokeWidth: number; durationMs: number }> = {}
  const textHelpers: Record<string, { x: number; y: number; content: string; fontSize: number; durationMs: number; textAnchor: CanvasTextAlign }> = {}

  let totalDuration = 0
  const schedule: Array<{ id: string; start: number; end: number; kind: StoryStep['kind'] }> = []

  for (const step of steps) {
    const start = totalDuration
    const end = start + step.durationMs
    schedule.push({ id: step.id, start, end, kind: step.kind })
    totalDuration = end

    if (step.kind === 'path') {
      const el = document.createElementNS(svgNs, 'path')
      el.setAttribute('d', step.d)
      hiddenSvg.appendChild(el)
      const total = el.getTotalLength()
      const p2d = new Path2D(step.d)
      pathHelpers[step.id] = {
        el,
        total,
        p2d,
        stroke: step.stroke,
        strokeWidth: step.strokeWidth,
        durationMs: step.durationMs,
      }
    } else {
      // map SVG textAnchor to canvas textAlign
      const align: CanvasTextAlign = step.textAnchor === 'middle' ? 'center' : step.textAnchor === 'end' ? 'right' : 'left'
      textHelpers[step.id] = {
        x: step.x,
        y: step.y,
        content: step.content,
        fontSize: step.fontSize,
        durationMs: step.durationMs,
        textAnchor: align,
      }
    }
  }

  const stream = (canvas as HTMLCanvasElement).captureStream(fps)
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond })
  const chunks: BlobPart[] = []
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data)
  }

  const startTime = performance.now()
  recorder.start()

  function drawHand(x: number, y: number, angleRad: number) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angleRad)
    ctx.translate(-10, -8)
    // hand
    ctx.fillStyle = '#f3d8b3'
    const r = 6
    const w = 24, h = 16
    roundRect(ctx, -8, -6, w, h, r)
    ctx.fill()
    // marker body
    ctx.fillStyle = '#222'
    roundRect(ctx, 10, -2, 28, 6, 3)
    ctx.fill()
    // nib
    ctx.beginPath()
    ctx.moveTo(38, -2)
    ctx.lineTo(48, 0)
    ctx.lineTo(38, 2)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    const rr = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + rr, y)
    ctx.lineTo(x + w - rr, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr)
    ctx.lineTo(x + w, y + h - rr)
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h)
    ctx.lineTo(x + rr, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr)
    ctx.lineTo(x, y + rr)
    ctx.quadraticCurveTo(x, y, x + rr, y)
  }

  function drawFrame(elapsedMs: number) {
    // background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // board outline for consistency with preview
    // optional: omitted, as it is a step itself

    // draw each step up to elapsed
    let activePathId: string | null = null
    let activeProgress = 0

    for (const s of schedule) {
      const visible = elapsedMs >= s.start
      if (!visible) break
      const progress = Math.min(1, Math.max(0, (elapsedMs - s.start) / (s.end - s.start)))
      if (s.kind === 'path') {
        const helper = pathHelpers[s.id]
        ctx.strokeStyle = helper.stroke
        ctx.lineWidth = helper.strokeWidth
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        const total = helper.total

        if (progress >= 1) {
          ctx.setLineDash([])
          ctx.lineDashOffset = 0
          ctx.stroke(helper.p2d)
        } else {
          ctx.setLineDash([total])
          ctx.lineDashOffset = (1 - progress) * total
          ctx.stroke(helper.p2d)
          activePathId = s.id
          activeProgress = progress
        }
      } else {
        const t = textHelpers[s.id]
        ctx.save()
        ctx.fillStyle = '#111'
        ctx.font = `${t.fontSize}px Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`
        ctx.textAlign = t.textAnchor
        // simple fade in for first 320ms of its duration
        const local = elapsedMs - s.start
        const alpha = Math.min(1, Math.max(0, local / 320))
        ctx.globalAlpha = alpha
        ctx.fillText(t.content, t.x, t.y)
        ctx.restore()
      }
    }

    if (activePathId) {
      const helper = pathHelpers[activePathId]
      const len = helper.total * activeProgress
      const p = helper.el.getPointAtLength(Math.max(0.0001, len))
      const p2 = helper.el.getPointAtLength(Math.min(helper.total, len + 1))
      const ang = Math.atan2(p2.y - p.y, p2.x - p.x)
      drawHand(p.x, p.y, ang)
    }
  }

  const totalMs = totalDuration + 400 // small tail

  return await new Promise<Blob>((resolve) => {
    function loop() {
      const now = performance.now()
      const elapsed = now - startTime
      drawFrame(elapsed)
      if (elapsed < totalMs) {
        requestAnimationFrame(loop)
      } else {
        // draw last frame a couple of times to ensure tail
        drawFrame(totalMs)
        setTimeout(() => recorder.stop(), 100)
      }
    }

    recorder.onstop = () => {
      document.body.removeChild(hiddenSvg)
      resolve(new Blob(chunks, { type: 'video/webm' }))
    }

    requestAnimationFrame(loop)
  })
}