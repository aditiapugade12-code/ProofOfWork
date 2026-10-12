import { Router, Response } from 'express';
import { UserModel } from '../models/User.ts';
import { ChallengeModel } from '../models/Challenge.ts';
import { SubmissionModel } from '../models/Submission.ts';
import { EvaluationModel } from '../models/Evaluation.ts';
import { authenticate, requireRole, requireApprovedStudent, AuthRequest } from '../middleware/auth.ts';
import { sanitizeUser } from './auth.ts';

const router = Router();

// Protect ALL student routes
router.use(authenticate);
router.use(requireRole('student'));

// GET /api/student/profile
router.get('/profile', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await UserModel.findById(String(req.user?._id || req.user?.id));
    if (!student) {
      res.status(404).json({ error: 'Student not found.' });
      return;
    }
    res.json({ student: sanitizeUser(student) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/student/profile - Update profile details
router.put('/profile', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = String(req.user?._id || req.user?.id);
    const student = await UserModel.findById(studentId);
    if (!student) {
      res.status(404).json({ error: 'Student not found.' });
      return;
    }

    const {
      name,
      college,
      department,
      branch,
      year,
      rollNumber,
      skills,
      bio,
      avatarUrl,
    } = req.body;

    if (name) student.name = String(name).trim();
    if (college) student.college = String(college).trim();
    if (department) student.department = String(department).trim();
    if (branch) student.branch = String(branch).trim();
    if (year) student.year = String(year).trim();
    if (rollNumber) student.rollNumber = String(rollNumber).trim();
    if (skills) {
      student.skills = Array.isArray(skills)
        ? skills
        : String(skills).split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (bio !== undefined) student.bio = String(bio).trim();
    if (avatarUrl !== undefined) student.avatarUrl = String(avatarUrl).trim();

    // If student was rejected, updating details resets status to pending for re-review
    if (student.approvalStatus === 'rejected') {
      student.approvalStatus = 'pending';
      student.rejectionReason = '';
    }

    await student.save();

    res.json({
      message: 'Profile updated successfully.',
      student: sanitizeUser(student),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/student/challenges - Browse available challenges
router.get('/challenges', async (req, res: Response): Promise<void> => {
  try {
    const { category, difficulty, search } = req.query;
    const query: Record<string, any> = { status: 'published' };

    if (category && category !== 'All') query.category = category;
    if (difficulty && difficulty !== 'All') query.difficulty = difficulty;

    let challenges = await ChallengeModel.find(query);

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      challenges = challenges.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.category?.toLowerCase().includes(q)
      );
    }

    res.json({ challenges });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/student/challenges/:id
router.get('/challenges/:id', async (req, res: Response): Promise<void> => {
  try {
    const challenge = await ChallengeModel.findById(req.params.id);
    if (!challenge) {
      res.status(404).json({ error: 'Challenge not found.' });
      return;
    }
    res.json({ challenge });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/student/challenges/:id/submit - Submit challenge solution
// Enforce that student must be approved by admin!
router.post(
  '/challenges/:id/submit',
  requireApprovedStudent,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const studentId = String(req.user?._id || req.user?.id);
      const student = await UserModel.findById(studentId);
      if (!student) {
        res.status(404).json({ error: 'Student not found.' });
        return;
      }

      const challenge = await ChallengeModel.findById(req.params.id);
      if (!challenge) {
        res.status(404).json({ error: 'Challenge not found.' });
        return;
      }

      const { submissionType, content } = req.body;
      const type = submissionType || challenge.submissionType;

      if (!content || typeof content !== 'object') {
        res.status(400).json({ error: 'Submission content is required.' });
        return;
      }

      // Check whether minimum required content is provided based on challenge type
      if (type === 'code' && !content.code?.trim()) {
        res.status(400).json({ error: 'Please enter your code solution.' });
        return;
      }
      if (type === 'sql' && !content.sqlQuery?.trim()) {
        res.status(400).json({ error: 'Please enter your SQL query.' });
        return;
      }
      if (type === 'project_link' && !content.repositoryUrl?.trim()) {
        res.status(400).json({ error: 'Please enter your GitHub/repository URL.' });
        return;
      }
      if (type === 'written' && !content.writtenAnswer?.trim()) {
        res.status(400).json({ error: 'Please enter your written answer.' });
        return;
      }

      const submission = await SubmissionModel.create({
        studentId,
        studentName: student.name,
        studentEmail: student.email,
        studentRollNumber: student.rollNumber || 'N/A',
        challengeId: String(challenge._id || challenge.id),
        challengeTitle: challenge.title,
        challengeCategory: challenge.category,
        submissionType: type,
        content: {
          code: content.code || '',
          sqlQuery: content.sqlQuery || '',
          repositoryUrl: content.repositoryUrl || '',
          liveUrl: content.liveUrl || '',
          writtenAnswer: content.writtenAnswer || '',
          notes: content.notes || '',
        },
        status: 'submitted',
        assignedEvaluatorId: null,
        assignedEvaluatorName: null,
        assignedAt: null,
        submittedAt: new Date(),
      });

      res.status(201).json({
        message:
          'Challenge submitted successfully! Note: Code, SQL, and project answers are manually reviewed and scored by a designated faculty evaluator.',
        submission,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Submission failed: ' + err.message });
    }
  }
);

// GET /api/student/submissions - List student's own submissions
router.get('/submissions', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = String(req.user?._id || req.user?.id);
    const submissions = await SubmissionModel.find({ studentId });

    // Populate evaluation summary
    const populated = await Promise.all(
      submissions.map(async (sub) => {
        const item = sub.toObject ? sub.toObject() : { ...sub };
        if (item.evaluationId) {
          const ev = await EvaluationModel.findById(item.evaluationId);
          item.evaluation = ev ? (ev.toObject ? ev.toObject() : ev) : null;
        }
        return item;
      })
    );

    res.json({ submissions: populated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/student/submissions/:id - View detail of student's own submission
router.get('/submissions/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = String(req.user?._id || req.user?.id);
    const submission = await SubmissionModel.findById(req.params.id);

    if (!submission) {
      res.status(404).json({ error: 'Submission not found.' });
      return;
    }

    // Security: Student can ONLY view their own submission
    if (String(submission.studentId) !== studentId) {
      res.status(403).json({ error: 'Forbidden: You do not have access to this submission.' });
      return;
    }

    const challenge = await ChallengeModel.findById(submission.challengeId);
    let evaluation = null;
    if (submission.evaluationId) {
      evaluation = await EvaluationModel.findById(submission.evaluationId);
    }

    res.json({
      submission,
      challenge,
      evaluation,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/student/portfolio - Verified skills and completed challenges portfolio
router.get('/portfolio', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = String(req.user?._id || req.user?.id);
    const student = await UserModel.findById(studentId);
    if (!student) {
      res.status(404).json({ error: 'Student not found.' });
      return;
    }

    const submissions = await SubmissionModel.find({
      studentId,
      status: 'evaluated',
    });

    const completedEvaluations = await Promise.all(
      submissions.map(async (sub) => {
        let ev = null;
        if (sub.evaluationId) {
          ev = await EvaluationModel.findById(sub.evaluationId);
        }
        return {
          submission: sub,
          evaluation: ev,
        };
      })
    );

    const totalScore = completedEvaluations.reduce(
      (acc, item) => acc + (item.evaluation?.totalMarks || 0),
      0
    );

    res.json({
      student: sanitizeUser(student),
      totalScore,
      completedCount: completedEvaluations.length,
      portfolioItems: completedEvaluations,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/student/leaderboard
router.get('/leaderboard', async (_req, res: Response): Promise<void> => {
  try {
    // Only approved students appear on the leaderboard
    const students = await UserModel.find({
      role: 'student',
      approvalStatus: 'approved',
    });

    const leaderboard = await Promise.all(
      students.map(async (st) => {
        const stId = String(st._id || st.id);
        const evaluations = await EvaluationModel.find({
          studentId: stId,
          status: 'completed',
        });

        const totalMarks = evaluations.reduce((acc, ev) => acc + (ev.totalMarks || 0), 0);
        const completedCount = evaluations.length;

        return {
          id: stId,
          name: st.name,
          username: st.username,
          avatarUrl: st.avatarUrl,
          department: st.department,
          year: st.year,
          rollNumber: st.rollNumber,
          skills: st.skills || [],
          totalMarks,
          completedCount,
        };
      })
    );

    // Sort descending by total marks, then completed count
    leaderboard.sort((a, b) => b.totalMarks - a.totalMarks || b.completedCount - a.completedCount);

    const ranked = leaderboard.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    res.json({ leaderboard: ranked });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
