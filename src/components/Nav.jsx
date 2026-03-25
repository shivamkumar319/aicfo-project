import { tr } from '../lib/utils'

export default function Nav({ screen, setScreen, lang }) {
  const items = [
    {
      id: 'home', label: tr(lang, 'navHome'),
      icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    },
    {
      id: 'detail', label: tr(lang, 'navDetails'),
      icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
    },
    {
      id: 'add', label: tr(lang, 'navAdd'),
      icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
    },
  ]

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: 390, maxWidth: '100vw', background: '#fff', borderTop: '1px solid #E5E7EB',
      display: 'flex', zIndex: 50,
    }}>
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => setScreen(item.id)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 3, padding: '9px 4px 7px', cursor: 'pointer', border: 'none', background: 'none',
          }}
        >
          <span style={{ width: 21, height: 21, display: 'flex', stroke: screen === item.id ? '#16A34A' : '#9CA3AF' }}>
            {item.icon}
          </span>
          <span style={{ fontSize: 10, color: screen === item.id ? '#16A34A' : '#9CA3AF', fontFamily: "'DM Sans', sans-serif", fontWeight: screen === item.id ? 600 : 400 }}>
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  )
}
