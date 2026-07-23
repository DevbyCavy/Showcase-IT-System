// Low-opacity company-logo watermark for the "subtle branded background" cards (profile card,
// calendar widget) called for in the full-app redesign brief. Own file so both DashboardSidePanel
// and TaskCalendar can import it without a circular dependency (DashboardSidePanel renders
// TaskCalendar).
export function LogoWatermark({ className = '' }: { className?: string }) {
  return (
    <img
      src="/showcaseit-icon.png"
      alt=""
      aria-hidden="true"
      className={`pointer-events-none absolute -right-10 -bottom-10 h-44 w-44 opacity-[0.06] select-none ${className}`}
    />
  )
}
