import React, { useMemo, useState } from 'react'
import { createStoryboardFromPrompt, StoryStep } from './lib/story'
import { Whiteboard } from './components/Whiteboard'

const CANVAS_WIDTH = 960
const CANVAS_HEIGHT = 540

export default function App() {
  const [prompt, setPrompt] = useState<string>('Stwórz krótką historię o nauce z AI w stylu whiteboard')
  const [steps, setSteps] = useState<StoryStep[]>(() => createStoryboardFromPrompt(prompt, CANVAS_WIDTH, CANVAS_HEIGHT))
  const [runKey, setRunKey] = useState<number>(Date.now())

  const handleGenerate = () => {
    const storyboard = createStoryboardFromPrompt(prompt, CANVAS_WIDTH, CANVAS_HEIGHT)
    setSteps(storyboard)
    setRunKey(Date.now())
  }

  const handleReplay = () => setRunKey(Date.now())

  return (
    <div className="app">
      <header className="app__header">
        <h1>SketchStory AI</h1>
        <p>Spersonalizowane animacje whiteboard z prostym generatorem scen</p>
      </header>

      <section className="controls">
        <label htmlFor="prompt">Twój pomysł / prompt</label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Napisz o czym ma być animacja..."
          rows={4}
        />
        <div className="controls__actions">
          <button onClick={handleGenerate}>Generuj storyboard</button>
          <button onClick={handleReplay} className="secondary">Odtwórz ponownie</button>
        </div>
      </section>

      <section className="stage">
        <Whiteboard key={runKey} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} steps={steps} />
      </section>

      <footer className="app__footer">
        <span>Frontend hostowany na GitHub Pages. Integracje AI i TTS dodamy przez serverless (Cloudflare/Vercel).</span>
      </footer>
    </div>
  )
}