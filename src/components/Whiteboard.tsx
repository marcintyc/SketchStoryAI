import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { StoryStep, PathStep, TextStep } from '../lib/story'

export type WhiteboardProps = {
  width: number
  height: number
  steps: StoryStep[]
}

export function Whiteboard({ width, height, steps }: WhiteboardProps) {
  const pathRefs = useRef<Record<string, SVGPathElement | null>>({})
  const textRefs = useRef<Record<string, SVGTextElement | null>>({})
  const [playing, setPlaying] = useState<boolean>(true)
  const [currentId, setCurrentId] = useState<string | null>(null)

  const penRef = useRef<SVGCircleElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const stopAllAnimation = () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
  }

  useEffect(() => {
    stopAllAnimation()
    setPlaying(true)

    const run = async () => {
      for (const step of steps) {
        setCurrentId(step.id)
        if (step.kind === 'path') {
          await playPath(step)
        } else {
          await playText(step)
        }
      }
      setCurrentId(null)
    }

    run()

    return () => {
      stopAllAnimation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps])

  const playPath = (step: PathStep) => new Promise<void>((resolve) => {
    const el = pathRefs.current[step.id]
    if (!el) return resolve()

    const total = el.getTotalLength()

    el.style.transition = 'none'
    el.style.strokeDasharray = `${total}`
    el.style.strokeDashoffset = `${total}`
    el.style.opacity = '1'

    // Force style apply
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    el.getBoundingClientRect()

    el.style.transition = `stroke-dashoffset ${step.durationMs}ms linear`
    const startTs = performance.now()

    const pen = penRef.current
    if (pen) pen.style.opacity = '1'

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTs) / step.durationMs)
      const currentLen = total * t
      if (pen) {
        const p = el.getPointAtLength(currentLen)
        pen.setAttribute('cx', String(p.x))
        pen.setAttribute('cy', String(p.y))
      }
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    requestAnimationFrame(() => {
      el.style.strokeDashoffset = '0'
      setTimeout(() => {
        if (penRef.current) penRef.current.style.opacity = '0'
        resolve()
      }, step.durationMs + 32)
    })
  })

  const playText = (step: TextStep) => new Promise<void>((resolve) => {
    const el = textRefs.current[step.id]
    if (!el) return resolve()

    el.style.opacity = '0'
    el.style.transition = 'none'
    // Force style apply
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    el.getBoundingClientRect()

    el.style.transition = 'opacity 320ms ease'
    el.style.opacity = '1'

    setTimeout(() => resolve(), Math.max(320, step.durationMs))
  })

  const assignPathRef = (id: string) => (node: SVGPathElement | null) => {
    pathRefs.current[id] = node
  }
  const assignTextRef = (id: string) => (node: SVGTextElement | null) => {
    textRefs.current[id] = node
  }

  return (
    <div className="whiteboard__frame" style={{ width, height }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <rect x={0} y={0} width={width} height={height} fill="#ffffff" />

        {steps.map((s) => (
          s.kind === 'path' ? (
            <path
              key={s.id}
              ref={assignPathRef(s.id)}
              d={s.d}
              fill="none"
              stroke={s.stroke}
              strokeWidth={s.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0 }}
            />
          ) : (
            <text
              key={s.id}
              ref={assignTextRef(s.id)}
              x={s.x}
              y={s.y}
              fontSize={s.fontSize}
              textAnchor={s.textAnchor ?? 'start'}
              fill="#111"
              style={{ opacity: 0 }}
            >
              {s.content}
            </text>
          )
        ))}

        <circle ref={penRef} r={6} fill="#111" style={{ opacity: 0 }} />
      </svg>
    </div>
  )
}