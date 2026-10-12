import { useEffect, useMemo, useState } from "react";
import { Check, Code2, Plus } from "lucide-react";
import AuthScreen from "./AuthScreen.jsx";
import { request } from "./api.js";
import AppHeader from "./components/AppHeader.jsx";
import LibrarySidebar from "./components/LibrarySidebar.jsx";
import PromptDetail from "./components/PromptDetail.jsx";
import PromptEditor from "./components/PromptEditor.jsx";
import PromptLibraryPanel from "./components/PromptLibraryPanel.jsx";
import PromptStats from "./components/PromptStats.jsx";
import { emptyForm, oauthErrorMessages } from "./constants.js";

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
      <AppHeader user={user} onLogout={logout} onCreatePrompt={startCreate}/>

      <main className="layout">
        <LibrarySidebar category={category} onCategoryChange={setCategory} prompts={prompts}/>

        <section className="main-content">
          <div className="page-intro">
            <div>
              <div className="eyebrow">PERSONAL WORKSPACE / PROMPT LIBRARY</div>
              <h1>Your engineering<br className="mobile-break"/> toolkit.</h1>
              <p>A home for the prompts that make your development workflow sharper.</p>
            </div>
            <div className="intro-icon"><Code2 size={29}/></div>
          </div>

          <PromptStats counts={counts}/>

          <div className="workspace">
            <PromptLibraryPanel
              search={search}
              onSearchChange={setSearch}
              prompts={prompts}
              activeId={activeId}
              onSelectPrompt={selectPrompt}
              onCreatePrompt={startCreate}
            />

            <section className="detail-panel">
              {view === "form" ? (
                <PromptEditor
                  activeId={activeId}
                  form={form}
                  onUpdateForm={updateForm}
                  onSave={savePrompt}
                  busy={busy}
                  error={error}
                  onClose={() => { setView("detail"); setError(""); }}
                  onCancel={() => setView("detail")}
                />
              ) : displayPrompt ? (
                <PromptDetail
                  prompt={displayPrompt}
                  customOpen={customOpen}
                  customText={customText}
                  onEdit={startEdit}
                  onDelete={deletePrompt}
                  onCustomize={openCustomizer}
                  onCustomTextChange={setCustomText}
                  onCloseCustomizer={() => setCustomOpen(false)}
                  onCopy={copyText}
                  error={error}
                  notice={notice}
                />
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
