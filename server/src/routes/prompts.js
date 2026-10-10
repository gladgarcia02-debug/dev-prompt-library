import { Router } from "express";
import { pool } from "../db/pool.js";

const router = Router();
const categories = new Set([
  "Plan", "Analyze", "Build", "Debug", "Review", "Backend",
  "Database", "Testing", "Security", "Maintain", "Delivery", "Learn", "Other"
]);

function validatePrompt(body) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const errors = [];
  if (!title) errors.push("Title is required.");
  if (title.length > 120) errors.push("Title must be 120 characters or fewer.");
  if (!category || !categories.has(category)) errors.push("Choose a valid category.");
  if (description.length > 300) errors.push("Description must be 300 characters or fewer.");
  if (!content) errors.push("Prompt content is required.");
  if (errors.length) return { errors };
  return { data: { title, category, description, content, is_favorite: Boolean(body.is_favorite) } };
}

router.get("/", async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const category = String(req.query.category || "").trim();
    const result = await pool.query(
      `SELECT * FROM prompts
       WHERE user_id = $1
         AND ($2 = '' OR category = $2)
         AND ($3 = '' OR title ILIKE '%' || $3 || '%'
              OR description ILIKE '%' || $3 || '%'
              OR content ILIKE '%' || $3 || '%')
       ORDER BY is_favorite DESC, updated_at DESC, id DESC`,
      [req.userId, category, search]
    );
    res.json(result.rows);
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT * FROM prompts WHERE id = $1 AND user_id = $2",
      [req.params.id, req.userId]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Prompt not found." });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  const validated = validatePrompt(req.body);
  if (validated.errors) return res.status(400).json({ errors: validated.errors });
  try {
    const { title, category, description, content, is_favorite } = validated.data;
    const result = await pool.query(
      `INSERT INTO prompts (user_id, title, category, description, content, is_favorite)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.userId, title, category, description, content, is_favorite]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.put("/:id", async (req, res, next) => {
  const validated = validatePrompt(req.body);
  if (validated.errors) return res.status(400).json({ errors: validated.errors });
  try {
    const { title, category, description, content, is_favorite } = validated.data;
    const result = await pool.query(
      `UPDATE prompts SET title=$1, category=$2, description=$3, content=$4,
       is_favorite=$5, updated_at=NOW() WHERE id=$6 AND user_id=$7 RETURNING *`,
      [title, category, description, content, is_favorite, req.params.id, req.userId]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Prompt not found." });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await pool.query(
      "DELETE FROM prompts WHERE id=$1 AND user_id=$2 RETURNING id",
      [req.params.id, req.userId]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Prompt not found." });
    res.status(204).end();
  } catch (error) { next(error); }
});

export default router;
