import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { Camera, Keyboard, MapPin, Mic } from 'lucide-react'
import { Sheet } from '../../ui/Sheet'
import { Button } from '../../ui/Button'
import { CATEGORY_LABELS } from '../../../lib/departments'
import type { Category, Severity, VoiceLanguage } from '../../../lib/types'
import { VoicePanel, type VoiceResult } from './VoicePanel'

export interface ReportFormValues {
  title: string
  category: Category
  description: string
  severity: Severity
  photo: string | null
  spokenLanguage: VoiceLanguage | null
  originalText: string | null
}

interface ReportFormProps {
  open: boolean
  onClose: () => void
  mode: 'point' | 'area'
  radiusMeters?: number
  onSubmit: (values: ReportFormValues) => void
}

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS) as [Category, string][]

export function ReportForm({ open, onClose, mode, radiusMeters, onSubmit }: ReportFormProps) {
  const [inputMode, setInputMode] = useState<'type' | 'speak'>('type')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('traffic_safety')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<Severity>('medium')
  const [photo, setPhoto] = useState<string | null>(null)
  const [voice, setVoice] = useState<VoiceResult | null>(null)

  function reset() {
    setTitle(''); setCategory('traffic_safety'); setDescription(''); setSeverity('medium'); setPhoto(null); setVoice(null); setInputMode('type')
  }

  function applyVoice(result: VoiceResult) {
    setVoice(result)
    setTitle(result.script.title)
    setCategory(result.script.category)
    setSeverity(result.script.severity)
  }

  function clearVoice() {
    setVoice(null)
    setTitle('')
  }

  const speaking = inputMode === 'speak'
  const canSubmit = speaking ? Boolean(voice && title.trim()) : Boolean(title.trim() && description.trim())

  function handleSubmit() {
    if (!canSubmit) return
    if (speaking && voice) {
      onSubmit({
        title: title.trim(),
        category,
        description: voice.englishText,
        severity,
        photo,
        spokenLanguage: voice.language,
        originalText: voice.originalText,
      })
    } else {
      onSubmit({ title: title.trim(), category, description: description.trim(), severity, photo, spokenLanguage: null, originalText: null })
    }
    reset()
  }

  function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhoto(typeof reader.result === 'string' ? reader.result : null)
    reader.readAsDataURL(file)
  }

  return (
    <Sheet open={open} onClose={() => { reset(); onClose() }} size="md" title="Describe the Issue">
      <div className="flex flex-col gap-4">
        <div className="cl-tabs" role="tablist" aria-label="How do you want to report?">
          <button role="tab" aria-selected={!speaking} className={!speaking ? 'is-on' : ''} onClick={() => setInputMode('type')}>
            <Keyboard size={16} /> Type it
          </button>
          <button role="tab" aria-selected={speaking} className={speaking ? 'is-on' : ''} onClick={() => setInputMode('speak')}>
            <Mic size={16} /> Speak it · English, Español, ਪੰਜਾਬੀ
          </button>
        </div>

        {speaking && <VoicePanel onResult={applyVoice} onReset={clearVoice} />}

        {(!speaking || voice) && (
          <>
            <div>
              <label className="cl-label">Issue title{speaking ? ' (English, for city staff)' : ''}</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Traffic signal not working" maxLength={120} className="cl-input mt-1" />
            </div>

            <div>
              <label className="cl-label">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="cl-input mt-1">
                {CATEGORY_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {!speaking && (
          <div>
            <label className="cl-label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="The traffic light at this intersection has stopped functioning…"
              rows={4}
              maxLength={800}
              className="cl-input mt-1 resize-none"
            />
          </div>
        )}

        <div className="flex items-center gap-2 text-sm cl-muted">
          <MapPin size={14} /> Affected area: {mode === 'point' ? 'Selected point on map' : `Area (~${radiusMeters ?? 0}m radius)`}
        </div>

        {(!speaking || voice) && (
          <>
            <div>
              <label className="cl-label">Perceived severity</label>
              <div className="flex gap-2 mt-1">
                {(['low', 'medium', 'high'] as Severity[]).map((s) => (
                  <button key={s} className={`cl-toggle flex-1 capitalize ${severity === s ? 'is-on' : ''}`} onClick={() => setSeverity(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="cl-btn full cursor-pointer">
                <Camera size={16} /> {photo ? 'Replace photo' : 'Add a photo (optional)'}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </label>
              {photo && <img src={photo} alt="Attached preview" className="mt-2 rounded-[var(--r-md)] max-h-40 object-cover w-full" />}
            </div>
          </>
        )}

        <Button variant="primary" size="lg" full onClick={handleSubmit} disabled={!canSubmit}>Submit Report</Button>
      </div>
    </Sheet>
  )
}
