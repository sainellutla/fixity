import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { MANTECA_CENTER, MANTECA_DEFAULT_ZOOM } from '../../lib/geo'
import type { Issue } from '../../lib/types'
import { MapClickLayer, type ReportMode } from './MapClickLayer'
import { MapMarkers } from './MapMarkers'

function FlyToIssue({ issue }: { issue: Issue | null }) {
  const map = useMap()
  useEffect(() => {
    if (issue) map.flyTo([issue.lat, issue.lng], Math.max(map.getZoom(), 16), { duration: 0.6 })
  }, [issue, map])
  return null
}

function ResetControl() {
  const map = useMap()
  return (
    <button
      className="cl-icon-btn"
      style={{ background: 'var(--cl-surface)', border: '1px solid var(--cl-line)' }}
      onClick={() => map.flyTo(MANTECA_CENTER, MANTECA_DEFAULT_ZOOM, { duration: 0.6 })}
      aria-label="Reset to Manteca"
      title="Reset to Manteca"
    >
      ⟲
    </button>
  )
}

interface CivicMapProps {
  issues: Issue[]
  selectedIssueId: string | null
  recentIssueId: string | null
  flyToIssue: Issue | null
  reportMode: ReportMode
  onSelect: (issueId: string) => void
  onPick: (result: { lat: number; lng: number; radiusMeters?: number }) => void
}

export function CivicMap({ issues, selectedIssueId, recentIssueId, flyToIssue, reportMode, onSelect, onPick }: CivicMapProps) {
  return (
    <div className="absolute inset-0" style={{ zIndex: 0, isolation: 'isolate' }}>
      <MapContainer
        center={MANTECA_CENTER}
        zoom={MANTECA_DEFAULT_ZOOM}
        className="cl-map-surface"
        style={{ width: '100%', height: '100%', background: '#e8ecf1', cursor: reportMode !== 'none' ? 'crosshair' : undefined }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <MapMarkers issues={issues} selectedIssueId={selectedIssueId} recentIssueId={recentIssueId} onSelect={onSelect} />
        <MapClickLayer mode={reportMode} onPick={onPick} />
        <FlyToIssue issue={flyToIssue} />
        <div className="absolute bottom-6 right-4 z-[1000]">
          <ResetControl />
        </div>
      </MapContainer>
    </div>
  )
}
