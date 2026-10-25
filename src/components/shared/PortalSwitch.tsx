import { useLocation, useNavigate } from 'react-router-dom'
import { Landmark, Users } from 'lucide-react'

const PORTALS = [
  { path: '/resident', label: 'Resident', icon: Users },
  { path: '/leadership', label: 'Leadership', icon: Landmark },
] as const

/** Top-right switch between the two portals; shared localStorage state keeps them in sync. */
export function PortalSwitch() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div className="cl-portal-switch" role="tablist" aria-label="Switch portal">
      {PORTALS.map(({ path, label, icon: Icon }) => {
        const active = pathname.startsWith(path)
        return (
          <button
            key={path}
            role="tab"
            aria-selected={active}
            className={active ? 'is-on' : ''}
            onClick={() => { if (!active) navigate(path) }}
            title={active ? `You're in the ${label} view` : `Switch to the ${label} view`}
          >
            <Icon size={14} /> {label}
          </button>
        )
      })}
    </div>
  )
}
