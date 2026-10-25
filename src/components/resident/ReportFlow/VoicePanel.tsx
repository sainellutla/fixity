import { useEffect, useMemo, useRef, useState } from 'react'
import { Languages, Mic, RotateCcw, Square } from 'lucide-react'
import { AiBadge } from '../../shared/AiBadge'
import { VOICE_LANGUAGES, VOICE_SCRIPTS, VOICE_UI, languageLabel, wordDelay, type VoiceScript } from '../../../lib/voiceScripts'
import type { VoiceLanguage } from '../../../lib/types'

export interface VoiceResult {
  script: VoiceScript
  language: VoiceLanguage
  originalText: string
  englishText: string
}

type Phase = 'idle' | 'listening' | 'done'

const PACES = [
  { id: 'slow', label: 'Slow', mult: 1.35 },
  { id: 'normal', label: 'Normal', mult: 1 },
  { id: 'fast', label: 'Fast', mult: 0.7 },
] as const

export function VoicePanel({ onResult, onReset }: { onResult: (r: VoiceResult) => void; onReset: () => void }) {
  const [language, setLanguage] = useState<VoiceLanguage>('es')
  const [scriptId, setScriptId] = useState(VOICE_SCRIPTS[0].id)
  const [phase, setPhase] = useState<Phase>('idle')
  const [shown, setShown] = useState(0)
  const [pace, setPace] = useState<(typeof PACES)[number]['id']>('normal')
  const [elapsed, setElapsed] = useState(0)
  const startedAt = useRef(0)

  const script = VOICE_SCRIPTS.find((s) => s.id === scriptId) ?? VOICE_SCRIPTS[0]
  const words = useMemo(() => script.transcript[language].split(/\s+/), [script, language])
  const ui = VOICE_UI[language]
  const mult = PACES.find((p) => p.id === pace)?.mult ?? 1

  const finishRef = useRef<() => void>(() => {})
  finishRef.current = finish

  useEffect(() => {
    if (phase !== 'listening') return
    if (shown >= words.length) {
      const t = setTimeout(() => finishRef.current(), 500)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 900 : wordDelay(words[shown - 1], mult))
    return () => clearTimeout(t)
  }, [phase, shown, words, mult])

  useEffect(() => {
    if (phase !== 'listening') return
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 250)
    return () => clearInterval(t)
  }, [phase])

  function start() {
    setShown(0)
    setElapsed(0)
    startedAt.current = Date.now()
    setPhase('listening')
    onReset()
  }

  function finish() {
    setShown(words.length)
    setPhase('done')
    onResult({ script, language, originalText: script.transcript[language], englishText: script.transcript.en })
  }

  function restart() {
    setPhase('idle')
    setShown(0)
    onReset()
  }

  const locked = phase !== 'idle'

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="cl-label flex items-center gap-1"><Languages size={13} /> Language</label>
        <div className="flex gap-2 mt-1">
          {VOICE_LANGUAGES.map((l) => (
            <button key={l.id} className={`cl-toggle flex-1 ${language === l.id ? 'is-on' : ''}`} style={{ fontSize: 15, padding: '8px 12px' }} disabled={locked} onClick={() => setLanguage(l.id)}>
              {l.native}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="cl-label">{ui.pickType}</label>
        <div className="grid grid-cols-3 gap-2 mt-1">
          {VOICE_SCRIPTS.map((s) => (
            <button key={s.id} className={`cl-voice-type ${s.id === scriptId ? 'is-on' : ''}`} disabled={locked} onClick={() => setScriptId(s.id)}>
              <span className="text-2xl" aria-hidden="true">{s.icon}</span>
              <span>{s.label[language]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="cl-voice-stage">
        <div className="flex flex-col items-center gap-2">
          {phase === 'listening' ? (
            <button className="cl-mic is-live" onClick={finish} aria-label={ui.stop}>
              <Square size={26} fill="currentColor" />
            </button>
          ) : phase === 'done' ? (
            <button className="cl-mic is-done" onClick={restart} aria-label={ui.again}>
              <RotateCcw size={28} />
            </button>
          ) : (
            <button className="cl-mic" onClick={start} aria-label={ui.tapToSpeak}>
              <Mic size={34} />
            </button>
          )}
          <span className="cl-display text-lg font-extrabold">
            {phase === 'listening' ? ui.listening : phase === 'done' ? ui.again : ui.tapToSpeak}
          </span>
          {phase === 'listening' && (
            <span className="flex items-center gap-2 text-xs" style={{ color: 'var(--cl-text-dim)' }}>
              <span className="cl-rec-dot" /> REC 0:{String(elapsed).padStart(2, '0')}
              <span className="cl-wave" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ animationDelay: `${(i % 5) * 0.11}s` }} />)}</span>
            </span>
          )}
        </div>

        <div className="cl-transcript" lang={language} aria-live="polite">
          {phase === 'idle' ? (
            <span style={{ color: 'var(--cl-text-faint)' }}>Your words will appear here as you speak.</span>
          ) : (
            <>
              {words.slice(0, shown).join(' ')}
              {phase === 'listening' && <span className="cl-caret" />}
            </>
          )}
        </div>
      </div>

      {phase === 'done' && (
        <div className="cl-card is-good">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="cl-kicker is-good" style={{ margin: 0 }}>{ui.done}</p>
            <AiBadge label="Demo transcription" />
          </div>
          {language !== 'en' && (
            <>
              <span className="cl-label">Translated for city staff · {languageLabel(language)} → English</span>
              <p className="text-sm mt-1">{script.transcript.en}</p>
            </>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--cl-text-faint)' }}>
        <span>Simulated for the demo — no audio is recorded.</span>
        <span className="flex items-center gap-1">
          Pace
          {PACES.map((p) => (
            <button key={p.id} className={`cl-toggle ${pace === p.id ? 'is-on' : ''}`} style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => setPace(p.id)}>{p.label}</button>
          ))}
        </span>
      </div>
    </div>
  )
}
