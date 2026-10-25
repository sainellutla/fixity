import { useRef, useState } from 'react'
import { Circle, useMapEvents } from 'react-leaflet'
import type { LeafletMouseEvent } from 'leaflet'
import { distanceMeters } from '../../lib/geo'

export type ReportMode = 'none' | 'point' | 'area'

interface MapClickLayerProps {
  mode: ReportMode
  onPick: (result: { lat: number; lng: number; radiusMeters?: number }) => void
}

export function MapClickLayer({ mode, onPick }: MapClickLayerProps) {
  const [draft, setDraft] = useState<{ lat: number; lng: number; radiusMeters: number } | null>(null)
  const draggingRef = useRef(false)

  const map = useMapEvents({
    click(e: LeafletMouseEvent) {
      if (mode !== 'point') return
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
    mousedown(e: LeafletMouseEvent) {
      if (mode !== 'area') return
      draggingRef.current = true
      map.dragging.disable()
      setDraft({ lat: e.latlng.lat, lng: e.latlng.lng, radiusMeters: 1 })
    },
    mousemove(e: LeafletMouseEvent) {
      if (mode !== 'area' || !draggingRef.current) return
      setDraft((prev) => {
        if (!prev) return prev
        const radiusMeters = Math.max(20, distanceMeters(prev.lat, prev.lng, e.latlng.lat, e.latlng.lng))
        return { ...prev, radiusMeters }
      })
    },
    mouseup() {
      if (mode !== 'area' || !draggingRef.current) return
      draggingRef.current = false
      map.dragging.enable()
      setDraft((prev) => {
        if (prev) onPick({ lat: prev.lat, lng: prev.lng, radiusMeters: Math.round(prev.radiusMeters) })
        return null
      })
    },
  })

  if (mode !== 'area' || !draft) return null

  return (
    <Circle
      center={[draft.lat, draft.lng]}
      radius={draft.radiusMeters}
      pathOptions={{ color: '#e5583a', fillColor: '#e5583a', dashArray: '6 4', fillOpacity: 0.18, weight: 2 }}
    />
  )
}
