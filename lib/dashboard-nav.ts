/**
 * Dashboard navigation config. Add new items here to add tabs to the sidebar.
 * icon: key used to look up the icon in the sidebar (add new icons in DashboardSidebar).
 */
export const DASHBOARD_NAV = [
  { href: '/', label: 'Dashboard', icon: 'dashboard' },
  { href: '/messages', label: 'Messages', icon: 'messages' },
  { href: '/leads', label: 'Leads', icon: 'leads' },
  { href: '/reviews', label: 'Reviews', icon: 'reviews' },
  { href: '/instruction-files', label: 'Instruction Files', icon: 'instruction-files' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
] as const

export type DashboardNavItem = (typeof DASHBOARD_NAV)[number]
