import { Check, Copy, Pencil, Trash2, WandSparkles, X } from "lucide-react";

function PromptDetail({
  prompt,
  customOpen,
  customText,
  onEdit,
  onDelete,
  onCustomize,
  onCustomTextChange,
  onCloseCustomizer,
  onCopy,
  error,
  notice
}) {
  return (
    <>
      <div className="detail-topline">
        <span className="pill">{prompt.category.toUpperCase()}</span>
        <div className="detail-actions">
          <button className="icon-btn" onClick={() => onEdit(prompt)} title="Edit prompt"><Pencil size={16}/></button>
          <button className="icon-btn danger-hover" onClick={() => onDelete(prompt)} title="Delete prompt"><Trash2 size={16}/></button>
        </div>
      </div>
      <h2 className="detail-title">{prompt.title}</h2>
      <p className="detail-subtitle">{prompt.description}</p>
      <div className="content-label"><span>YOUR PROMPT</span><span className="content-label-right"><span className="live-dot"/> REUSABLE TEMPLATE</span></div>
      <pre className="prompt-content">{prompt.content}</pre>
      {customOpen && (
        <div className="customizer">
          <div className="customizer-head">
            <div><WandSparkles size={16}/><strong>Customize this prompt</strong></div>
            <button className="icon-btn" onClick={onCloseCustomizer} aria-label="Close customizer"><X size={16}/></button>
          </div>
          <p>Replace placeholders such as [PROJECT IDEA] with your own details before copying.</p>
          <textarea value={customText} onChange={(event) => onCustomTextChange(event.target.value)} rows={8}/>
          <button className="primary-btn" onClick={() => onCopy(customText)}><Copy size={16}/> Copy customized prompt</button>
        </div>
      )}
      {error && <div className="error-message">{error}</div>}
      {notice && <div className="success-message"><Check size={15}/>{notice}</div>}
      <div className="detail-footer">
        <div className="updated-label">UPDATED {new Date(prompt.updated_at).toLocaleDateString()}</div>
        <div className="detail-footer-actions">
          <button className="secondary-btn" onClick={() => onCustomize(prompt)}><WandSparkles size={16}/> Customize</button>
          <button className="primary-btn" onClick={() => onCopy(prompt.content)}><Copy size={16}/> Copy prompt</button>
        </div>
      </div>
    </>
  );
}

export default PromptDetail;