export default function Sidebar({ menu, ui, patchUi, perfil, onSair, onBackup }) {
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
        {perfil && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)', marginBottom: 10, wordBreak: 'break-all' }}>
            {perfil.email}
            <br />
            <span className="badge neutro" style={{ marginTop: 4 }}>
              {perfil.role === 'mestre' ? 'Usuário mestre' : 'Professor'}
            </span>
          </div>
        )}
        <button className="exit-btn" onClick={onBackup} style={{ marginBottom: onSair ? 8 : 0 }}>
          ⭳ Baixar backup
        </button>
        {onSair && (
          <button className="exit-btn" onClick={onSair}>
            🚪 Sair
          </button>
        )}
      </div>
    </aside>
  )
}
