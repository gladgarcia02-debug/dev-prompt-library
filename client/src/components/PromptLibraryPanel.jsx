import { ChevronRight, FileText, Plus, Search, Star, X } from "lucide-react";

function PromptLibraryPanel({ search, onSearchChange, prompts, activeId, onSelectPrompt, onCreatePrompt }) {
  return (
    <section className="prompt-list-panel">
      <div className="list-header"><div><h2>Prompt library</h2><p>Browse, edit, and reuse your templates.</p></div></div>
      <label className="search-box">
        <Search size={17}/>
        <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search prompts..."/>
        {search && <button className="icon-btn clear-search" onClick={() => onSearchChange("")} aria-label="Clear search"><X size={14}/></button>}
      </label>
      <div className="prompt-list">
        {prompts.map((prompt, index) => (
          <button key={prompt.id} className={`prompt-list-item ${activeId === prompt.id ? "active" : ""}`} onClick={() => onSelectPrompt(prompt)}>
            <div className="prompt-number">{String(index + 1).padStart(2, "0")}</div>
            <div className="prompt-item-copy"><strong>{prompt.title}</strong><span>{prompt.description}</span><em>{prompt.category}</em></div>
            {prompt.is_favorite && <Star size={14} className="favorite-small" fill="currentColor"/>}
            <ChevronRight size={16} className="list-chevron"/>
          </button>
        ))}
        {prompts.length === 0 && (
          <div className="empty-list">
            <FileText size={25}/>
            <strong>No prompts found</strong>
            <span>Try another search or create a new prompt.</span>
            <button className="text-btn" onClick={onCreatePrompt}>Create prompt</button>
          </div>
        )}
      </div>
      <button className="add-prompt-link" onClick={onCreatePrompt}><Plus size={16}/> Add a new prompt</button>
    </section>
  );
}

export default PromptLibraryPanel;