import { Fragment } from 'react'
import { Circle, Marker, Tooltip } from 'react-leaflet'
import type { Issue } from '../../lib/types'
import { buildPinIcon } from './pins'

interface MapMarkersProps {
  issues: Issue[]
  selectedIssueId: string | null
  recentIssueId: string | null
  onSelect: (issueId: string) => void
}

export function MapMarkers({ issues, selectedIssueId, recentIssueId, onSelect }: MapMarkersProps) {
  return (
    <>
      {issues.map((issue) => (
        <Fragment key={issue.id}>
          <Marker
            position={[issue.lat, issue.lng]}
            icon={buildPinIcon(issue, issue.id === recentIssueId)}
            eventHandlers={{ click: () => onSelect(issue.id) }}
          >
            <Tooltip direction="top" offset={[0, -24]}>
              <strong>{issue.title}</strong>
              <br />
              {issue.reportIds.length} report{issue.reportIds.length === 1 ? '' : 's'}
            </Tooltip>
          </Marker>
          {issue.id === selectedIssueId && issue.affectedArea.mode === 'area' && issue.affectedArea.radiusMeters && (
            <Circle
              center={[issue.lat, issue.lng]}
              radius={issue.affectedArea.radiusMeters}
              pathOptions={{ color: '#f2b544', fillColor: '#f2b544', dashArray: '6 4', fillOpacity: 0.15, weight: 2 }}
            />
          )}
        </Fragment>
      ))}
    </>
  )
}
