import { BookOpen, FileText, Star } from "lucide-react";

function PromptStats({ counts }) {
  return (
    <div className="stats-row">
      <div className="stat-card"><span className="stat-icon purple"><FileText size={17}/></span><div><strong>{counts.total}</strong><span>Prompts found</span></div></div>
      <div className="stat-card"><span className="stat-icon blue"><BookOpen size={17}/></span><div><strong>{counts.categories}</strong><span>Categories</span></div></div>
      <div className="stat-card"><span className="stat-icon amber"><Star size={17}/></span><div><strong>{counts.favorites}</strong><span>Favorites</span></div></div>
    </div>
  );
}

export default PromptStats;