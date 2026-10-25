import { CheckCircle2, FileText, Flame, Layers, Wrench } from 'lucide-react'
import type { Issue } from '../../lib/types'
import { Gauge } from '../ui/Gauge'

function isActive(status: Issue['status']): boolean {
  return status !== 'resolved' && status !== 'community_verified'
}

export function MetricCards({ issues, onOpenQueue }: { issues: Issue[]; onOpenQueue?: () => void }) {
  const total = Math.max(1, issues.length)
  const active = issues.filter((i) => isActive(i.status)).length
  const critical = issues.filter((i) => i.priority === 'critical' && isActive(i.status)).length
  const totalReports = issues.reduce((sum, i) => sum + i.reportIds.length, 0)
  const inProgress = issues.filter((i) => i.status === 'in_progress').length
  const resolved = issues.filter((i) => i.status === 'resolved' || i.status === 'community_verified').length

  return (
    <div className="cl-gauges" role="group" aria-label="City operations metrics">
      <Gauge icon={<Layers size={15} />} value={active} label="Active Issues" color="#f2b544" meter={(active / total) * 100} onClick={onOpenQueue} />
      <Gauge icon={<Flame size={15} />} value={critical} label="Critical Issues" color="#e5583a" meter={(critical / total) * 100} danger={critical > 0} onClick={onOpenQueue} />
      <Gauge icon={<FileText size={15} />} value={totalReports} label="Reports" color="#f3a9b9" meter={Math.min(100, totalReports * 8)} />
      <Gauge icon={<Wrench size={15} />} value={inProgress} label="In Progress" color="#49b4d6" meter={(inProgress / total) * 100} />
      <Gauge icon={<CheckCircle2 size={15} />} value={resolved} label="Resolved" color="#6cbf5a" meter={(resolved / total) * 100} />
    </div>
  )
}
