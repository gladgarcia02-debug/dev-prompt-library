import { BookOpen, WandSparkles } from "lucide-react";
import { CATEGORIES } from "../constants.js";

function LibrarySidebar({ category, onCategoryChange, prompts }) {
  return (
    <aside className="sidebar">
      <div className="side-heading">LIBRARY</div>
      <button className={`nav-item ${category === "All prompts" ? "selected" : ""}`} onClick={() => onCategoryChange("All prompts")}>
        <BookOpen size={17}/> All prompts <span className="nav-count">{prompts.length}</span>
      </button>
      <div className="side-heading category-heading">CATEGORIES</div>
      {CATEGORIES.filter((item) => prompts.some((prompt) => prompt.category === item)).map((item) => (
        <button key={item} className={`nav-item ${category === item ? "selected" : ""}`} onClick={() => onCategoryChange(item)}>
          <span className={`category-dot dot-${item.toLowerCase()}`}/>{item}
          <span className="nav-count">{prompts.filter((prompt) => prompt.category === item).length}</span>
        </button>
      ))}
      <div className="sidebar-note">
        <div className="note-icon"><WandSparkles size={17}/></div>
        <strong>Make every prompt count.</strong>
        <p>Save your best engineering workflows and reuse them whenever you build.</p>
      </div>
      <div className="sidebar-footer">DEV PROMPT LIBRARY <span>v1.0</span></div>
    </aside>
  );
}

export default LibrarySidebar;