import { pool } from "./pool.js";

const prompts = [
  {
    title: "Project planning",
    category: "Plan",
    description: "Turn an idea into a structured, achievable engineering plan.",
    content: `Act as a senior software architect. Help me plan this project: [PROJECT IDEA]. Identify the users, problems solved, functional and non-functional requirements, MVP scope, architecture, database entities, API endpoints, security requirements, risks, and milestones. Separate must-have features from optional features. Do not generate application code yet. State assumptions and ask only essential clarifying questions. Produce an implementation roadmap with clear acceptance criteria for each milestone.`
  },
  {
    title: "Understand an existing codebase",
    category: "Analyze",
    description: "Map an unfamiliar project before making changes.",
    content: `Act as a senior software engineer. Analyze this codebase: [REPOSITORY / FILES / CODE]. Explain the application structure, entry points, major modules, data flow, dependencies, API routes, database interactions, authentication, and configuration. Identify important conventions, risks, and areas that need clarification. Do not change code yet. Support conclusions with file paths or code references, distinguish facts from assumptions, and finish with a concise onboarding guide.`
  },
  {
    title: "Implement a feature",
    category: "Build",
    description: "Plan and implement a feature without unnecessary scope creep.",
    content: `Act as a senior full-stack engineer. Implement this feature: [FEATURE]. Project context: [STACK AND RELEVANT FILES]. First identify the existing patterns and requirements. Propose the smallest complete implementation, including UI, API, data changes, validation, loading and error states, accessibility, and tests where relevant. Preserve existing behavior and conventions. Avoid unrelated refactors and new dependencies unless justified. List the files to change, explain key decisions, and provide acceptance criteria and manual verification steps.`
  },
  {
    title: "Debug an error",
    category: "Debug",
    description: "Find the root cause before applying a fix.",
    content: `Act as a systematic debugging engineer. Investigate this issue: [ERROR / UNEXPECTED BEHAVIOR]. Expected behavior: [EXPECTED]. Actual behavior: [ACTUAL]. Relevant code, logs, and environment: [DETAILS]. Identify the most likely root cause and explain the evidence. Separate confirmed facts from hypotheses. Recommend the smallest safe fix, explain why it works, and provide a regression test plus steps to verify the fix. Do not guess at missing code or hide uncertainty.`
  },
  {
    title: "Code review",
    category: "Review",
    description: "Review code for correctness, maintainability, and risk.",
    content: `Act as a senior engineer reviewing this change: [DIFF / CODE]. Focus on correctness, edge cases, security, data integrity, performance, accessibility, maintainability, and consistency with the project. Report only actionable findings, ordered by severity. For each finding, include the file/area, why it matters, a realistic failure scenario, and a recommended fix. Distinguish blocking issues from suggestions. If no issue is found in an area, do not invent one. End with tests or checks that should run before merging.`
  },
  {
    title: "REST API design",
    category: "Backend",
    description: "Design consistent and predictable REST endpoints.",
    content: `Act as a senior backend engineer. Design a REST API for [RESOURCE / FEATURE] using [BACKEND STACK]. Define resources, endpoint paths, HTTP methods, request and response examples, status codes, validation rules, pagination/filtering/sorting, authentication and authorization, error format, and idempotency where relevant. Follow REST conventions and avoid unnecessary endpoints. Explain how the API handles missing resources, invalid input, conflicts, and unexpected failures. Include an implementation checklist and representative tests.`
  },
  {
    title: "Database design",
    category: "Database",
    description: "Create a reliable relational schema with integrity rules.",
    content: `Act as a senior database engineer. Design a PostgreSQL schema for [APPLICATION REQUIREMENTS]. Identify entities, columns, primary keys, foreign keys, constraints, relationships, cardinalities, and appropriate indexes. Apply normalization where beneficial, enforce integrity in the database, and consider transactions, deletion behavior, uniqueness, nullability, and query patterns. Provide SQL DDL and sample queries. Explain design trade-offs and migration considerations. Avoid premature indexing.`
  },
  {
    title: "Automated testing",
    category: "Testing",
    description: "Build a useful test plan and test cases.",
    content: `Act as a senior test engineer. Create a test strategy for [FEATURE / APPLICATION] using [TEST STACK]. Identify critical user journeys, unit tests, integration tests, API tests, and end-to-end tests where appropriate. Cover valid inputs, invalid inputs, boundaries, permissions, failures, and regression risks. For each test, state setup, action, expected result, and the behavior it protects. Prefer deterministic tests and meaningful assertions. Avoid testing implementation details unless necessary. Include the commands needed to run the tests.`
  },
  {
    title: "Security review",
    category: "Security",
    description: "Identify practical application security risks.",
    content: `Act as an application security engineer. Review [APPLICATION / CODE / ARCHITECTURE] for risks involving authentication, authorization, input validation, injection, secrets, sessions, file handling, sensitive data exposure, dependencies, logging, and configuration. Prioritize findings by severity and realistic exploitability. For each finding, describe the affected area, impact, evidence, and specific mitigation. Do not claim a vulnerability without evidence. Include a short verification checklist and distinguish immediate fixes from longer-term improvements.`
  },
  {
    title: "Refactor safely",
    category: "Maintain",
    description: "Improve code structure while preserving behavior.",
    content: `Act as a senior engineer specializing in maintainable code. Refactor [CODE / MODULE] to improve [GOAL] while preserving externally observable behavior. First describe current behavior and risks. Propose small, incremental changes; preserve public interfaces unless a change is justified. Avoid unrelated changes and unnecessary abstractions. Identify tests that establish behavior before refactoring, then provide the revised code and explain the changes. Include regression checks and note any behavior that intentionally changes.`
  },
  {
    title: "Git and pull request",
    category: "Delivery",
    description: "Prepare a clean, reviewable change for delivery.",
    content: `Act as an experienced software engineer. Help prepare [CHANGE] for delivery using Git and GitHub. Review the intended scope, suggest a clear branch name and commit messages, identify files that should not be committed, and check for secrets or generated files. Draft a concise pull request title and description with summary, motivation, implementation notes, tests performed, screenshots if useful, and known risks. Do not claim tests passed unless results are provided. Include a pre-merge checklist.`
  },
  {
    title: "Learn an unfamiliar technology",
    category: "Learn",
    description: "Learn a new technology through a practical, staged plan.",
    content: `Act as a patient senior developer and technical mentor. Help me learn [TECHNOLOGY] for [GOAL / PROJECT]. My current knowledge is [CURRENT LEVEL], and I can study [TIME AVAILABLE]. Build a staged learning path from essential concepts to practical application. For each stage, explain what to learn, why it matters, a small hands-on exercise, common mistakes, and a way to check understanding. Use my existing stack where helpful. Prioritize building and explaining a small working project over passive reading. Do not assume I already know advanced concepts.`
  }
];

let client;
let transactionStarted = false;
try {
  client = await pool.connect();
  await client.query("BEGIN");
  transactionStarted = true;
  await client.query("SELECT pg_advisory_xact_lock($1::bigint)", ["684319720153"]);
  const result = await client.query("SELECT COUNT(*)::int AS count FROM prompts");
  if (result.rows[0].count === 0) {
    const userResult = await client.query("SELECT id FROM users ORDER BY id LIMIT 1");
    const userId = userResult.rows[0]?.id ?? null;
    for (const prompt of prompts) {
      await client.query(
        "INSERT INTO prompts (user_id, title, category, description, content) VALUES ($1, $2, $3, $4, $5)",
        [userId, prompt.title, prompt.category, prompt.description, prompt.content]
      );
    }
    console.log(`Seeded ${prompts.length} starter prompts.`);
  } else {
    console.log("Prompts table is not empty; skipped seed.");
  }
  await client.query("COMMIT");
  transactionStarted = false;
} catch (error) {
  if (client && transactionStarted) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Seeding rollback failed:", rollbackError.message);
    }
  }
  console.error("Seeding failed:", error.message);
  process.exitCode = 1;
} finally {
  client?.release();
  await pool.end();
}
