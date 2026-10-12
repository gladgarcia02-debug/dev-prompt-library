import { Code2, LogOut, Plus } from "lucide-react";

function AppHeader({ user, onLogout, onCreatePrompt }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark"><Code2 size={21}/></div>
        <div><div className="brand-name">DevPrompt</div><div className="brand-sub">YOUR ENGINEERING PLAYBOOK</div></div>
      </div>
      <div className="top-actions">
        <span className="saved-label"><span className="live-dot"/> {user?.email}</span>
        <button className="secondary-btn logout-btn" onClick={onLogout} aria-label="Log out">
          <LogOut size={15}/><span className="logout-label">Log out</span>
        </button>
        <button className="primary-btn" onClick={onCreatePrompt}><Plus size={17}/> New prompt</button>
      </div>
    </header>
  );
}

export default AppHeader;