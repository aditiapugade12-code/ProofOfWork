import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel, IUser } from '../models/User.ts';
import { ChallengeModel, IChallenge } from '../models/Challenge.ts';
import { SubmissionModel, ISubmission } from '../models/Submission.ts';
import { EvaluationModel } from '../models/Evaluation.ts';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.ts';
import { sanitizeUser } from './auth.ts';

const router = Router();

// Protect ALL admin routes with authenticate & requireRole('admin')
router.use(authenticate);
router.use(requireRole('admin'));

// GET /api/admin/metrics - Overview statistics
router.get('/metrics', async (_req, res: Response): Promise<void> => {
  try {
    const totalStudents = await UserModel.countDocuments({ role: 'student' });
    const pendingStudentApprovals = await UserModel.countDocuments({
      role: 'student',
      approvalStatus: 'pending',
    });
    const activeEvaluators = await UserModel.countDocuments({
      role: 'evaluator',
      status: 'active',
    });
    const totalSubmissions = await SubmissionModel.countDocuments({});
    const unassignedSubmissions = await SubmissionModel.countDocuments({
      assignedEvaluatorId: null,
      status: 'submitted',
    });
    const pendingEvaluations = await SubmissionModel.countDocuments({
      status: { $in: ['assigned', 'under_review'] },
    });
    const completedEvaluations = await SubmissionModel.countDocuments({
      status: 'evaluated',
    });
    const totalChallenges = await ChallengeModel.countDocuments({});

    res.json({
      totalStudents,
      pendingStudentApprovals,
      activeEvaluators,
      totalSubmissions,
      unassignedSubmissions,
      pendingEvaluations,
      completedEvaluations,
      totalChallenges,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch admin metrics: ' + err.message });
  }
});

// ==========================================
// STUDENT MANAGEMENT
// ==========================================

// GET /api/admin/students
router.get('/students', async (req, res: Response): Promise<void> => {
  try {
    const { search, status, approvalStatus, department, year } = req.query;
    const query: Record<string, any> = { role: 'student' };

    if (status) query.status = status;
    if (approvalStatus) query.approvalStatus = approvalStatus;
    if (department) query.department = department;
    if (year) query.year = year;

    let students = await UserModel.find(query);

    // Apply search filter if provided
    if (search && typeof search === 'string') {
      const q = search.trim().toLowerCase();
      students = students.filter((s) => {
        return (
          s.name?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.rollNumber?.toLowerCase().includes(q) ||
          s.username?.toLowerCase().includes(q)
        );
      });
    }

    res.json({
      students: students.map(sanitizeUser),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch students: ' + err.message });
  }
});

// GET /api/admin/students/:id
router.get('/students/:id', async (req, res: Response): Promise<void> => {
  try {
    const student = await UserModel.findById(req.params.id);
    if (!student || student.role !== 'student') {
      res.status(404).json({ error: 'Student not found.' });
      return;
    }

    const studentId = String(student._id || student.id);
    const submissions = await SubmissionModel.find({ studentId });
    const evaluations = await EvaluationModel.find({ studentId });

    res.json({
      student: sanitizeUser(student),
      submissions,
      evaluations,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/students/:id/approval
router.patch('/students/:id/approval', async (req, res: Response): Promise<void> => {
  try {
    const { approvalStatus, rejectionReason } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(approvalStatus)) {
      res.status(400).json({ error: 'Invalid approval status. Must be approved, rejected, or pending.' });
      return;
    }

    const student = await UserModel.findById(req.params.id);
    if (!student || student.role !== 'student') {
      res.status(404).json({ error: 'Student not found.' });
      return;
    }

    student.approvalStatus = approvalStatus;
    if (approvalStatus === 'rejected') {
      student.rejectionReason = rejectionReason || 'Profile requirements not satisfied.';
    } else {
      student.rejectionReason = '';
    }

    await student.save();
    res.json({
      message: `Student status updated to ${approvalStatus}.`,
      student: sanitizeUser(student),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/students/:id/status
router.patch('/students/:id/status', async (req, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!['active', 'deactivated'].includes(status)) {
      res.status(400).json({ error: 'Invalid status. Must be active or deactivated.' });
      return;
    }

    const student = await UserModel.findById(req.params.id);
    if (!student || student.role !== 'student') {
      res.status(404).json({ error: 'Student not found.' });
      return;
    }

    student.status = status;
    await student.save();
    res.json({
      message: `Student account ${status === 'active' ? 'activated' : 'deactivated'}.`,
      student: sanitizeUser(student),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// EVALUATOR MANAGEMENT
// ==========================================

// GET /api/admin/evaluators
router.get('/evaluators', async (_req, res: Response): Promise<void> => {
  try {
    const evaluators = await UserModel.find({ role: 'evaluator' });

    // Aggregate assigned and completed submission counts for each evaluator
    const evaluatorsWithStats = await Promise.all(
      evaluators.map(async (ev) => {
        const evId = String(ev._id || ev.id);
        const assignedCount = await SubmissionModel.countDocuments({ assignedEvaluatorId: evId });
        const completedCount = await EvaluationModel.countDocuments({ evaluatorId: evId, status: 'completed' });
        return {
          ...sanitizeUser(ev),
          assignedCount,
          completedCount,
        };
      })
    );

    res.json({ evaluators: evaluatorsWithStats });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch evaluators: ' + err.message });
  }
});

// POST /api/admin/evaluators - Create Evaluator
router.post('/evaluators', async (req, res: Response): Promise<void> => {
  try {
    const { name, email, username, password, staffId, department } = req.body;

    if (!name || !email || !password || !username) {
      res.status(400).json({ error: 'Name, email, username, and password/setup credential are required.' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanUsername = String(username).trim().toLowerCase();

    // Prevent duplicate email or username
    const existingEmail = await UserModel.findOne({ email: cleanEmail });
    if (existingEmail) {
      res.status(400).json({ error: 'An account with this email already exists.' });
      return;
    }

    const existingUsername = await UserModel.findOne({ username: cleanUsername });
    if (existingUsername) {
      res.status(400).json({ error: 'An account with this username already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const evaluator = await UserModel.create({
      name: String(name).trim(),
      email: cleanEmail,
      username: cleanUsername,
      password: hashedPassword,
      role: 'evaluator',
      status: 'active',
      staffId: staffId ? String(staffId).trim() : 'EV-' + Math.floor(1000 + Math.random() * 9000),
      department: department || 'Engineering Faculty',
      mustChangePassword: true,
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanUsername}`,
    });

    res.status(201).json({
      message: 'Evaluator account created successfully.',
      evaluator: sanitizeUser(evaluator),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create evaluator: ' + err.message });
  }
});

// PATCH /api/admin/evaluators/:id/status
router.patch('/evaluators/:id/status', async (req, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!['active', 'deactivated'].includes(status)) {
      res.status(400).json({ error: 'Invalid status. Must be active or deactivated.' });
      return;
    }

    const evaluator = await UserModel.findById(req.params.id);
    if (!evaluator || evaluator.role !== 'evaluator') {
      res.status(404).json({ error: 'Evaluator not found.' });
      return;
    }

    evaluator.status = status;
    await evaluator.save();
    res.json({
      message: `Evaluator account ${status === 'active' ? 'activated' : 'deactivated'}.`,
      evaluator: sanitizeUser(evaluator),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/evaluators/:id/reset-password
router.post('/evaluators/:id/reset-password', async (req, res: Response): Promise<void> => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'Temporary password must be at least 6 characters.' });
      return;
    }

    const evaluator = await UserModel.findById(req.params.id);
    if (!evaluator || evaluator.role !== 'evaluator') {
      res.status(404).json({ error: 'Evaluator not found.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    evaluator.password = await bcrypt.hash(newPassword, salt);
    evaluator.mustChangePassword = true;
    await evaluator.save();

    res.json({ message: 'Evaluator password reset successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// SUBMISSION MANAGEMENT
// ==========================================

// GET /api/admin/submissions
router.get('/submissions', async (req, res: Response): Promise<void> => {
  try {
    const { status, challengeId, studentId, evaluatorId } = req.query;
    const query: Record<string, any> = {};

    if (status) query.status = status;
    if (challengeId) query.challengeId = challengeId;
    if (studentId) query.studentId = studentId;
    if (evaluatorId) query.assignedEvaluatorId = evaluatorId;

    const submissions = await SubmissionModel.find(query);

    // Include evaluation data if evaluated
    const populated = await Promise.all(
      submissions.map(async (sub) => {
        const subObj = sub.toObject ? sub.toObject() : { ...sub };
        if (subObj.evaluationId) {
          const evalDoc = await EvaluationModel.findById(subObj.evaluationId);
          subObj.evaluation = evalDoc ? (evalDoc.toObject ? evalDoc.toObject() : evalDoc) : null;
        }
        return subObj;
      })
    );

    res.json({ submissions: populated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch submissions: ' + err.message });
  }
});

// GET /api/admin/submissions/:id
router.get('/submissions/:id', async (req, res: Response): Promise<void> => {
  try {
    const submission = await SubmissionModel.findById(req.params.id);
    if (!submission) {
      res.status(404).json({ error: 'Submission not found.' });
      return;
    }

    const challenge = await ChallengeModel.findById(submission.challengeId);
    const student = await UserModel.findById(submission.studentId);
    let evaluation = null;
    if (submission.evaluationId) {
      evaluation = await EvaluationModel.findById(submission.evaluationId);
    }

    res.json({
      submission,
      challenge,
      student: student ? sanitizeUser(student) : null,
      evaluation,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/submissions/:id/assign
router.post('/submissions/:id/assign', async (req, res: Response): Promise<void> => {
  try {
    const { evaluatorId } = req.body;
    if (!evaluatorId) {
      res.status(400).json({ error: 'evaluatorId is required.' });
      return;
    }

    const submission = await SubmissionModel.findById(req.params.id);
    if (!submission) {
      res.status(404).json({ error: 'Submission not found.' });
      return;
    }

    const evaluator = await UserModel.findById(evaluatorId);
    if (!evaluator || evaluator.role !== 'evaluator') {
      res.status(404).json({ error: 'Evaluator not found.' });
      return;
    }

    // Prevent assigning to inactive evaluator
    if (evaluator.status === 'deactivated') {
      res.status(400).json({ error: 'Cannot assign to a deactivated evaluator. Please activate the evaluator first.' });
      return;
    }

    // Prevent evaluator evaluating own submission (if evaluator also registered as student with same ID)
    if (String(evaluator._id || evaluator.id) === String(submission.studentId)) {
      res.status(400).json({ error: 'An evaluator cannot evaluate their own submission.' });
      return;
    }

    submission.assignedEvaluatorId = String(evaluator._id || evaluator.id);
    submission.assignedEvaluatorName = evaluator.name;
    submission.assignedAt = new Date();
    if (submission.status === 'submitted') {
      submission.status = 'assigned';
    }

    await submission.save();

    res.json({
      message: `Submission successfully assigned to ${evaluator.name}.`,
      submission,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to assign submission: ' + err.message });
  }
});

// ==========================================
// CHALLENGE MANAGEMENT
// ==========================================

// GET /api/admin/challenges
router.get('/challenges', async (_req, res: Response): Promise<void> => {
  try {
    const challenges = await ChallengeModel.find({});
    res.json({ challenges });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/challenges
router.post('/challenges', async (req, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      category,
      difficulty,
      submissionType,
      starterCode,
      testCasesOrExamples,
      maxMarks,
      deadline,
      status,
      rubric,
    } = req.body;

    if (!title || !description || !category || !difficulty || !submissionType) {
      res.status(400).json({ error: 'Title, description, category, difficulty, and submissionType are required.' });
      return;
    }

    if (!Array.isArray(rubric) || rubric.length === 0) {
      res.status(400).json({ error: 'Challenge must contain at least one evaluation rubric criterion.' });
      return;
    }

    const calculatedMaxMarks = Number(maxMarks) || rubric.reduce((acc: number, r: any) => acc + (Number(r.maxMarks) || 0), 0);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString(36);

    const challenge = await ChallengeModel.create({
      title: title.trim(),
      slug,
      description: description.trim(),
      category,
      difficulty,
      submissionType,
      starterCode: starterCode || '',
      testCasesOrExamples: Array.isArray(testCasesOrExamples) ? testCasesOrExamples : [],
      maxMarks: calculatedMaxMarks,
      deadline: deadline || '',
      status: status || 'published',
      rubric: rubric.map((r: any, idx: number) => ({
        id: r.id || `crit_${idx + 1}`,
        criterion: r.criterion?.trim() || `Criterion ${idx + 1}`,
        maxMarks: Number(r.maxMarks) || 10,
        description: r.description?.trim() || '',
      })),
    });

    res.status(201).json({
      message: 'Challenge created successfully.',
      challenge,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create challenge: ' + err.message });
  }
});

// PUT /api/admin/challenges/:id
router.put('/challenges/:id', async (req, res: Response): Promise<void> => {
  try {
    const challenge = await ChallengeModel.findById(req.params.id);
    if (!challenge) {
      res.status(404).json({ error: 'Challenge not found.' });
      return;
    }

    const {
      title,
      description,
      category,
      difficulty,
      submissionType,
      starterCode,
      testCasesOrExamples,
      maxMarks,
      deadline,
      status,
      rubric,
    } = req.body;

    if (title) challenge.title = title.trim();
    if (description) challenge.description = description.trim();
    if (category) challenge.category = category;
    if (difficulty) challenge.difficulty = difficulty;
    if (submissionType) challenge.submissionType = submissionType;
    if (starterCode !== undefined) challenge.starterCode = starterCode;
    if (testCasesOrExamples !== undefined) challenge.testCasesOrExamples = testCasesOrExamples;
    if (maxMarks !== undefined) challenge.maxMarks = Number(maxMarks);
    if (deadline !== undefined) challenge.deadline = deadline;
    if (status) challenge.status = status;
    if (rubric && Array.isArray(rubric)) {
      challenge.rubric = rubric.map((r: any, idx: number) => ({
        id: r.id || `crit_${idx + 1}`,
        criterion: r.criterion?.trim() || `Criterion ${idx + 1}`,
        maxMarks: Number(r.maxMarks) || 10,
        description: r.description?.trim() || '',
      }));
    }

    await challenge.save();
    res.json({ message: 'Challenge updated successfully.', challenge });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/challenges/:id/status
router.patch('/challenges/:id/status', async (req, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!['published', 'draft', 'archived'].includes(status)) {
      res.status(400).json({ error: 'Status must be published, draft, or archived.' });
      return;
    }

    const challenge = await ChallengeModel.findById(req.params.id);
    if (!challenge) {
      res.status(404).json({ error: 'Challenge not found.' });
      return;
    }

    challenge.status = status;
    await challenge.save();
    res.json({ message: `Challenge status updated to ${status}.`, challenge });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
