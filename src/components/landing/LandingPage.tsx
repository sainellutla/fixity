import { useNavigate } from 'react-router-dom'
import { Landmark, Users } from 'lucide-react'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import { useCivicStore } from '../../hooks/useCivicStore'
import { MANTECA_CENTER } from '../../lib/geo'
import { buildPinIcon } from '../map/pins'
import { BrandMark } from '../ui/Brand'

export function LandingPage() {
  const navigate = useNavigate()
  const { state } = useCivicStore()
  const issues = Object.values(state.issues)
  const open = issues.filter((i) => i.status !== 'resolved' && i.status !== 'community_verified').length

  return (
    <div className="civic-app cl-title">
      <div className="cl-title-scene" aria-hidden="true">
        <MapContainer
          center={[MANTECA_CENTER[0], MANTECA_CENTER[1] - 0.004]}
          zoom={15}
          zoomControl={false}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          touchZoom={false}
          keyboard={false}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} attribution="&copy; OpenStreetMap contributors" />
          {issues.map((issue) => (
            <Marker key={issue.id} position={[issue.lat, issue.lng]} icon={buildPinIcon(issue)} interactive={false} />
          ))}
        </MapContainer>
      </div>
      <div className="cl-title-shade" />

      <main className="cl-title-card">
        <div className="cl-wordmark">
          <BrandMark size={64} />
          <h1>Fixity <em>Demo</em></h1>
        </div>
        <p className="cl-tagline">Your city. Your voice. Visible progress.</p>
        <p className="cl-pitch">
          Residents pin problems on a live map of Manteca. City leadership sees them instantly, prioritizes with LENS, and answers back — and everyone watches the fix happen.
        </p>

        <div className="cl-title-actions">
          <button className="cl-btn cl-btn-primary cl-btn-xl" onClick={() => navigate('/resident')}>
            <Users size={22} />
            <span className="cl-btn-stack">
              <span className="cl-display" style={{ fontSize: 22, fontWeight: 800 }}>Enter as Resident</span>
              <small>Report issues. Follow progress. Shape your community.</small>
            </span>
          </button>
          <button className="cl-btn cl-btn-xl" onClick={() => navigate('/leadership')}>
            <Landmark size={22} style={{ color: 'var(--cl-accent)' }} />
            <span className="cl-btn-stack">
              <span className="cl-display" style={{ fontSize: 22, fontWeight: 800 }}>Enter as City Leadership</span>
              <small>Understand your city. Prioritize concerns. Take action.</small>
            </span>
          </button>
        </div>

        <div className="flex gap-2 mt-5 flex-wrap">
          <span className="cl-ai-badge is-gold">{open} open issues in Manteca</span>
          <span className="cl-ai-badge">Demonstration environment</span>
        </div>

        <p className="cl-title-fine">
          Fixity is a hackathon demonstration prototype. No real government integration, authentication, or AI service is used. Open the two portals in separate tabs of the same browser to see them sync.
        </p>
      </main>
    </div>
  )
}
