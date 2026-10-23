// Deterministic skill-gap analysis service.
// No AI calls — all logic is rules-based so results are explainable and testable.

// ── Skill normalization ──────────────────────────────────────────
// Normalize a skill string for comparison: lowercase, trim, collapse spaces,
// and map common aliases to a canonical form.
const ALIASES = {
  js: "javascript",
  ts: "typescript",
  "c++": "cpp",
  "c plus plus": "cpp",
  "c#": "csharp",
  "c sharp": "csharp",
  "node": "nodejs",
  "node.js": "nodejs",
  "react.js": "react",
  "vue.js": "vue",
  "next.js": "nextjs",
  "express.js": "express",
  "py": "python3",
  "golang": "go",
  "k8s": "kubernetes",
  "postgres": "postgresql",
  "mongo": "mongodb",
  "rest api": "rest",
  "rest apis": "rest",
  "restful apis": "rest",
  "restful api": "rest",
  "data structures and algorithms": "dsa",
  "data structures": "dsa",
  "algorithms": "dsa",
  "ds": "dsa",
  "algo": "dsa",
  "problem solving": "dsa",
  "object oriented programming": "oop",
  "object-oriented programming": "oop",
  "oopa": "oop",
  "dbms": "database management",
  "os": "operating systems",
  "computer networks": "networking",
  "cn": "networking",
  "ml": "machine learning",
  "ai": "artificial intelligence",
  "nlp": "natural language processing",
  "ui ux": "ui/ux",
  "ui/ux design": "ui/ux",
  "devops": "devops",
  "ci/cd": "ci cd",
  "ci cd": "ci cd",
  "version control": "git",
  "git/github": "git",
};

export function normalizeSkill(skill) {
  if (!skill || typeof skill !== "string") return "";
  let s = skill.trim().toLowerCase().replace(/\s+/g, " ");
  if (ALIASES[s]) s = ALIASES[s];
  return s;
}

export function normalizeSkills(skills) {
  if (!Array.isArray(skills)) return [];
  return skills
    .map(normalizeSkill)
    .filter(Boolean);
}

// Match student skills against company required skills.
// Returns:
//   matched:  required skills the student has (original company labels)
//   missing:  required skills the student does not have (original labels)
//   matchMap: { normalizedRequired: normalizedStudentSkill } for matched
export function matchSkills(studentSkills, companySkills) {
  const studentSet = new Set(normalizeSkills(studentSkills));

  const matched = [];
  const missing = [];
  const matchMap = {};

  for (const raw of companySkills) {
    const normalized = normalizeSkill(raw);
    if (studentSet.has(normalized)) {
      matched.push(raw);
      matchMap[normalized] = normalized;
    } else {
      missing.push(raw);
    }
  }

  return { matched, missing, matchMap };
}

// ── Eligibility checks (deterministic) ───────────────────────────
// Each criterion returns { passed: boolean, label, detail }
export function checkEligibility(student, company) {
  const criteria = company.eligibilityCriteria || {};
  const results = [];

  // CGPA check
  if (criteria.minCgpa != null) {
    const studentCgpa = student.cgpa;
    if (studentCgpa == null) {
      results.push({
        criterion: "CGPA",
        passed: false,
        label: `Minimum CGPA ${criteria.minCgpa}`,
        detail: `Your CGPA is not set.`,
      });
    } else {
      const passed = studentCgpa >= criteria.minCgpa;
      results.push({
        criterion: "CGPA",
        passed,
        label: `Minimum CGPA ${criteria.minCgpa}`,
        detail: passed
          ? `Your CGPA ${studentCgpa} meets the minimum.`
          : `Your CGPA ${studentCgpa} is below the minimum ${criteria.minCgpa}.`,
      });
    }
  }

  // Graduation year check
  if (criteria.graduationYear && criteria.graduationYear.length > 0) {
    const studentYear = student.graduationYear;
    if (studentYear == null) {
      results.push({
        criterion: "Graduation Year",
        passed: false,
        label: `Graduation year: ${criteria.graduationYear.join(", ")}`,
        detail: `Your graduation year is not set.`,
      });
    } else {
      const passed = criteria.graduationYear.includes(studentYear);
      results.push({
        criterion: "Graduation Year",
        passed,
        label: `Graduation year: ${criteria.graduationYear.join(", ")}`,
        detail: passed
          ? `Your graduation year ${studentYear} is eligible.`
          : `Your graduation year ${studentYear} is not in the allowed list: ${criteria.graduationYear.join(", ")}.`,
      });
    }
  }

  // Branch check
  if (criteria.allowedBranches && criteria.allowedBranches.length > 0) {
    const studentBranch = student.branch;
    if (!studentBranch) {
      results.push({
        criterion: "Branch",
        passed: false,
        label: `Allowed branches: ${criteria.allowedBranches.join(", ")}`,
        detail: `Your branch is not set in your profile.`,
      });
    } else {
      const passed = criteria.allowedBranches.some(
        (b) => b.toLowerCase().trim() === studentBranch.toLowerCase().trim()
      );
      results.push({
        criterion: "Branch",
        passed,
        label: `Allowed branches: ${criteria.allowedBranches.join(", ")}`,
        detail: passed
          ? `Your branch (${studentBranch}) is allowed.`
          : `Your branch (${studentBranch}) is not in the allowed list.`,
      });
    }
  }

  // Backlog check
  if (criteria.backlogAllowed === false) {
    const studentBacklogs = student.backlogs;
    if (studentBacklogs == null) {
      results.push({
        criterion: "Backlogs",
        passed: false,
        label: "No active backlogs allowed",
        detail: `Your backlog status is not set.`,
      });
    } else {
      const passed = studentBacklogs === 0;
      results.push({
        criterion: "Backlogs",
        passed,
        label: "No active backlogs allowed",
        detail: passed
          ? `You have 0 active backlogs.`
          : `You have ${studentBacklogs} active backlog(s); this company does not allow any.`,
      });
    }
  }

  return results;
}

// ── Readiness score (documented formula) ─────────────────────────
// Readiness = (matchedSkills / totalRequiredSkills) * 100
// Returns null if the company has no required skills (can't compute meaningfully).
// The formula is deliberately simple and explainable:
//   - It measures skill coverage only (not eligibility).
//   - It does NOT weight by difficulty or priority.
//   - Eligibility pass/fail is reported separately.
export function computeReadiness(matched, missing) {
  const total = matched.length + missing.length;
  if (total === 0) return null;
  return Math.round((matched.length / total) * 100);
}

// ── Prioritized preparation tasks ─────────────────────────────────
// Build explainable prep tasks for each missing skill, grouped by priority.
// Priority is inferred from the company's OA pattern topics and interview
// question topics — if a missing skill appears in those topics, it's high
// priority; otherwise medium.
export function buildPrepTasks(missing, company) {
  if (!missing || missing.length === 0) return [];

  // Collect topics from OA patterns and interview questions.
  const hotTopics = new Set();
  for (const oa of company.oaPatterns || []) {
    for (const t of oa.topics || []) {
      hotTopics.add(normalizeSkill(t));
    }
  }
  for (const q of company.interviewQuestions || []) {
    if (q.round) hotTopics.add(normalizeSkill(q.round));
  }

  return missing.map((skill) => {
    const normalized = normalizeSkill(skill);
    const isHot = [...hotTopics].some((t) => t === normalized || t.includes(normalized) || normalized.includes(t));
    const priority = isHot ? "high" : "medium";

    let reason;
    if (isHot) {
      reason = `"${skill}" appears in the company's assessment patterns or interview rounds — prioritize this first.`;
    } else {
      reason = `"${skill}" is listed as a required skill but is not directly highlighted in the company's assessment topics.`;
    }

    // Find relevant resources from the company's prep resources.
    const resources = (company.preparationResources || []).filter((r) => {
      const topic = normalizeSkill(r.topic || "");
      return topic === normalized || (topic && (topic.includes(normalized) || normalized.includes(topic)));
    });

    return {
      skill,
      priority,
      reason,
      resourceCount: resources.length,
      resourceTitles: resources.map((r) => r.title),
    };
  }).sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });
}

// ── Full analysis ─────────────────────────────────────────────────
export function analyzeSkillGap(student, company) {
  const skills = matchSkills(student.skills || [], company.requiredSkills || []);
  const eligibility = checkEligibility(student, company);
  const readiness = computeReadiness(skills.matched, skills.missing);
  const prepTasks = buildPrepTasks(skills.missing, company);

  return {
    companyName: company.name,
    studentSkills: student.skills || [],
    companySkills: company.requiredSkills || [],
    matched: skills.matched,
    missing: skills.missing,
    eligibility,
    eligibilityPassed: eligibility.every((e) => e.passed),
    readiness,
    readinessFormula: readiness != null
      ? `(${skills.matched.length} matched / ${skills.matched.length + skills.missing.length} required) × 100 = ${readiness}%`
      : "No required skills to compare against.",
    prepTasks,
  };
}
