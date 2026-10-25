import { Mic } from 'lucide-react'
import { residentName } from '../../hooks/useCurrentResident'
import { languageLabel } from '../../lib/voiceScripts'
import type { ResidentReport } from '../../lib/types'

export function ReportDescription({ report, showTime }: { report: ResidentReport; showTime?: boolean }) {
  const spoken = report.spokenLanguage
  const translated = spoken && spoken !== 'en' && report.originalText

  return (
    <div className="cl-card">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs" style={{ color: 'var(--cl-text-dim)' }}>
          {residentName(report.residentId)}
          {showTime && ` · ${new Date(report.createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`}
        </span>
        {spoken && <span className="cl-spoken-tag"><Mic size={11} /> Spoken in {languageLabel(spoken)}</span>}
      </div>
      {translated ? (
        <>
          <p className="text-sm mt-1 cl-orig" lang={spoken}>“{report.originalText}”</p>
          <span className="cl-label mt-2 block" style={{ fontSize: 10.5 }}>English translation · demo</span>
          <p className="text-sm">{report.description}</p>
        </>
      ) : (
        <p className="text-sm mt-1">{report.description}</p>
      )}
    </div>
  )
}
