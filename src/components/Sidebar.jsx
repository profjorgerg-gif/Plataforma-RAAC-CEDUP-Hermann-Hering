export default function Sidebar({ menu, ui, patchUi, onExit }) {
  return (
    <aside id="sidebar" className={ui.sidebarOpen ? 'open' : ''}>
      <div className="brand">
        <div className="brand-title">RAAC</div>
        <div className="brand-sub">
          Responsabilidade · Assiduidade
          <br />
          Atitude · Comprometimento
        </div>
      </div>
      <nav className="menu">
        {menu.map((m) => (
          <button
            key={m.id}
            className={`menu-item ${ui.view === m.id ? 'active' : ''}`}
            onClick={() => patchUi({ view: m.id, sidebarOpen: false })}
          >
            <span className="ic">{m.icon}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-foot">
        <button className="exit-btn" onClick={onExit}>
          ⭳ Backup e sair
        </button>
      </div>
    </aside>
  )
}
