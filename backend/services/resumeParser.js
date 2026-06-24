const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');
const natural = require('natural');

const tokenizer = new natural.WordTokenizer();

// ─── Known Skills List ────────────────────────────────────────────────────
const KNOWN_SKILLS = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin',
  'react', 'react.js', 'vue', 'vue.js', 'angular', 'svelte', 'next.js', 'nuxt.js', 'gatsby',
  'node.js', 'express', 'django', 'flask', 'fastapi', 'spring boot', 'laravel', 'rails', '.net', 'asp.net',
  'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'sqlite', 'oracle', 'cassandra',
  'aws', 'gcp', 'azure', 'firebase', 'heroku', 'vercel', 'netlify', 'digitalocean',
  'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'github actions', 'gitlab ci',
  'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'slack',
  'rest', 'graphql', 'grpc', 'websockets', 'oauth', 'jwt', 'microservices',
  'machine learning', 'deep learning', 'nlp', 'computer vision', 'tensorflow', 'pytorch', 'scikit-learn',
  'pandas', 'numpy', 'matplotlib', 'jupyter',
  'html', 'css', 'sass', 'tailwind', 'bootstrap', 'material ui', 'chakra ui',
  'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator',
  'agile', 'scrum', 'kanban', 'devops', 'ci/cd', 'tdd', 'bdd',
  'sql', 'nosql', 'data analysis', 'tableau', 'power bi', 'looker',
  'linux', 'unix', 'bash', 'powershell',
  'redux', 'mobx', 'recoil', 'zustand',
  'jest', 'cypress', 'selenium', 'playwright', 'mocha', 'pytest',
  'kafka', 'rabbitmq', 'celery', 'nginx', 'apache',
];

// ─── Extract text from PDF ────────────────────────────────────────────────
async function extractFromPDF(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  } catch (err) {
    throw new Error(`PDF parsing failed: ${err.message}`);
  }
}

// ─── Extract text from DOCX ───────────────────────────────────────────────
async function extractFromDOCX(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (err) {
    throw new Error(`DOCX parsing failed: ${err.message}`);
  }
}

// ─── Extract Name ─────────────────────────────────────────────────────────
function extractName(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  // First non-empty line is often the name (if it looks like a name)
  for (const line of lines.slice(0, 5)) {
    if (line.length < 50 && /^[A-Za-z\s\-'\.]+$/.test(line) && line.split(' ').length >= 2) {
      return line.trim();
    }
  }
  return 'Unknown Candidate';
}

// ─── Extract Email ────────────────────────────────────────────────────────
function extractEmail(text) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex);
  return matches ? matches[0] : null;
}

// ─── Extract Phone ────────────────────────────────────────────────────────
function extractPhone(text) {
  const phoneRegex = /(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const matches = text.match(phoneRegex);
  return matches ? matches[0] : null;
}

// ─── Extract Location ─────────────────────────────────────────────────────
function extractLocation(text) {
  // Match patterns like "City, State" or "City, Country"
  const locationRegex = /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*([A-Z]{2,}|[A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/g;
  const matches = text.match(locationRegex);
  return matches ? matches[0] : null;
}

// ─── Extract Skills ───────────────────────────────────────────────────────
function extractSkills(text) {
  const lowerText = text.toLowerCase();
  const foundSkills = [];

  for (const skill of KNOWN_SKILLS) {
    const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
    if (regex.test(lowerText)) {
      foundSkills.push(skill);
    }
  }

  // Also look for skills section
  const skillsSectionMatch = text.match(/(?:skills|technical skills|core competencies)[:\n]([^]*?)(?:\n\n|\n[A-Z]|$)/i);
  if (skillsSectionMatch) {
    const skillsText = skillsSectionMatch[1];
    const additionalSkills = skillsText
      .split(/[,\n•\-\|\/]/)
      .map(s => s.trim().toLowerCase())
      .filter(s => s.length > 2 && s.length < 40);

    for (const s of additionalSkills) {
      if (!foundSkills.includes(s) && /^[a-z0-9\s\.\+\#\/]+$/.test(s)) {
        foundSkills.push(s);
      }
    }
  }

  return [...new Set(foundSkills)].slice(0, 30);
}

// ─── Extract Experience ───────────────────────────────────────────────────
function extractExperience(text) {
  // Look for year ranges like 2018-2022 or 2020 - Present
  const yearRangeRegex = /(\d{4})\s*[-–]\s*(\d{4}|present|current)/gi;
  const matches = [...text.matchAll(yearRangeRegex)];

  let totalYears = 0;
  const details = [];

  for (const match of matches) {
    const startYear = parseInt(match[1]);
    const endYear = match[2].toLowerCase() === 'present' || match[2].toLowerCase() === 'current'
      ? new Date().getFullYear()
      : parseInt(match[2]);

    if (startYear >= 1990 && endYear >= startYear && endYear <= new Date().getFullYear() + 1) {
      const years = endYear - startYear;
      if (years > 0 && years < 20) {
        totalYears += years;
        details.push({ years, startYear, endYear });
      }
    }
  }

  // Also check for "X years of experience" pattern
  const expPatterns = [
    /(\d+)\+?\s*years?\s+(?:of\s+)?(?:professional\s+)?experience/gi,
    /(\d+)\+?\s*years?\s+in\s+\w+/gi,
  ];

  let textualYears = 0;
  for (const pattern of expPatterns) {
    const m = text.match(pattern);
    if (m) {
      const num = parseInt(m[0].match(/\d+/)[0]);
      if (num > textualYears) textualYears = num;
    }
  }

  // Use the larger of computed vs stated
  const computedYears = Math.min(totalYears, 30);
  return Math.max(computedYears, textualYears);
}

// ─── Extract Education ────────────────────────────────────────────────────
function extractEducation(text) {
  const education = [];
  const lines = text.split('\n');

  const degreeKeywords = ['phd', 'ph.d', 'doctorate', 'master', 'mba', 'm.s', 'bachelor', 'b.s', 'b.e', 'b.a', 'associate', 'high school'];
  const levelMap = {
    'phd': 5, 'ph.d': 5, 'doctorate': 5,
    'master': 4, 'mba': 4, 'm.s': 4,
    'bachelor': 3, 'b.s': 3, 'b.e': 3, 'b.a': 3,
    'associate': 2, 'high school': 1,
  };

  let highestLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    for (const kw of degreeKeywords) {
      if (line.includes(kw)) {
        const level = levelMap[kw] || 0;
        education.push({
          degree: lines[i].trim().substring(0, 100),
          institution: lines[i + 1] ? lines[i + 1].trim().substring(0, 100) : '',
          year: '',
          level,
        });
        if (level > highestLevel) highestLevel = level;
        break;
      }
    }
  }

  return { education: education.slice(0, 5), highestDegreeLevel: highestLevel };
}

// ─── Main Parser ──────────────────────────────────────────────────────────
async function parseResume(filePath, mimeType) {
  let rawText = '';

  if (mimeType === 'application/pdf') {
    rawText = await extractFromPDF(filePath);
  } else {
    rawText = await extractFromDOCX(filePath);
  }

  if (!rawText || rawText.trim().length < 50) {
    throw new Error('Could not extract readable text from document');
  }

  const name = extractName(rawText);
  const email = extractEmail(rawText);
  const phone = extractPhone(rawText);
  const location = extractLocation(rawText);
  const skills = extractSkills(rawText);
  const experienceYears = extractExperience(rawText);
  const { education, highestDegreeLevel } = extractEducation(rawText);

  // Create a summary from first 300 chars of meaningful text
  const summary = rawText
    .split('\n')
    .filter(l => l.trim().length > 20)
    .slice(0, 5)
    .join(' ')
    .substring(0, 500);

  return {
    name,
    email,
    phone,
    location,
    skills,
    experienceYears,
    education,
    highestDegreeLevel,
    summary,
    rawText,
  };
}

module.exports = { parseResume };
