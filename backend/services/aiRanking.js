/**
 * TalentAI Ranking Engine
 * Computes a weighted match score (0-100) for each candidate against a job.
 *
 * Score = 40% skillsMatch + 25% experienceMatch + 15% educationMatch + 20% keywordDensity
 */

const natural = require('natural');
const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();

// ─── Skill Normalization Map ───────────────────────────────────────────────
const SKILL_ALIASES = {
  'node': 'node.js', 'nodejs': 'node.js', 'node js': 'node.js',
  'react': 'react.js', 'reactjs': 'react.js', 'react js': 'react.js',
  'vue': 'vue.js', 'vuejs': 'vue.js',
  'typescript': 'typescript', 'ts': 'typescript',
  'javascript': 'javascript', 'js': 'javascript',
  'python': 'python', 'py': 'python',
  'postgresql': 'postgresql', 'postgres': 'postgresql',
  'mongodb': 'mongodb', 'mongo': 'mongodb',
  'kubernetes': 'kubernetes', 'k8s': 'kubernetes',
  'amazon web services': 'aws', 'amazon aws': 'aws',
  'google cloud platform': 'gcp', 'google cloud': 'gcp',
  'microsoft azure': 'azure',
  'machine learning': 'ml', 'deep learning': 'deep learning',
  'artificial intelligence': 'ai',
  'ci/cd': 'ci/cd', 'cicd': 'ci/cd',
  'devops': 'devops', 'dev ops': 'devops',
  'graphql': 'graphql', 'graph ql': 'graphql',
  'rest api': 'rest', 'restful': 'rest', 'rest apis': 'rest',
  'docker': 'docker',
  'terraform': 'terraform',
  'java': 'java',
  'go': 'golang', 'golang': 'golang',
  'rust': 'rust',
  'c++': 'c++', 'cpp': 'c++',
  'c#': 'c#', 'csharp': 'c#',
  '.net': '.net', 'dotnet': '.net',
  'spring': 'spring boot', 'spring boot': 'spring boot',
  'django': 'django', 'flask': 'flask', 'fastapi': 'fastapi',
  'redux': 'redux',
  'figma': 'figma',
  'tableau': 'tableau',
  'sql': 'sql',
  'mysql': 'mysql',
  'redis': 'redis',
  'elasticsearch': 'elasticsearch',
  'apache kafka': 'kafka', 'kafka': 'kafka',
};

function normalizeSkill(skill) {
  const lower = skill.toLowerCase().trim();
  return SKILL_ALIASES[lower] || lower;
}

// ─── Education Degree Levels ──────────────────────────────────────────────
const DEGREE_LEVELS = {
  'high school': 1, 'hs': 1, 'secondary': 1,
  'associate': 2, 'associates': 2,
  'bachelor': 3, 'bachelors': 3, 'bs': 3, 'ba': 3, 'b.s': 3, 'b.a': 3,
  'master': 4, 'masters': 4, 'ms': 4, 'ma': 4, 'm.s': 4, 'm.a': 4, 'mba': 4,
  'phd': 5, 'doctorate': 5, 'doctoral': 5, 'ph.d': 5,
};

function getEducationLevel(text) {
  const lower = text.toLowerCase();
  if (lower.includes('phd') || lower.includes('doctorate') || lower.includes('ph.d')) return 5;
  if (lower.includes('master') || lower.includes('mba') || lower.includes(' ms ') || lower.includes(' ma ')) return 4;
  if (lower.includes('bachelor') || lower.includes(' bs ') || lower.includes(' ba ') || lower.includes('b.s') || lower.includes('b.e')) return 3;
  if (lower.includes('associate')) return 2;
  if (lower.includes('high school') || lower.includes('secondary')) return 1;
  return 0;
}

// ─── Skills Match Score (40%) ─────────────────────────────────────────────
function computeSkillsMatch(candidateSkills, requiredSkills, niceToHaveSkills = []) {
  if (!requiredSkills || requiredSkills.length === 0) return 100;

  const normalizedCandidate = candidateSkills.map(normalizeSkill);
  const normalizedRequired = requiredSkills.map(normalizeSkill);
  const normalizedNice = niceToHaveSkills.map(normalizeSkill);

  let matchedRequired = 0;
  let matchedNice = 0;
  const matched = [];
  const missing = [];

  for (const skill of normalizedRequired) {
    if (normalizedCandidate.some((cs) => cs === skill || cs.includes(skill) || skill.includes(cs))) {
      matchedRequired++;
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }

  for (const skill of normalizedNice) {
    if (normalizedCandidate.some((cs) => cs === skill || cs.includes(skill) || skill.includes(cs))) {
      matchedNice++;
    }
  }

  const requiredScore = normalizedRequired.length > 0 ? (matchedRequired / normalizedRequired.length) * 100 : 100;
  const niceBonus = normalizedNice.length > 0 ? (matchedNice / normalizedNice.length) * 10 : 0;

  const score = Math.min(100, requiredScore + niceBonus);
  return { score: Math.round(score), matched, missing };
}

// ─── Experience Match Score (25%) ─────────────────────────────────────────
function computeExperienceMatch(candidateYears, requiredYears) {
  if (!requiredYears || requiredYears === 0) return 100;

  const ratio = candidateYears / requiredYears;

  // Sigmoid-like scoring
  if (ratio >= 1.5) return 100;  // Overqualified: still 100
  if (ratio >= 1.0) return 95;   // Exact match or slightly more
  if (ratio >= 0.8) return 80;   // Close (within 20%)
  if (ratio >= 0.6) return 60;
  if (ratio >= 0.4) return 40;
  if (ratio >= 0.2) return 20;
  return 5;
}

// ─── Education Match Score (15%) ─────────────────────────────────────────
function computeEducationMatch(candidateLevel, requiredText = '') {
  if (!requiredText) return 100;

  const requiredLevel = getEducationLevel(requiredText);
  if (requiredLevel === 0) return 100;

  if (candidateLevel >= requiredLevel) return 100;
  if (candidateLevel === requiredLevel - 1) return 65;
  if (candidateLevel === requiredLevel - 2) return 30;
  return 10;
}

// ─── Keyword Density Score (20%) ─────────────────────────────────────────
function computeKeywordDensity(resumeText, jobDescription) {
  if (!resumeText || !jobDescription) return 50; // neutral

  const tfidf = new TfIdf();
  tfidf.addDocument(jobDescription);
  tfidf.addDocument(resumeText);

  // Get top keywords from job description
  const jobTokens = tokenizer.tokenize(jobDescription.toLowerCase());
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'be', 'been', 'have', 'has', 'will', 'can', 'may', 'we', 'you', 'your', 'our', 'this', 'that', 'they', 'their', 'from', 'by', 'as', 'it', 'its', 'not', 'no', 'do', 'does', 'did', 'so', 'all', 'any', 'more', 'most', 'also', 'about', 'into', 'would', 'could', 'should', 'must']);

  const filteredTokens = jobTokens.filter(t => t.length > 3 && !stopWords.has(t));
  const uniqueKeywords = [...new Set(filteredTokens)].slice(0, 50);

  const resumeLower = resumeText.toLowerCase();
  let hits = 0;

  for (const keyword of uniqueKeywords) {
    if (resumeLower.includes(keyword)) hits++;
  }

  const density = uniqueKeywords.length > 0 ? (hits / uniqueKeywords.length) * 100 : 50;
  return Math.min(100, Math.round(density));
}

// ─── Generate AI Insight ──────────────────────────────────────────────────
function generateAiInsight(candidate, job, scoreBreakdown, matched, missing) {
  const { skillsMatch, experienceMatch, educationMatch } = scoreBreakdown;

  if (skillsMatch >= 90 && experienceMatch >= 80) {
    return `${candidate.name} is an exceptional match with ${matched.length} of ${job.requiredSkills.length} required skills and ${candidate.experienceYears} years of experience. Highly recommended for immediate interview.`;
  }
  if (skillsMatch >= 70 && experienceMatch >= 60) {
    const missingStr = missing.slice(0, 2).join(', ');
    return `${candidate.name} is a strong match. ${missing.length > 0 ? `Missing: ${missingStr}${missing.length > 2 ? ' and more' : ''}. Consider for initial screening.` : 'All key skills present.'}`;
  }
  if (skillsMatch >= 50) {
    return `${candidate.name} has potential but gaps in ${missing.length} required skills. Consider for junior role or with additional training.`;
  }
  return `${candidate.name} does not meet minimum requirements for this role. Missing ${missing.length} critical skills.`;
}

// ─── Main Ranking Function ────────────────────────────────────────────────
async function rankCandidate(candidate, job) {
  const skillsResult = computeSkillsMatch(
    candidate.skills || [],
    job.requiredSkills || [],
    job.niceToHaveSkills || []
  );

  const expScore = computeExperienceMatch(
    candidate.experienceYears || 0,
    job.minExperience || 0
  );

  const eduScore = computeEducationMatch(
    candidate.highestDegreeLevel || 0,
    job.description
  );

  const kwScore = computeKeywordDensity(
    candidate.rawText || candidate.summary || '',
    `${job.description} ${job.requirements || ''} ${job.requiredSkills?.join(' ') || ''}`
  );

  const scoreBreakdown = {
    skillsMatch: Math.round(skillsResult.score),
    experienceMatch: Math.round(expScore),
    educationMatch: Math.round(eduScore),
    keywordDensity: Math.round(kwScore),
  };

  // Weighted composite
  const matchScore = Math.round(
    scoreBreakdown.skillsMatch * 0.40 +
    scoreBreakdown.experienceMatch * 0.25 +
    scoreBreakdown.educationMatch * 0.15 +
    scoreBreakdown.keywordDensity * 0.20
  );

  const aiInsight = generateAiInsight(candidate, job, scoreBreakdown, skillsResult.matched, skillsResult.missing);

  return {
    matchScore: Math.max(0, Math.min(100, matchScore)),
    scoreBreakdown,
    matchedSkills: skillsResult.matched,
    missingSkills: skillsResult.missing,
    aiInsight,
    scoredAt: new Date(),
  };
}

// ─── Rank All Candidates for a Job ───────────────────────────────────────
async function rankAllCandidatesForJob(candidates, job) {
  const results = await Promise.all(
    candidates.map(async (candidate) => {
      const scoring = await rankCandidate(candidate, job);
      return { candidateId: candidate._id, ...scoring };
    })
  );

  // Sort by matchScore descending, assign rank positions
  results.sort((a, b) => b.matchScore - a.matchScore);
  results.forEach((r, i) => {
    r.rankPosition = i + 1;
  });

  return results;
}

module.exports = { rankCandidate, rankAllCandidatesForJob, computeSkillsMatch, computeExperienceMatch };
