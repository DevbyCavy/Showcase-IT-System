import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

// Scale is Leaflet core (L.control.scale). Fullscreen and "my location" are small custom
// L.Control subclasses rather than pulling in extra plugin packages (leaflet.fullscreen,
// leaflet.locatecontrol) — two buttons don't justify two more dependencies. Zoom is Leaflet's
// default control, already present on every MapContainer. See MIGRATION_PLAN.md §24 (Leaflet
// rewrite).
export function MapControls() {
  const map = useMap()

  useEffect(() => {
    const scale = L.control.scale({ imperial: false }).addTo(map)

    const FullscreenControl = L.Control.extend({
      onAdd() {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control')
        const link = L.DomUtil.create('a', '', container) as HTMLAnchorElement
        link.href = '#'
        link.title = 'Toggle fullscreen'
        link.innerHTML = '⛶'
        link.style.fontSize = '16px'
        link.style.lineHeight = '26px'
        link.style.textAlign = 'center'
        L.DomEvent.on(link, 'click', (e) => {
          L.DomEvent.stop(e)
          const el = map.getContainer()
          if (!document.fullscreenElement) {
            el.requestFullscreen?.().catch(() => {})
          } else {
            document.exitFullscreen?.()
          }
        })
        return container
      },
    })
    const fullscreenControl = new FullscreenControl({ position: 'topleft' })
    fullscreenControl.addTo(map)

    const LocateControl = L.Control.extend({
      onAdd() {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control')
        const link = L.DomUtil.create('a', '', container) as HTMLAnchorElement
        link.href = '#'
        link.title = 'My location'
        link.innerHTML = '📍'
        link.style.fontSize = '14px'
        link.style.lineHeight = '26px'
        link.style.textAlign = 'center'
        L.DomEvent.on(link, 'click', (e) => {
          L.DomEvent.stop(e)
          if (!('geolocation' in navigator)) return
          navigator.geolocation.getCurrentPosition((pos) => {
            map.setView([pos.coords.latitude, pos.coords.longitude], 15)
          })
        })
        return container
      },
    })
    const locateControl = new LocateControl({ position: 'topleft' })
    locateControl.addTo(map)

    return () => {
      map.removeControl(scale)
      map.removeControl(fullscreenControl)
      map.removeControl(locateControl)
    }
  }, [map])

  return null
}
