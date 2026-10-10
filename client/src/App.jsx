import { useEffect, useMemo, useState } from "react";
import {
  Search, Plus, Copy, Pencil, Trash2, Code2, ChevronRight,
  BookOpen, Star, X, Check, ArrowLeft, WandSparkles, FileText, LogOut
} from "lucide-react";
import AuthScreen from "./AuthScreen.jsx";
import { request } from "./api.js";

const CATEGORIES = ["Plan", "Analyze", "Build", "Debug", "Review", "Backend", "Database", "Testing", "Security", "Maintain", "Delivery", "Learn", "Other"];
const emptyForm = { title: "", category: "Plan", description: "", content: "", is_favorite: false };
const oauthErrorMessages = {
  google_not_configured: "Google sign-in is not configured. Add Google OAuth credentials to the server environment.",
  google_cancelled: "Google sign-in was cancelled.",
  google_unverified_email: "Google must verify your email address before you can sign in.",
  google_account_conflict: "This Google account could not be linked. Try signing in with your existing account.",
  google_failed: "Google sign-in could not be completed. Please try again."
};

function readOAuthError() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("auth_error");
  if (!code) return "";
  params.delete("auth_error");
  const query = params.toString();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`
  );
  return oauthErrorMessages[code] || oauthErrorMessages.google_failed;
}

function App() {
  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState("loading");
  const [authMessage, setAuthMessage] = useState("");
  const [sessionError, setSessionError] = useState("");
  const [prompts, setPrompts] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All prompts");
  const [view, setView] = useState("detail");
  const [form, setForm] = useState(emptyForm);
  const [customText, setCustomText] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function checkSession() {
    setAuthStatus("loading");
    setSessionError("");
    try {
      const data = await request("/auth/me");
      setUser(data.user);
      setAuthMessage("");
      setAuthStatus("authenticated");
    } catch (sessionError) {
      setUser(null);
      setAuthStatus("unauthenticated");
      if (sessionError.status !== 401) setSessionError(sessionError.message);
    }
  }

  useEffect(() => {
    const oauthError = readOAuthError();
    if (oauthError) setAuthMessage(oauthError);
    checkSession();
  }, []);

  async function authenticate(path, credentials) {
    const data = await request(`/auth/${path}`, {
      method: "POST",
      body: JSON.stringify(credentials)
    });
    setUser(data.user);
    setAuthMessage("");
    setError("");
    setAuthStatus("authenticated");
  }

  function expireSession() {
    setUser(null);
    setPrompts([]);
    setAuthMessage("Your session expired. Please log in again.");
    setAuthStatus("unauthenticated");
  }

  async function logout() {
    try {
      await request("/auth/logout", { method: "POST" });
      setUser(null);
      setPrompts([]);
      setAuthMessage("");
      setError("");
      setAuthStatus("unauthenticated");
    } catch (logoutError) {
      if (logoutError.status === 401) expireSession();
      else setError(logoutError.message);
    }
  }

  async function load() {
    try {
      const query = new URLSearchParams();
      if (search.trim()) query.set("search", search.trim());
      if (category !== "All prompts") query.set("category", category);
      const data = await request(`/prompts?${query.toString()}`);
      setPrompts(data);
      if (activeId && !data.some((p) => p.id === activeId)) setActiveId(null);
    } catch (e) {
      if (e.status === 401) expireSession();
      else setError(e.message);
    }
  }

  useEffect(() => {
    if (authStatus === "authenticated") load();
  }, [search, category, authStatus]);
  const active = prompts.find((p) => p.id === activeId) || null;
  const counts = useMemo(() => ({
    total: prompts.length,
    categories: new Set(prompts.map((p) => p.category)).size,
    favorites: prompts.filter((p) => p.is_favorite).length
  }), [prompts]);

  function startCreate() {
    setForm(emptyForm); setActiveId(null); setView("form"); setError(""); setNotice("");
  }
  function startEdit(prompt) {
    setForm({ title: prompt.title, category: prompt.category, description: prompt.description, content: prompt.content, is_favorite: prompt.is_favorite });
    setActiveId(prompt.id); setView("form"); setError(""); setNotice("");
  }
  function selectPrompt(prompt) {
    setActiveId(prompt.id); setView("detail"); setCustomOpen(false); setError(""); setNotice("");
  }
  function updateForm(key, value) { setForm((current) => ({ ...current, [key]: value })); }

  async function savePrompt(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const saved = activeId
        ? await request(`/prompts/${activeId}`, { method: "PUT", body: JSON.stringify(form) })
        : await request("/prompts", { method: "POST", body: JSON.stringify(form) });
      await load();
      setActiveId(saved.id); setView("detail"); setNotice(activeId ? "Prompt updated successfully." : "Prompt created successfully.");
    } catch (e) {
      if (e.status === 401) expireSession();
      else setError(e.message);
    }
    finally { setBusy(false); }
  }

  async function deletePrompt(prompt) {
    if (!window.confirm(`Delete "${prompt.title}"? This cannot be undone.`)) return;
    try {
      await request(`/prompts/${prompt.id}`, { method: "DELETE" });
      if (activeId === prompt.id) setActiveId(null);
      await load(); setNotice("Prompt deleted.");
    } catch (e) {
      if (e.status === 401) expireSession();
      else setError(e.message);
    }
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Copied to clipboard.");
    } catch {
      setError("Clipboard access was blocked. Select and copy the text manually.");
    }
  }

  function openCustomizer(prompt) {
    setCustomText(prompt.content); setCustomOpen(true); setError(""); setNotice("");
  }

  const displayPrompt = active || prompts[0] || null;

  if (authStatus === "loading") {
    return <main className="auth-loading" role="status" aria-live="polite">Checking your session...</main>;
  }

  if (authStatus !== "authenticated") {
    return (
      <AuthScreen
        initialError={authMessage || sessionError}
        onLogin={(credentials) => authenticate("login", credentials)}
        onRegister={(credentials) => authenticate("register", credentials)}
        onRetry={sessionError ? checkSession : undefined}
      />
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Code2 size={21}/></div>
          <div><div className="brand-name">DevPrompt</div><div className="brand-sub">YOUR ENGINEERING PLAYBOOK</div></div>
        </div>
        <div className="top-actions">
          <span className="saved-label"><span className="live-dot"/> {user?.email}</span>
          <button className="secondary-btn logout-btn" onClick={logout} aria-label="Log out">
            <LogOut size={15}/><span className="logout-label">Log out</span>
          </button>
          <button className="primary-btn" onClick={startCreate}><Plus size={17}/> New prompt</button>
        </div>
      </header>

      <main className="layout">
        <aside className="sidebar">
          <div className="side-heading">LIBRARY</div>
          <button className={`nav-item ${category === "All prompts" ? "selected" : ""}`} onClick={() => setCategory("All prompts")}>
            <BookOpen size={17}/> All prompts <span className="nav-count">{prompts.length}</span>
          </button>
          <div className="side-heading category-heading">CATEGORIES</div>
          {CATEGORIES.filter((c) => prompts.some((p) => p.category === c)).map((c) => (
            <button key={c} className={`nav-item ${category === c ? "selected" : ""}`} onClick={() => setCategory(c)}>
              <span className={`category-dot dot-${c.toLowerCase()}`}/>{c}
              <span className="nav-count">{prompts.filter((p) => p.category === c).length}</span>
            </button>
          ))}
          <div className="sidebar-note">
            <div className="note-icon"><WandSparkles size={17}/></div>
            <strong>Make every prompt count.</strong>
            <p>Save your best engineering workflows and reuse them whenever you build.</p>
          </div>
          <div className="sidebar-footer">DEV PROMPT LIBRARY <span>v1.0</span></div>
        </aside>

        <section className="main-content">
          <div className="page-intro">
            <div>
              <div className="eyebrow">PERSONAL WORKSPACE / PROMPT LIBRARY</div>
              <h1>Your engineering<br className="mobile-break"/> toolkit.</h1>
              <p>A home for the prompts that make your development workflow sharper.</p>
            </div>
            <div className="intro-icon"><Code2 size={29}/></div>
          </div>

          <div className="stats-row">
            <div className="stat-card"><span className="stat-icon purple"><FileText size={17}/></span><div><strong>{counts.total}</strong><span>Prompts found</span></div></div>
            <div className="stat-card"><span className="stat-icon blue"><BookOpen size={17}/></span><div><strong>{counts.categories}</strong><span>Categories</span></div></div>
            <div className="stat-card"><span className="stat-icon amber"><Star size={17}/></span><div><strong>{counts.favorites}</strong><span>Favorites</span></div></div>
          </div>

          <div className="workspace">
            <section className="prompt-list-panel">
              <div className="list-header"><div><h2>Prompt library</h2><p>Browse, edit, and reuse your templates.</p></div></div>
              <label className="search-box"><Search size={17}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search prompts..."/>{search && <button className="icon-btn clear-search" onClick={() => setSearch("")} aria-label="Clear search"><X size={14}/></button>}</label>
              <div className="prompt-list">
                {prompts.map((prompt, index) => (
                  <button key={prompt.id} className={`prompt-list-item ${activeId === prompt.id ? "active" : ""}`} onClick={() => selectPrompt(prompt)}>
                    <div className="prompt-number">{String(index + 1).padStart(2, "0")}</div>
                    <div className="prompt-item-copy"><strong>{prompt.title}</strong><span>{prompt.description}</span><em>{prompt.category}</em></div>
                    {prompt.is_favorite && <Star size={14} className="favorite-small" fill="currentColor"/>}
                    <ChevronRight size={16} className="list-chevron"/>
                  </button>
                ))}
                {prompts.length === 0 && <div className="empty-list"><FileText size={25}/><strong>No prompts found</strong><span>Try another search or create a new prompt.</span><button className="text-btn" onClick={startCreate}>Create prompt</button></div>}
              </div>
              <button className="add-prompt-link" onClick={startCreate}><Plus size={16}/> Add a new prompt</button>
            </section>

            <section className="detail-panel">
              {view === "form" ? (
                <form className="editor-form" onSubmit={savePrompt}>
                  <div className="detail-topline"><span className="pill">{activeId ? "EDIT TEMPLATE" : "NEW TEMPLATE"}</span><button type="button" className="icon-btn" onClick={() => { setView("detail"); setError(""); }} aria-label="Close editor"><X size={17}/></button></div>
                  <h2>{activeId ? "Edit prompt" : "Create a prompt"}</h2>
                  <p className="detail-subtitle">Give your reusable prompt a clear name and useful instructions.</p>
                  <label className="field-label">Prompt title<input required maxLength="120" value={form.title} onChange={(e) => updateForm("title", e.target.value)} placeholder="e.g. Review a pull request"/></label>
                  <label className="field-label">Category<select value={form.category} onChange={(e) => updateForm("category", e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
                  <label className="field-label">Short description<input maxLength="300" value={form.description} onChange={(e) => updateForm("description", e.target.value)} placeholder="What does this prompt help you do?"/></label>
                  <label className="field-label">Prompt content<textarea required rows="12" value={form.content} onChange={(e) => updateForm("content", e.target.value)} placeholder="Write your reusable prompt here..."/></label>
                  <label className="favorite-check"><input type="checkbox" checked={form.is_favorite} onChange={(e) => updateForm("is_favorite", e.target.checked)}/> Mark as favorite</label>
                  {error && <div className="error-message">{error}</div>}
                  <div className="form-actions"><button type="button" className="secondary-btn" onClick={() => setView("detail")}>Cancel</button><button className="primary-btn" disabled={busy}>{busy ? "Saving..." : <><Check size={16}/> Save prompt</>}</button></div>
                </form>
              ) : displayPrompt ? (
                <>
                  <div className="detail-topline"><span className="pill">{displayPrompt.category.toUpperCase()}</span><div className="detail-actions"><button className="icon-btn" onClick={() => startEdit(displayPrompt)} title="Edit prompt"><Pencil size={16}/></button><button className="icon-btn danger-hover" onClick={() => deletePrompt(displayPrompt)} title="Delete prompt"><Trash2 size={16}/></button></div></div>
                  <h2 className="detail-title">{displayPrompt.title}</h2>
                  <p className="detail-subtitle">{displayPrompt.description}</p>
                  <div className="content-label"><span>YOUR PROMPT</span><span className="content-label-right"><span className="live-dot"/> REUSABLE TEMPLATE</span></div>
                  <pre className="prompt-content">{displayPrompt.content}</pre>
                  {customOpen && <div className="customizer"><div className="customizer-head"><div><WandSparkles size={16}/><strong>Customize this prompt</strong></div><button className="icon-btn" onClick={() => setCustomOpen(false)} aria-label="Close customizer"><X size={16}/></button></div><p>Replace placeholders such as [PROJECT IDEA] with your own details before copying.</p><textarea value={customText} onChange={(e) => setCustomText(e.target.value)} rows={8}/><button className="primary-btn" onClick={() => copyText(customText)}><Copy size={16}/> Copy customized prompt</button></div>}
                  {error && <div className="error-message">{error}</div>}
                  {notice && <div className="success-message"><Check size={15}/>{notice}</div>}
                  <div className="detail-footer"><div className="updated-label">UPDATED {new Date(displayPrompt.updated_at).toLocaleDateString()}</div><div className="detail-footer-actions"><button className="secondary-btn" onClick={() => openCustomizer(displayPrompt)}><WandSparkles size={16}/> Customize</button><button className="primary-btn" onClick={() => copyText(displayPrompt.content)}><Copy size={16}/> Copy prompt</button></div></div>
                </>
              ) : (
                <div className="welcome-state"><div className="welcome-icon"><Code2 size={30}/></div><h2>Your next great prompt starts here.</h2><p>Select a prompt from the library or create a new one to get started.</p><button className="primary-btn" onClick={startCreate}><Plus size={17}/> Create prompt</button></div>
              )}
            </section>
          </div>
          <footer className="page-footer"><span>Built for thoughtful engineering.</span><span>CREATE · REFINE · REUSE</span></footer>
        </section>
      </main>
      {notice && view === "form" && <div className="toast"><Check size={15}/>{notice}</div>}
    </div>
  );
}

export default App;
