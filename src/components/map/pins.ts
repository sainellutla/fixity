import L from 'leaflet'
import type { Issue } from '../../lib/types'

const RING_COLOR: Record<string, string | null> = {
  reported: null,
  acknowledged: 'var(--cl-progress)',
  under_review: 'var(--cl-progress)',
  in_progress: 'var(--cl-progress)',
  resolved: 'var(--cl-resolved)',
  community_verified: 'var(--cl-resolved)',
  reopened: 'var(--cl-critical)',
}

export function buildPinIcon(issue: Issue, isNew = false): L.DivIcon {
  const ring = RING_COLOR[issue.status]
  const count = issue.reportIds.length
  const badge = count > 1 ? `<span class="cl-pin-badge">${count}</span>` : ''
  const ringHtml = ring ? `<span class="cl-pin-ring" style="border-color:${ring}"></span>` : ''

  const html = `
    <div style="position:relative;width:28px;height:28px;">
      ${ringHtml}
      <div class="cl-pin ${issue.priority}${isNew ? ' is-new' : ''}"></div>
      ${badge}
    </div>
  `

  return L.divIcon({
    html,
    className: 'cl-pin-wrapper',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  })
}
