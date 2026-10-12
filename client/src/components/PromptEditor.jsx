import { Check, X } from "lucide-react";
import { CATEGORIES } from "../constants.js";

function PromptEditor({ activeId, form, onUpdateForm, onSave, busy, error, onClose, onCancel }) {
  return (
    <form className="editor-form" onSubmit={onSave}>
      <div className="detail-topline">
        <span className="pill">{activeId ? "EDIT TEMPLATE" : "NEW TEMPLATE"}</span>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close editor"><X size={17}/></button>
      </div>
      <h2>{activeId ? "Edit prompt" : "Create a prompt"}</h2>
      <p className="detail-subtitle">Give your reusable prompt a clear name and useful instructions.</p>
      <label className="field-label">Prompt title<input required maxLength="120" value={form.title} onChange={(event) => onUpdateForm("title", event.target.value)} placeholder="e.g. Review a pull request"/></label>
      <label className="field-label">Category<select value={form.category} onChange={(event) => onUpdateForm("category", event.target.value)}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
      <label className="field-label">Short description<input maxLength="300" value={form.description} onChange={(event) => onUpdateForm("description", event.target.value)} placeholder="What does this prompt help you do?"/></label>
      <label className="field-label">Prompt content<textarea required rows="12" value={form.content} onChange={(event) => onUpdateForm("content", event.target.value)} placeholder="Write your reusable prompt here..."/></label>
      <label className="favorite-check"><input type="checkbox" checked={form.is_favorite} onChange={(event) => onUpdateForm("is_favorite", event.target.checked)}/> Mark as favorite</label>
      {error && <div className="error-message">{error}</div>}
      <div className="form-actions">
        <button type="button" className="secondary-btn" onClick={onCancel}>Cancel</button>
        <button className="primary-btn" disabled={busy}>{busy ? "Saving..." : <><Check size={16}/> Save prompt</>}</button>
      </div>
    </form>
  );
}

export default PromptEditor;