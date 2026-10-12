import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { initDatabase } from './db.ts';
import { UserModel } from './models/User.ts';
import { ChallengeModel } from './models/Challenge.ts';
import { SubmissionModel } from './models/Submission.ts';
import { EvaluationModel } from './models/Evaluation.ts';

export async function seedDatabase(quiet = false) {
  await initDatabase();

  const log = (...args: any[]) => {
    if (!quiet) console.log(...args);
  };

  log('[SEED] Starting idempotent database seed...');

  // 1. Initial Admin
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@proofofwork.edu').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';
  const adminName = process.env.ADMIN_NAME || 'System Administrator';

  let admin = await UserModel.findOne({ email: adminEmail });
  if (!admin) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    admin = await UserModel.create({
      name: adminName,
      email: adminEmail,
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=admin',
    });
    log(`[SEED] Created Initial Admin: ${adminEmail}`);
  } else {
    log(`[SEED] Initial Admin already exists: ${adminEmail}`);
  }

  // 2. Sample Evaluator
  const evalEmail = 'evaluator@proofofwork.edu';
  let evaluator = await UserModel.findOne({ email: evalEmail });
  if (!evaluator) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('EvalPassword123!', salt);

    evaluator = await UserModel.create({
      name: 'Dr. Sarah Jenkins',
      email: evalEmail,
      username: 'evaluator',
      password: hashedPassword,
      role: 'evaluator',
      status: 'active',
      staffId: 'STAFF-1042',
      department: 'Computer Science & Engineering',
      mustChangePassword: false,
      avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=sarah',
    });
    log(`[SEED] Created Sample Evaluator: ${evalEmail}`);
  } else {
    log(`[SEED] Sample Evaluator already exists: ${evalEmail}`);
  }

  // 3. Sample Student (Approved)
  const studentEmail = 'student@proofofwork.edu';
  let student = await UserModel.findOne({ email: studentEmail });
  if (!student) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('StudentPassword123!', salt);

    student = await UserModel.create({
      name: 'Aarav Sharma',
      email: studentEmail,
      username: 'student',
      password: hashedPassword,
      role: 'student',
      status: 'active',
      approvalStatus: 'approved',
      college: 'National Institute of Technology',
      department: 'Computer Science',
      branch: 'B.Tech CSE',
      year: '3rd Year',
      rollNumber: 'CS2023-042',
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
      bio: 'Aspiring Full Stack Engineer passionate about distributed systems.',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=aarav',
    });
    log(`[SEED] Created Sample Student: ${studentEmail}`);
  } else {
    log(`[SEED] Sample Student already exists: ${studentEmail}`);
  }

  // 4. Sample Challenges
  const sampleChallenges = [
    {
      title: 'Full-Stack Rate Limiter Token Bucket Implementation',
      slug: 'fullstack-rate-limiter-token-bucket',
      category: 'Backend Systems' as const,
      difficulty: 'Intermediate' as const,
      submissionType: 'code' as const,
      status: 'published' as const,
      maxMarks: 100,
      description: `### Challenge Objective
Implement an in-memory or Redis-backed Token Bucket rate limiter middleware in TypeScript for an Express application.

### Requirements:
1. **Token Bucket Algorithm**: Each client IP receives a bucket with capacity \`maxBurst\` tokens, refilling at \`refillRate\` tokens/second.
2. **Atomic Consumption**: Support requests that consume 1 or more tokens atomically.
3. **Response Headers**: Must set standard rate limit headers:
   - \`X-RateLimit-Limit\`: Maximum bucket capacity.
   - \`X-RateLimit-Remaining\`: Remaining tokens.
   - \`Retry-After\`: Seconds to wait before retry when limit exceeded.
4. **Error Handling**: Return HTTP 429 Too Many Requests when tokens are depleted.

*Note: All code submissions are manually audited and scored by designated faculty evaluators.*`,
      starterCode: `import { Request, Response, NextFunction } from 'express';

interface TokenBucketConfig {
  capacity: number;
  refillRatePerSec: number;
}

export function createRateLimiter(config: TokenBucketConfig) {
  const buckets = new Map<string, { tokens: number; lastRefill: number }>();

  return function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction) {
    // Implement token bucket algorithm here
    next();
  };
}`,
      testCasesOrExamples: [
        {
          title: 'Within limit burst',
          input: '10 requests within 1 second against capacity 10',
          expectedOutput: '200 OK for all 10 with decreasing X-RateLimit-Remaining',
          explanation: 'All requests successfully consume available tokens.',
        },
        {
          title: 'Exceeding burst',
          input: '11th request with 0 tokens remaining',
          expectedOutput: '429 Too Many Requests with Retry-After header',
          explanation: 'Bucket empty; rejected until next refill tick.',
        },
      ],
      rubric: [
        {
          id: 'crit_rl_1',
          criterion: 'Algorithm Correctness & Logic',
          maxMarks: 40,
          description: 'Accurate time-delta calculation and token replenishment formula without drift or race conditions.',
        },
        {
          id: 'crit_rl_2',
          criterion: 'HTTP Specifications & Headers',
          maxMarks: 30,
          description: 'Correct status codes (429) and standard rate limit headers (X-RateLimit-Remaining, Retry-After).',
        },
        {
          id: 'crit_rl_3',
          criterion: 'Code Quality & Error Handling',
          maxMarks: 30,
          description: 'Clean TypeScript types, clean state cleanup for inactive IPs, robust boundary handling.',
        },
      ],
    },
    {
      title: 'E-Commerce Analytics Complex SQL Query',
      slug: 'ecommerce-analytics-complex-sql-query',
      category: 'Data & SQL' as const,
      difficulty: 'Intermediate' as const,
      submissionType: 'sql' as const,
      maxMarks: 100,
      description: `### Challenge Objective
Write a high-performance PostgreSQL query analyzing customer cohort retention and average order value (AOV) across product categories.

### Requirements:
1. Calculate monthly customer acquisition cohorts from 2024-01-01 to 2024-12-31.
2. For each cohort, compute:
   - Month 0 (initial purchase) cohort size.
   - Month 1, Month 2, Month 3 retention percentages using window functions or conditional aggregation.
   - Cumulative revenue generated by the cohort.
3. Exclude cancelled or refunded orders.
4. Output must be sorted by cohort month ascending.

*Note: SQL submissions are reviewed for index friendliness, query cost, and standard SQL compliance.*`,
      starterCode: `-- Given tables:
-- users (id, created_at, country)
-- orders (id, user_id, status, created_at, total_amount)
-- order_items (id, order_id, product_id, quantity, unit_price)

WITH user_first_orders AS (
  -- Compute cohort assignment
  SELECT user_id, DATE_TRUNC('month', MIN(created_at)) AS cohort_month
  FROM orders
  WHERE status = 'completed'
  GROUP BY user_id
)
SELECT
  -- Final aggregated cohort report
  cohort_month
FROM user_first_orders;`,
      testCasesOrExamples: [
        {
          title: 'Cohort Retention Output Structure',
          input: 'Orders dataset spanning 2024 Q1-Q4',
          expectedOutput: 'cohort_month | initial_size | m1_retention_pct | m2_retention_pct | cumulative_revenue',
          explanation: 'Clean cohort grid showing retention trends.',
        },
      ],
      rubric: [
        {
          id: 'crit_sql_1',
          criterion: 'Query Correctness & Accuracy',
          maxMarks: 40,
          description: 'Accurate cohort mapping, non-duplication of customer counts, correct date truncations.',
        },
        {
          id: 'crit_sql_2',
          criterion: 'Window Functions & Aggregation',
          maxMarks: 35,
          description: 'Proficient use of CTEs, window functions, and filtering logic without cross-join explosion.',
        },
        {
          id: 'crit_sql_3',
          criterion: 'Optimization & Style',
          maxMarks: 25,
          description: 'Query readability, proper aliasing, index efficiency consideration.',
        },
      ],
    },
    {
      title: 'Accessible Responsive Modal Dialog Component',
      slug: 'accessible-responsive-modal-dialog-component',
      category: 'Web Development' as const,
      difficulty: 'Beginner' as const,
      submissionType: 'project_link' as const,
      maxMarks: 80,
      description: `### Challenge Objective
Build a fully accessible, reusable modal dialog in React adhering strictly to WAI-ARIA guidelines.

### Requirements:
1. Traps focus within modal when open (tab looping).
2. Closes on 'Escape' key press and backdrop click.
3. Restores focus to trigger button upon dismissal.
4. Locks body scroll while active.
5. ARIA attributes: \`role="dialog"\`, \`aria-modal="true"\`, \`aria-labelledby\`, \`aria-describedby\`.

Submit a GitHub repository URL or live preview link.`,
      testCasesOrExamples: [
        {
          title: 'Keyboard navigation test',
          input: 'Pressing Tab repeatedly inside modal',
          expectedOutput: 'Focus stays trapped inside modal elements',
          explanation: 'WAI-ARIA compliance check.',
        },
      ],
      rubric: [
        {
          id: 'crit_web_1',
          criterion: 'Accessibility (A11y) & ARIA',
          maxMarks: 35,
          description: 'Focus trapping, escape dismissal, screen reader announcements.',
        },
        {
          id: 'crit_web_2',
          criterion: 'Component API & React Architecture',
          maxMarks: 25,
          description: 'Clean props interface, portal mounting, hook abstraction.',
        },
        {
          id: 'crit_web_3',
          criterion: 'Styling & UX Polish',
          maxMarks: 20,
          description: 'Fluid transitions, backdrop blur, responsive sizing on mobile screens.',
        },
      ],
    },
  ];

  for (const c of sampleChallenges) {
    const existing = await ChallengeModel.findOne({ slug: c.slug });
    if (!existing) {
      await ChallengeModel.create(c);
      log(`[SEED] Created Challenge: "${c.title}"`);
    } else {
      log(`[SEED] Challenge already exists: "${c.title}"`);
    }
  }

  // 5. Seed a sample completed submission & evaluation so portfolio and leaderboard have immediate visual data
  const sampleChallenge = await ChallengeModel.findOne({ slug: 'fullstack-rate-limiter-token-bucket' });
  if (sampleChallenge && student && evaluator) {
    const studentId = String(student._id || student.id);
    const evaluatorId = String(evaluator._id || evaluator.id);
    const challengeId = String(sampleChallenge._id || sampleChallenge.id);

    const existingSub = await SubmissionModel.findOne({ studentId, challengeId });
    if (!existingSub) {
      const sub = await SubmissionModel.create({
        studentId,
        studentName: student.name,
        studentEmail: student.email,
        studentRollNumber: student.rollNumber,
        challengeId,
        challengeTitle: sampleChallenge.title,
        challengeCategory: sampleChallenge.category,
        submissionType: 'code',
        content: {
          code: `import { Request, Response, NextFunction } from 'express';

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

export function createRateLimiter(capacity: number = 60, refillPerSec: number = 1) {
  const store = new Map<string, TokenBucket>();

  return function (req: Request, res: Response, next: NextFunction) {
    const key = req.ip || 'anonymous';
    const now = Date.now();
    let bucket = store.get(key);

    if (!bucket) {
      bucket = { tokens: capacity, lastRefill: now };
      store.set(key, bucket);
    } else {
      const elapsedSec = (now - bucket.lastRefill) / 1000;
      bucket.tokens = Math.min(capacity, bucket.tokens + elapsedSec * refillPerSec);
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      res.setHeader('X-RateLimit-Limit', capacity);
      res.setHeader('X-RateLimit-Remaining', Math.floor(bucket.tokens));
      return next();
    }

    const waitSec = Math.ceil((1 - bucket.tokens) / refillPerSec);
    res.setHeader('Retry-After', waitSec);
    return res.status(429).json({ error: 'Too Many Requests', retryAfter: waitSec });
  };
}`,
          notes: 'Tested with burst traffic of 100 requests. Cleanly throttles with 429 and Retry-After headers.',
        },
        status: 'evaluated',
        assignedEvaluatorId: evaluatorId,
        assignedEvaluatorName: evaluator.name,
        assignedAt: new Date(Date.now() - 3600000 * 24),
        submittedAt: new Date(Date.now() - 3600000 * 28),
      });

      const evaluation = await EvaluationModel.create({
        submissionId: String(sub._id || sub.id),
        challengeId,
        studentId,
        evaluatorId,
        evaluatorName: evaluator.name,
        rubricScores: [
          {
            criterionId: 'crit_rl_1',
            criterionName: 'Algorithm Correctness & Logic',
            maxMarks: 40,
            awardedMarks: 38,
            comment: 'Very solid time delta logic and token replenishment.',
          },
          {
            criterionId: 'crit_rl_2',
            criterionName: 'HTTP Specifications & Headers',
            maxMarks: 30,
            awardedMarks: 29,
            comment: 'Standard headers are set properly according to RFC.',
          },
          {
            criterionId: 'crit_rl_3',
            criterionName: 'Code Quality & Error Handling',
            maxMarks: 30,
            awardedMarks: 27,
            comment: 'Clean TypeScript types. Consider periodic memory garbage collection for inactive IPs.',
          },
        ],
        totalMarks: 94,
        maxPossibleMarks: 100,
        percentage: 94,
        status: 'completed',
        feedback: 'Outstanding implementation! Demonstrates high practical competence in middleware design and rate limiting principles.',
        improvementSuggestions: 'Add an automated TTL eviction timer to delete stale IP entries from memory under prolonged high traffic.',
        evaluationHistory: [
          {
            action: 'Evaluation Finalized',
            by: evaluator.name,
            timestamp: new Date(),
            note: 'Final score awarded: 94/100 (94%)',
          },
        ],
        evaluatedAt: new Date(),
      });

      sub.evaluationId = String(evaluation._id || evaluation.id);
      await sub.save();
      log('[SEED] Created sample evaluated submission and rubric score.');
    }
  }

  log('[SEED] Database seed completed successfully.');
}

// Allow direct CLI execution: `tsx server/seed.ts`
if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[SEED] Failed to seed database:', err);
      process.exit(1);
    });
}
