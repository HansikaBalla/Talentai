/**
 * TalentAI Seed Data Script
 * Creates: 2 users (admin + recruiter), 5 jobs, 30 candidates with AI scores
 * Run: npm run seed (from backend/ dir) or node seed/seedData.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const { rankAllCandidatesForJob } = require('../services/aiRanking');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/talentai';

// ─── Sample Jobs ───────────────────────────────────────────────────────────
const JOBS = [
  {
    title: 'Senior DevOps Engineer',
    department: 'Engineering',
    location: 'San Francisco, CA',
    locationType: 'Remote',
    type: 'Full-time',
    description: 'We are seeking a Senior DevOps Engineer to lead infrastructure automation, cloud architecture and CI/CD pipeline improvements. You will be responsible for building scalable, resilient infrastructure using Kubernetes, Terraform and AWS.',
    requirements: 'Strong experience with Kubernetes, AWS, and Terraform required. CI/CD pipeline management using Jenkins or GitHub Actions.',
    requiredSkills: ['kubernetes', 'aws', 'terraform', 'docker', 'python', 'ci/cd', 'linux'],
    niceToHaveSkills: ['gcp', 'ansible', 'monitoring', 'prometheus'],
    minExperience: 5,
    status: 'active',
  },
  {
    title: 'Full Stack React Developer',
    department: 'Engineering',
    location: 'New York, NY',
    locationType: 'Hybrid',
    type: 'Full-time',
    description: 'Join our growing product team as a Full Stack Developer. You will build beautiful, performant web applications using React, Node.js, and PostgreSQL. You will own features end-to-end from API design to UI implementation.',
    requirements: 'Proficiency in React, TypeScript, Node.js required. Experience with REST API design and database management.',
    requiredSkills: ['react', 'typescript', 'node.js', 'postgresql', 'rest', 'javascript'],
    niceToHaveSkills: ['graphql', 'redis', 'aws', 'docker'],
    minExperience: 3,
    status: 'active',
  },
  {
    title: 'Machine Learning Engineer',
    department: 'AI Research',
    location: 'Austin, TX',
    locationType: 'Remote',
    type: 'Full-time',
    description: 'We are building next-generation AI products and need a Machine Learning Engineer to design, train, and deploy ML models at scale. You will work closely with data scientists and product teams.',
    requirements: 'Strong Python and ML framework experience required. Knowledge of TensorFlow or PyTorch.',
    requiredSkills: ['python', 'machine learning', 'tensorflow', 'pytorch', 'sql', 'pandas', 'numpy'],
    niceToHaveSkills: ['deep learning', 'nlp', 'computer vision', 'aws', 'docker'],
    minExperience: 4,
    status: 'active',
  },
  {
    title: 'Senior UX/UI Designer',
    department: 'Design',
    location: 'London, UK',
    locationType: 'Remote',
    type: 'Full-time',
    description: 'We are looking for a Senior UX/UI Designer to create world-class digital experiences. You will lead the design process from discovery to delivery, working with product managers and engineers.',
    requirements: 'Proficiency in Figma required. Strong portfolio showing user research and design systems.',
    requiredSkills: ['figma', 'ux design', 'ui design', 'design systems', 'prototyping'],
    niceToHaveSkills: ['adobe xd', 'sketch', 'html', 'css', 'user research'],
    minExperience: 4,
    status: 'active',
  },
  {
    title: 'Backend Lead (Node.js)',
    department: 'Engineering',
    location: 'Berlin, Germany',
    locationType: 'Hybrid',
    type: 'Full-time',
    description: 'Lead a team of backend engineers building high-performance microservices. You will architect scalable APIs, manage database performance, and mentor junior engineers.',
    requirements: 'Expert-level Node.js and MongoDB/PostgreSQL. Experience leading backend teams.',
    requiredSkills: ['node.js', 'javascript', 'mongodb', 'postgresql', 'rest', 'microservices', 'docker'],
    niceToHaveSkills: ['kafka', 'redis', 'kubernetes', 'typescript'],
    minExperience: 6,
    status: 'active',
  },
];

// ─── Sample Candidates ─────────────────────────────────────────────────────
const CANDIDATE_TEMPLATES = [
  // DevOps candidates
  { name: 'Marcus Thorne', email: 'marcus.thorne@email.com', skills: ['kubernetes', 'aws', 'terraform', 'docker', 'python', 'ci/cd', 'linux', 'ansible', 'monitoring'], experienceYears: 8, highestDegreeLevel: 3, location: 'Austin, TX', jobIndex: 0 },
  { name: 'Elena Rodriguez', email: 'e.rodriguez@dev.io', skills: ['terraform', 'ci/cd', 'azure', 'docker', 'python', 'linux', 'jenkins'], experienceYears: 10, highestDegreeLevel: 4, location: 'Seattle, WA', jobIndex: 0 },
  { name: 'Jordan Wei', email: 'j.wei@cloud.net', skills: ['docker', 'gcp', 'kubernetes', 'bash'], experienceYears: 4, highestDegreeLevel: 3, location: 'New York, NY', jobIndex: 0 },
  { name: 'Sam Okonkwo', email: 'sam.o@infra.co', skills: ['kubernetes', 'aws', 'terraform', 'docker', 'ci/cd', 'linux', 'prometheus', 'grafana'], experienceYears: 7, highestDegreeLevel: 3, location: 'Remote', jobIndex: 0 },
  { name: 'Priya Sharma', email: 'priya.s@tech.com', skills: ['aws', 'docker', 'python', 'linux'], experienceYears: 3, highestDegreeLevel: 3, location: 'Bangalore, India', jobIndex: 0 },
  { name: 'Alex Kim', email: 'akim@devops.io', skills: ['kubernetes', 'aws', 'terraform', 'ci/cd', 'python', 'docker', 'linux', 'ansible', 'gcp'], experienceYears: 9, highestDegreeLevel: 4, location: 'San Francisco, CA', jobIndex: 0 },

  // React Dev candidates
  { name: 'Sarah Chen', email: 'sarah.chen@web.dev', skills: ['react', 'typescript', 'node.js', 'postgresql', 'rest', 'javascript', 'css', 'graphql'], experienceYears: 5, highestDegreeLevel: 3, location: 'New York, NY', jobIndex: 1 },
  { name: 'Daniel Park', email: 'd.park@frontend.co', skills: ['react', 'javascript', 'html', 'css', 'node.js', 'mongodb', 'redux'], experienceYears: 4, highestDegreeLevel: 3, location: 'Chicago, IL', jobIndex: 1 },
  { name: 'Isabella Turner', email: 'i.turner@stack.dev', skills: ['react', 'typescript', 'postgresql', 'rest', 'javascript', 'next.js', 'docker'], experienceYears: 6, highestDegreeLevel: 4, location: 'Remote', jobIndex: 1 },
  { name: 'Kevin Li', email: 'kevin.l@react.io', skills: ['vue', 'javascript', 'python', 'mysql'], experienceYears: 2, highestDegreeLevel: 3, location: 'Boston, MA', jobIndex: 1 },
  { name: 'Amara Diallo', email: 'a.diallo@fullstack.dev', skills: ['react', 'typescript', 'node.js', 'postgresql', 'rest', 'redis', 'aws'], experienceYears: 7, highestDegreeLevel: 3, location: 'Lagos, Nigeria', jobIndex: 1 },
  { name: 'Ryan Foster', email: 'r.foster@js.dev', skills: ['react', 'javascript', 'rest', 'mongodb', 'node.js'], experienceYears: 3, highestDegreeLevel: 3, location: 'Denver, CO', jobIndex: 1 },

  // ML Engineer candidates
  { name: 'Dr. Mei Lin', email: 'mei.lin@ml.ai', skills: ['python', 'machine learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'deep learning', 'nlp'], experienceYears: 6, highestDegreeLevel: 5, location: 'San Francisco, CA', jobIndex: 2 },
  { name: 'Ethan Novak', email: 'e.novak@datascience.co', skills: ['python', 'machine learning', 'scikit-learn', 'pandas', 'sql', 'numpy', 'tensorflow'], experienceYears: 4, highestDegreeLevel: 4, location: 'Austin, TX', jobIndex: 2 },
  { name: 'Fatima Al-Hassan', email: 'f.alhassan@ai.io', skills: ['python', 'pytorch', 'deep learning', 'nlp', 'pandas', 'machine learning', 'sql'], experienceYears: 5, highestDegreeLevel: 4, location: 'London, UK', jobIndex: 2 },
  { name: 'Lucas Mendez', email: 'l.mendez@ml.dev', skills: ['java', 'sql', 'python', 'tableau'], experienceYears: 3, highestDegreeLevel: 3, location: 'Miami, FL', jobIndex: 2 },
  { name: 'Sofia Petrov', email: 's.petrov@neuralnet.ai', skills: ['python', 'tensorflow', 'pytorch', 'machine learning', 'computer vision', 'pandas', 'aws', 'docker'], experienceYears: 7, highestDegreeLevel: 5, location: 'Remote', jobIndex: 2 },
  { name: 'Liam O\'Brien', email: 'l.obrien@data.science', skills: ['python', 'pandas', 'numpy', 'sql', 'machine learning', 'scikit-learn'], experienceYears: 3, highestDegreeLevel: 3, location: 'Dublin, Ireland', jobIndex: 2 },

  // UX Designer candidates
  { name: 'Zoe Nakamura', email: 'zoe.n@design.studio', skills: ['figma', 'ux design', 'ui design', 'design systems', 'prototyping', 'user research', 'adobe xd'], experienceYears: 6, highestDegreeLevel: 3, location: 'Tokyo, Japan', jobIndex: 3 },
  { name: 'Aaron Patel', email: 'a.patel@ux.io', skills: ['figma', 'ui design', 'css', 'html', 'prototyping'], experienceYears: 3, highestDegreeLevel: 3, location: 'London, UK', jobIndex: 3 },
  { name: 'Camille Dubois', email: 'c.dubois@creative.fr', skills: ['figma', 'ux design', 'design systems', 'prototyping', 'ui design', 'sketch', 'user research'], experienceYears: 8, highestDegreeLevel: 3, location: 'Paris, France', jobIndex: 3 },
  { name: 'Mia Johnson', email: 'm.johnson@design.co', skills: ['adobe xd', 'photoshop', 'illustrator', 'figma', 'ux design'], experienceYears: 4, highestDegreeLevel: 3, location: 'Los Angeles, CA', jobIndex: 3 },
  { name: 'Oliver Schmidt', email: 'o.schmidt@ui.de', skills: ['figma', 'design systems', 'ui design', 'prototyping', 'user research', 'css'], experienceYears: 5, highestDegreeLevel: 4, location: 'Berlin, Germany', jobIndex: 3 },
  { name: 'Nadia Kowalski', email: 'n.kowalski@studio.pl', skills: ['figma', 'ux design', 'ui design', 'prototyping', 'design systems', 'sketch', 'user research'], experienceYears: 7, highestDegreeLevel: 3, location: 'Warsaw, Poland', jobIndex: 3 },

  // Backend Lead candidates
  { name: 'Henrik Johansson', email: 'h.johansson@backend.se', skills: ['node.js', 'javascript', 'mongodb', 'postgresql', 'rest', 'microservices', 'docker', 'kafka', 'redis'], experienceYears: 9, highestDegreeLevel: 3, location: 'Stockholm, Sweden', jobIndex: 4 },
  { name: 'Aisha Balogun', email: 'a.balogun@api.dev', skills: ['node.js', 'typescript', 'mongodb', 'postgresql', 'microservices', 'rest', 'docker'], experienceYears: 7, highestDegreeLevel: 4, location: 'Berlin, Germany', jobIndex: 4 },
  { name: 'Chen Wei', email: 'c.wei@microservice.io', skills: ['python', 'django', 'postgresql', 'rest', 'docker', 'aws'], experienceYears: 5, highestDegreeLevel: 3, location: 'Shanghai, China', jobIndex: 4 },
  { name: 'Tom Bradley', email: 't.bradley@node.dev', skills: ['node.js', 'javascript', 'mongodb', 'rest', 'microservices', 'docker', 'kubernetes'], experienceYears: 8, highestDegreeLevel: 3, location: 'Manchester, UK', jobIndex: 4 },
  { name: 'Valentina Cruz', email: 'v.cruz@backend.io', skills: ['node.js', 'typescript', 'postgresql', 'mongodb', 'rest', 'docker', 'redis', 'microservices'], experienceYears: 6, highestDegreeLevel: 3, location: 'Buenos Aires, Argentina', jobIndex: 4 },
  { name: 'James Osei', email: 'j.osei@api.gh', skills: ['node.js', 'javascript', 'mongodb', 'postgresql', 'rest', 'microservices', 'docker', 'kafka', 'kubernetes', 'redis', 'typescript'], experienceYears: 10, highestDegreeLevel: 4, location: 'Accra, Ghana', jobIndex: 4 },
];

const STATUSES = ['new', 'shortlisted', 'reviewing', 'interviewed', 'offered', 'rejected'];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // ─── Clear existing data ──────────────────────────────────────────────
    await Promise.all([
      User.deleteMany({}),
      Job.deleteMany({}),
      Candidate.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // ─── Create Users ─────────────────────────────────────────────────────
    const admin = await User.create({
      name: 'Sarah Mitchell',
      email: 'admin@talentai.com',
      passwordHash: 'Admin@12345',
      role: 'admin',
      department: 'HR Leadership',
      title: 'Head of Talent Acquisition',
    });

    const recruiter = await User.create({
      name: 'Alex Chen',
      email: 'recruiter@talentai.com',
      passwordHash: 'Recruiter@12345',
      role: 'recruiter',
      department: 'Engineering',
      title: 'Technical Recruiter',
    });

    console.log('👤 Created users: admin@talentai.com / Admin@12345');
    console.log('👤 Created users: recruiter@talentai.com / Recruiter@12345');

    // ─── Create Jobs ──────────────────────────────────────────────────────
    const createdJobs = [];
    for (const jobData of JOBS) {
      const job = await Job.create({ ...jobData, postedBy: admin._id });
      createdJobs.push(job);
    }
    console.log(`💼 Created ${createdJobs.length} jobs`);

    // ─── Create Candidates ────────────────────────────────────────────────
    const createdCandidates = [];
    for (let i = 0; i < CANDIDATE_TEMPLATES.length; i++) {
      const template = CANDIDATE_TEMPLATES[i];
      const job = createdJobs[template.jobIndex];
      const status = STATUSES[i % STATUSES.length];

      const candidate = await Candidate.create({
        name: template.name,
        email: template.email,
        location: template.location,
        jobId: job._id,
        skills: template.skills,
        experienceYears: template.experienceYears,
        highestDegreeLevel: template.highestDegreeLevel,
        education: [{ degree: ['High School', 'Associate', 'Bachelor', 'Master', 'PhD'][Math.min(template.highestDegreeLevel, 4)], institution: 'University', level: template.highestDegreeLevel }],
        summary: `${template.name} is an experienced professional with ${template.experienceYears} years in the industry, specializing in ${template.skills.slice(0, 3).join(', ')}.`,
        rawText: `${template.name}\n${template.email}\n${template.location}\n\nExperience: ${template.experienceYears} years\n\nSkills: ${template.skills.join(', ')}\n\nEducation: ${['High School', 'Associate', 'Bachelor', 'Master', 'PhD'][Math.min(template.highestDegreeLevel, 4)]} Degree\n\n${job.description}`,
        parseStatus: 'completed',
        status,
        isShortlisted: status === 'shortlisted',
        uploadedBy: i % 2 === 0 ? admin._id : recruiter._id,
      });

      createdCandidates.push(candidate);
    }
    console.log(`👥 Created ${createdCandidates.length} candidates`);

    // ─── Run AI Ranking for each job ──────────────────────────────────────
    console.log('🤖 Running AI ranking...');
    for (const job of createdJobs) {
      const candidates = createdCandidates
        .filter(c => c.jobId.toString() === job._id.toString());

      if (candidates.length > 0) {
        const rankings = await rankAllCandidatesForJob(candidates, job);
        const bulkOps = rankings.map(r => ({
          updateOne: {
            filter: { _id: r.candidateId },
            update: {
              $set: {
                matchScore: r.matchScore,
                scoreBreakdown: r.scoreBreakdown,
                matchedSkills: r.matchedSkills,
                missingSkills: r.missingSkills,
                aiInsight: r.aiInsight,
                rankPosition: r.rankPosition,
                scoredAt: r.scoredAt,
              },
            },
          },
        }));
        await Candidate.bulkWrite(bulkOps);

        // Update job application count
        await Job.findByIdAndUpdate(job._id, { applicationCount: candidates.length, lastRankedAt: new Date() });
        console.log(`  ✓ ${job.title}: ranked ${candidates.length} candidates`);
      }
    }

    console.log('\n🎉 Seed complete!');
    console.log('─────────────────────────────────────');
    console.log('🔑 Admin login:     admin@talentai.com / Admin@12345');
    console.log('🔑 Recruiter login: recruiter@talentai.com / Recruiter@12345');
    console.log('─────────────────────────────────────');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();
