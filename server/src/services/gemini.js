import { GoogleGenerativeAI, GoogleGenerativeAIRequestInputError } from "@google/generative-ai";

const MODEL_NAME = "gemini-flash-lite-latest";

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "your_gemini_api_key_here") {
    const err = new Error("Gemini API key is not configured on the server.");
    err.code = "GEMINI_NOT_CONFIGURED";
    throw err;
  }
  return new GoogleGenerativeAI(key);
}

function summarizeStudent(s) {
  return {
    name: s.name,
    college: s.college || "",
    graduationYear: s.graduationYear,
    cgpa: s.cgpa,
    skills: s.skills || [],
    projects: (s.projects || []).map((p) => ({ title: p.title, description: p.description })),
    certifications: (s.certifications || []).map((c) => ({ name: c.name, issuer: c.issuer })),
    codingProfiles: (s.codingProfiles || []).map((c) => ({ platform: c.platform, url: c.url })),
  };
}

function summarizeCompany(c) {
  return {
    name: c.name,
    industry: c.industry || "",
    description: c.description || "",
    roles: (c.roles || []).map((r) => ({
      title: r.title,
      package: r.package,
      location: r.location,
      eligibility: r.eligibility,
    })),
    eligibilityCriteria: c.eligibilityCriteria || {},
    hiringProcess: c.hiringProcess || [],
  };
}

const SYSTEM_INSTRUCTION = `You are an expert campus placement coach for Indian engineering students.
Given a student's real profile and a company's actual hiring requirements, build a personalized, structured preparation plan.
Base every recommendation on the student's actual skills and the company's actual requirements — never invent skills the student does not have.
Return ONLY valid JSON matching the requested schema. Do not include markdown fences or commentary.`;

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string", description: "One-paragraph overview of the plan and its focus." },
    durationDays: { type: "integer", description: "Total number of days the plan covers." },
    priorityTopics: {
      type: "array",
      items: {
        type: "object",
        properties: {
          topic: { type: "string" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          reason: { type: "string" },
        },
        required: ["topic", "priority", "reason"],
      },
    },
    dailyTasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "integer" },
          title: { type: "string" },
          topics: { type: "array", items: { type: "string" } },
          practice: { type: "array", items: { type: "string" } },
          estMinutes: { type: "integer" },
        },
        required: ["day", "title", "topics", "practice", "estMinutes"],
      },
    },
    resources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          type: { type: "string" },
          reason: { type: "string" },
        },
        required: ["name", "type", "reason"],
      },
    },
  },
  required: ["summary", "durationDays", "priorityTopics", "dailyTasks", "resources"],
};

export function buildPrompt(student, company, availableDays) {
  return `Create a preparation plan for the student below to prepare for the specified company.
The student has ${availableDays} day(s) available to prepare.

STUDENT PROFILE (real data from DB):
${JSON.stringify(summarizeStudent(student), null, 2)}

COMPANY REQUIREMENTS (real data from DB):
${JSON.stringify(summarizeCompany(company), null, 2)}

Requirements:
- Spread tasks across exactly ${availableDays} day(s). Number days 1..${availableDays}.
- Prioritize the skills the company expects that the student is weak or missing in.
- For every priority topic, give a concrete reason tied to the company's roles/process or the student's gaps.
- "practice" entries must be concrete (e.g. "3 LeetCode mediums on two-pointer", "write a 200-word project summary").
- Keep "estMinutes" realistic per day (120-360).
Return only JSON matching the schema.`;
}

export function validatePlan(plan) {
  if (!plan || typeof plan !== "object") return "Response is not an object.";
  if (typeof plan.summary !== "string" || !plan.summary.trim()) return "Missing 'summary'.";
  if (!Number.isInteger(plan.durationDays) || plan.durationDays < 1) return "'durationDays' must be a positive integer.";
  if (!Array.isArray(plan.priorityTopics)) return "Missing 'priorityTopics' array.";
  for (const p of plan.priorityTopics) {
    if (typeof p.topic !== "string" || typeof p.reason !== "string") return "A priorityTopic is missing topic/reason.";
    if (!["high", "medium", "low"].includes(p.priority)) return "Invalid priority value.";
  }
  if (!Array.isArray(plan.dailyTasks) || plan.dailyTasks.length === 0) return "Missing non-empty 'dailyTasks'.";
  for (const d of plan.dailyTasks) {
    if (!Number.isInteger(d.day) || d.day < 1) return "A dailyTask has an invalid day.";
    if (typeof d.title !== "string" || !Array.isArray(d.topics) || !Array.isArray(d.practice)) {
      return "A dailyTask is missing required fields.";
    }
  }
  if (!Array.isArray(plan.resources)) return "Missing 'resources' array.";
  return null;
}

// ── Company Intelligence Enrichment ───────────────────────────────

const COMPANY_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    industry: { type: "string" },
    headquarters: { type: "string" },
    description: { type: "string", description: "2-3 sentence company overview" },
    website: { type: "string" },
    roles: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          package: { type: "string", description: "e.g. 8.5 LPA" },
          location: { type: "string" },
          eligibility: { type: "string" },
        },
      },
    },
    eligibilityCriteria: {
      type: "object",
      properties: {
        minCgpa: { type: "number" },
        allowedBranches: { type: "array", items: { type: "string" } },
        backlogAllowed: { type: "boolean" },
      },
    },
    requiredSkills: { type: "array", items: { type: "string" } },
    hiringProcess: { type: "array", items: { type: "string" } },
    oaPatterns: {
      type: "array",
      items: {
        type: "object",
        properties: {
          round: { type: "string" },
          type: { type: "string" },
          duration: { type: "string" },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          description: { type: "string" },
          topics: { type: "array", items: { type: "string" } },
        },
      },
    },
    interviewQuestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          type: { type: "string", enum: ["technical", "behavioral", "coding", "hr", "other"] },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          round: { type: "string" },
        },
      },
    },
    preparationResources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          type: { type: "string", enum: ["article", "video", "course", "book", "practice", "other"] },
          url: { type: "string" },
          topic: { type: "string" },
          description: { type: "string" },
        },
      },
    },
  },
  required: ["name", "industry", "description", "requiredSkills", "hiringProcess"],
};

const COMPANY_SYSTEM = `You are an expert campus placement researcher for Indian engineering students.
Given a company name, generate a realistic, detailed intelligence profile that would help a student prepare for placements at that company.
Include realistic but fictional data — do NOT copy real proprietary interview questions verbatim. Generate plausible questions based on common topics.
Return ONLY valid JSON matching the schema. No markdown fences or commentary.`;

export async function generateCompanyIntelligence(companyName) {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: COMPANY_SYSTEM,
    generationConfig: {
      temperature: 0.6,
      responseMimeType: "application/json",
      responseSchema: COMPANY_SCHEMA,
    },
  });

  const prompt = `Generate a comprehensive placement intelligence profile for "${companyName}".
Include:
- Industry and headquarters
- A 2-3 sentence description
- 1-2 realistic entry-level roles with package (in LPA), location, and eligibility text
- Eligibility criteria (minCgpa, allowedBranches, backlogAllowed)
- 5-8 required skills
- A step-by-step hiring process (4-5 rounds)
- 1-2 OA pattern descriptions with difficulty, duration, topics
- 4-6 interview questions across different rounds and types
- 3-5 preparation resources (use example.com URLs, realistic titles)`;

  let text;
  try {
    const result = await model.generateContent(prompt);
    text = result.response.text();
  } catch (err) {
    if (err instanceof GoogleGenerativeAIRequestInputError) {
      const e = new Error("Gemini rejected the request input.");
      e.code = "GEMINI_BAD_INPUT";
      throw e;
    }
    const status = err?.status || err?.code;
    if (status === 429) {
      const e = new Error("Gemini rate limit reached. Please retry shortly.");
      e.code = "GEMINI_RATE_LIMIT";
      throw e;
    }
    const e = new Error("Gemini call failed.");
    e.code = "GEMINI_ERROR";
    e.cause = err.message;
    throw e;
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const e = new Error("Gemini returned non-JSON output.");
    e.code = "GEMINI_INVALID_OUTPUT";
    throw e;
  }

  if (!parsed || typeof parsed.name !== "string" || !parsed.name.trim()) {
    const e = new Error("Gemini output invalid: missing company name.");
    e.code = "GEMINI_INVALID_OUTPUT";
    throw e;
  }

  return parsed;
}

export async function generatePreparationPlan(student, company, availableDays) {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json",
      responseSchema: OUTPUT_SCHEMA,
    },
  });

  const prompt = buildPrompt(student, company, availableDays);
  let text;
  try {
    const result = await model.generateContent(prompt);
    text = result.response.text();
  } catch (err) {
    if (err instanceof GoogleGenerativeAIRequestInputError) {
      const e = new Error("Gemini rejected the request input.");
      e.code = "GEMINI_BAD_INPUT";
      e.cause = err.message;
      throw e;
    }
    const status = err?.status || err?.code;
    if (status === 429) {
      const e = new Error("Gemini rate limit reached. Please retry shortly.");
      e.code = "GEMINI_RATE_LIMIT";
      throw e;
    }
    const e = new Error("Gemini call failed.");
    e.code = "GEMINI_ERROR";
    e.cause = err.message;
    throw e;
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const e = new Error("Gemini returned non-JSON output.");
    e.code = "GEMINI_INVALID_OUTPUT";
    throw e;
  }
  const validationError = validatePlan(parsed);
  if (validationError) {
    const e = new Error(`Gemini output invalid: ${validationError}`);
    e.code = "GEMINI_INVALID_OUTPUT";
    throw e;
  }
  return parsed;
}
