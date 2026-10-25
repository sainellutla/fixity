import { useEffect, useMemo, useRef, useState } from 'react'
import { useCivicStore } from '../../hooks/useCivicStore'
import { CivicMap } from '../map/CivicMap'
import { LeadershipSidebar, type LeadershipView } from './LeadershipSidebar'
import { LeadershipTopbar } from './LeadershipTopbar'
import { LeadershipIssueDrawer } from './IssueDrawer'
import { PriorityQueue } from './PriorityQueue'
import { ActionPlanSheet } from './ActionPlanSheet'
import { AiIntelligencePage } from './AiIntelligencePage'
import { ActiveProjects } from './ActiveProjects'
import { CommunityFeedback } from './CommunityFeedback'
import { ResourceDirectoryPage } from './ResourceDirectoryPage'
import { PerformancePage } from './PerformancePage'
import { SettingsPage } from './SettingsPage'
import { Toasts } from '../shared/Toasts'

export function LeadershipShell() {
  const { state } = useCivicStore()
  const [view, setView] = useState<LeadershipView>('command')
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)
  const [planIssueId, setPlanIssueId] = useState<string | null>(null)

  const issues = useMemo(() => Object.values(state.issues), [state.issues])

  const [recentIssueId, setRecentIssueId] = useState<string | null>(null)
  const seenIssueIds = useRef<Set<string> | null>(null)
  useEffect(() => {
    const ids = Object.keys(state.issues)
    if (seenIssueIds.current === null) {
      seenIssueIds.current = new Set(ids)
      return
    }
    const fresh = ids.filter((id) => !seenIssueIds.current!.has(id))
    ids.forEach((id) => seenIssueIds.current!.add(id))
    if (fresh.length === 0) return
    setRecentIssueId(fresh[fresh.length - 1])
    const t = setTimeout(() => setRecentIssueId(null), 8000)
    return () => clearTimeout(t)
  }, [state.issues])
  const selectedIssue = selectedIssueId ? state.issues[selectedIssueId] ?? null : null
  const notifications = Object.values(state.notifications).filter((n) => n.targetRole === 'leadership')

  function openIssue(issueId: string) {
    setSelectedIssueId(issueId)
    setView('command')
  }

  return (
    <div className="civic-app" style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      <CivicMap
        issues={issues}
        selectedIssueId={selectedIssueId}
        recentIssueId={recentIssueId}
        flyToIssue={selectedIssue}
        reportMode="none"
        onSelect={openIssue}
        onPick={() => {}}
      />

      <LeadershipTopbar issues={issues} notifications={notifications} onOpenIssue={openIssue} onOpenQueue={() => setView('queue')} />

      <LeadershipSidebar view={view} onViewChange={setView} />

      {selectedIssue && <LeadershipIssueDrawer issue={selectedIssue} onClose={() => setSelectedIssueId(null)} onOpenPlan={() => setPlanIssueId(selectedIssue.id)} />}

      <PriorityQueue open={view === 'queue'} onClose={() => setView('command')} onOpenIssue={openIssue} onOpenPlan={setPlanIssueId} />
      <AiIntelligencePage open={view === 'ai'} onClose={() => setView('command')} onOpenIssue={openIssue} />
      <ActiveProjects open={view === 'projects'} onClose={() => setView('command')} onOpenIssue={openIssue} />
      <CommunityFeedback open={view === 'feedback'} onClose={() => setView('command')} onOpenIssue={openIssue} />
      <ResourceDirectoryPage open={view === 'directory'} onClose={() => setView('command')} />
      <PerformancePage open={view === 'performance'} onClose={() => setView('command')} />
      <SettingsPage open={view === 'settings'} onClose={() => setView('command')} />

      <ActionPlanSheet issue={planIssueId ? state.issues[planIssueId] ?? null : null} onClose={() => setPlanIssueId(null)} />

      <Toasts role="leadership" onOpenIssue={openIssue} />
    </div>
  )
}
