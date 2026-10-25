import { useEffect, useMemo, useRef, useState } from 'react'
import { civicRecord } from '../../lib/engine/points'
import { displayCode } from '../../lib/ids'
import { useCivicStore } from '../../hooks/useCivicStore'
import { useCurrentResident } from '../../hooks/useCurrentResident'
import { CivicMap } from '../map/CivicMap'
import type { ReportMode } from '../map/MapClickLayer'
import { ResidentSidebar, type ResidentView } from './ResidentSidebar'
import { ResidentTopbar } from './ResidentTopbar'
import { ResidentIssueDrawer } from './IssueDrawer'
import { ModeSelect } from './ReportFlow/ModeSelect'
import { ReportForm, type ReportFormValues } from './ReportFlow/ReportForm'
import { ConfirmationAnim } from './ReportFlow/ConfirmationAnim'
import { MyReports } from './MyReports'
import { Following } from './Following'
import { CommunityActivity } from './CommunityActivity'
import { DemoSettings } from './DemoSettings'
import { Toasts } from '../shared/Toasts'
import type { AiAnalysis } from '../../lib/types'

type FlowStage = 'closed' | 'modeSelect' | 'picking' | 'form' | 'confirming'

export function ResidentShell() {
  const { state, actions } = useCivicStore()
  const { resident, residentId } = useCurrentResident()

  const [view, setView] = useState<ResidentView>('overview')
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)
  const [recentIssueId, setRecentIssueId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [flowStage, setFlowStage] = useState<FlowStage>('closed')
  const [pickMode, setPickMode] = useState<'point' | 'area'>('point')
  const [picked, setPicked] = useState<{ lat: number; lng: number; radiusMeters?: number } | null>(null)
  const [submitResult, setSubmitResult] = useState<{ issueId: string; isNew: boolean; analysis: AiAnalysis } | null>(null)

  const allIssues = useMemo(() => Object.values(state.issues), [state.issues])
  const issues = useMemo(() => {
    if (!search.trim()) return allIssues
    const q = search.toLowerCase()
    return allIssues.filter((i) => {
      const descriptions = i.reportIds.map((id) => state.reports[id]?.description ?? '').join(' ')
      return `${i.title} ${displayCode(i.id)} ${descriptions}`.toLowerCase().includes(q)
    })
  }, [allIssues, state.reports, search])

  const selectedIssue = selectedIssueId ? state.issues[selectedIssueId] ?? null : null
  const myNotifications = Object.values(state.notifications).filter((n) => n.targetRole === 'resident' && n.targetResidentId === residentId)
  const record = useMemo(() => civicRecord(state, residentId), [state, residentId])
  const followingCount = Object.values(state.follows).filter((f) => f.residentId === residentId).length

  const [achievements, setAchievements] = useState<{ id: string; title: string; message: string }[]>([])
  const earnedRef = useRef<{ residentId: string; ids: Set<string> } | null>(null)
  useEffect(() => {
    const earned = new Set(record.badges.filter((b) => b.earned).map((b) => b.id))
    const prev = earnedRef.current
    earnedRef.current = { residentId, ids: earned }
    if (!prev || prev.residentId !== residentId) return
    const fresh = record.badges.filter((b) => b.earned && !prev.ids.has(b.id))
    if (fresh.length === 0) return
    setAchievements((list) => [
      ...list,
      ...fresh.map((b) => ({ id: `${residentId}:${b.id}:${Date.now()}`, title: `Badge unlocked: ${b.label}`, message: `${b.hint} · ${record.points} civic points` })),
    ])
  }, [record, residentId])

  useEffect(() => {
    if (flowStage !== 'picking') return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setFlowStage('closed')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [flowStage])

  function openIssue(issueId: string) {
    setSelectedIssueId(issueId)
    setView('map')
  }

  function handlePick(result: { lat: number; lng: number; radiusMeters?: number }) {
    setPicked(result)
    setFlowStage('form')
  }

  function handleSubmit(values: ReportFormValues) {
    const result = actions.submitReport({
      ...values,
      mode: pickMode,
      lat: picked!.lat,
      lng: picked!.lng,
      radiusMeters: picked?.radiusMeters,
      residentId,
    })
    setSubmitResult(result)
    setFlowStage('confirming')
    setRecentIssueId(result.issueId)
  }

  function finishFlow() {
    if (submitResult) setSelectedIssueId(submitResult.issueId)
    setFlowStage('closed')
    setPicked(null)
    setSubmitResult(null)
    setTimeout(() => setRecentIssueId(null), 6000)
  }

  const reportMode: ReportMode = flowStage === 'picking' ? pickMode : 'none'

  return (
    <div className="civic-app" style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      <CivicMap
        issues={issues}
        selectedIssueId={selectedIssueId}
        recentIssueId={recentIssueId}
        flyToIssue={selectedIssue}
        reportMode={reportMode}
        onSelect={openIssue}
        onPick={handlePick}
      />

      <ResidentTopbar
        residentName={resident.name}
        issues={allIssues}
        record={record}
        notifications={myNotifications}
        search={search}
        onSearchChange={setSearch}
        onOpenIssue={openIssue}
        onOpenRecord={() => setView('myReports')}
      />

      <ResidentSidebar
        view={view}
        onViewChange={setView}
        onStartReport={() => setFlowStage('modeSelect')}
        record={record}
        followingCount={followingCount}
        collapsed={false}
      />

      {selectedIssue && <ResidentIssueDrawer issue={selectedIssue} onClose={() => setSelectedIssueId(null)} />}

      {flowStage === 'picking' && (
        <div className="cl-banner">
          <strong>{pickMode === 'point' ? 'Pin it' : 'Draw it'}</strong>
          {pickMode === 'point' ? 'Click the map to place your report.' : 'Click and drag on the map to draw the affected area.'}
          <button className="cl-btn cl-btn-paper" style={{ minHeight: 32, padding: '4px 12px' }} onClick={() => setFlowStage('closed')}>Cancel <kbd style={{ fontSize: 11, opacity: .7 }}>Esc</kbd></button>
        </div>
      )}

      <ModeSelect
        open={flowStage === 'modeSelect'}
        onClose={() => setFlowStage('closed')}
        onChoose={(mode) => { setPickMode(mode); setFlowStage('picking') }}
      />

      <ReportForm
        open={flowStage === 'form'}
        onClose={() => setFlowStage('closed')}
        mode={pickMode}
        radiusMeters={picked?.radiusMeters}
        onSubmit={handleSubmit}
      />

      <ConfirmationAnim
        open={flowStage === 'confirming'}
        issueId={submitResult?.issueId ?? null}
        analysis={submitResult?.analysis ?? null}
        isNew={submitResult?.isNew ?? true}
        onDone={finishFlow}
      />

      <MyReports open={view === 'myReports'} onClose={() => setView('overview')} onOpenIssue={openIssue} />
      <Following open={view === 'following'} onClose={() => setView('overview')} onOpenIssue={openIssue} />
      <CommunityActivity open={view === 'activity'} onClose={() => setView('overview')} onOpenIssue={openIssue} />
      <DemoSettings open={view === 'settings'} onClose={() => setView('overview')} />

      <Toasts role="resident" residentId={residentId} onOpenIssue={openIssue} achievements={achievements} />
    </div>
  )
}
