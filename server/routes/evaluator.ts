import { Router, Response } from 'express';
import { UserModel } from '../models/User.ts';
import { ChallengeModel } from '../models/Challenge.ts';
import { SubmissionModel } from '../models/Submission.ts';
import { EvaluationModel, IRubricScore } from '../models/Evaluation.ts';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.ts';
import { sanitizeUser } from './auth.ts';

const router = Router();

// Protect ALL evaluator routes
router.use(authenticate);
router.use(requireRole('evaluator'));

// GET /api/evaluator/submissions - List submissions assigned to this evaluator
router.get('/submissions', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const evaluatorId = String(req.user?._id || req.user?.id);
    const { status } = req.query;

    const query: Record<string, any> = { assignedEvaluatorId: evaluatorId };

    if (status === 'pending') {
      query.status = { $in: ['assigned', 'submitted'] };
    } else if (status === 'in_progress') {
      query.status = 'under_review';
    } else if (status === 'completed') {
      query.status = 'evaluated';
    } else if (status) {
      query.status = status;
    }

    const submissions = await SubmissionModel.find(query);

    // Populate evaluation summary if available
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
    res.status(500).json({ error: 'Failed to fetch evaluator submissions: ' + err.message });
  }
});

// GET /api/evaluator/submissions/:id - View submission details
router.get('/submissions/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const evaluatorId = String(req.user?._id || req.user?.id);
    const submission = await SubmissionModel.findById(req.params.id);

    if (!submission) {
      res.status(404).json({ error: 'Submission not found.' });
      return;
    }

    // Security check: Evaluator can only access submissions assigned to them
    if (String(submission.assignedEvaluatorId) !== evaluatorId) {
      res.status(403).json({ error: 'Forbidden: This submission is not assigned to you.' });
      return;
    }

    // Prevent evaluator from evaluating own submission
    if (String(submission.studentId) === evaluatorId) {
      res.status(403).json({ error: 'Forbidden: You cannot evaluate your own submission.' });
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

// POST /api/evaluator/submissions/:id/evaluate - Save draft or finalize evaluation
router.post('/submissions/:id/evaluate', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const evaluatorId = String(req.user?._id || req.user?.id);
    const evaluatorName = req.user?.name || 'Evaluator';

    const submission = await SubmissionModel.findById(req.params.id);
    if (!submission) {
      res.status(404).json({ error: 'Submission not found.' });
      return;
    }

    // Security check: must be assigned to this evaluator
    if (String(submission.assignedEvaluatorId) !== evaluatorId) {
      res.status(403).json({ error: 'Forbidden: This submission is not assigned to you.' });
      return;
    }

    // Security check: cannot evaluate own submission
    if (String(submission.studentId) === evaluatorId) {
      res.status(403).json({ error: 'Forbidden: You cannot evaluate your own submission.' });
      return;
    }

    const challenge = await ChallengeModel.findById(submission.challengeId);
    if (!challenge) {
      res.status(404).json({ error: 'Associated challenge not found.' });
      return;
    }

    const { rubricScores, feedback, improvementSuggestions, isDraft } = req.body;

    if (!Array.isArray(rubricScores) || rubricScores.length === 0) {
      res.status(400).json({ error: 'Evaluation requires rubric scores for all criteria.' });
      return;
    }

    if (!isDraft && (!feedback || !String(feedback).trim())) {
      res.status(400).json({ error: 'Written feedback is required to finalize an evaluation.' });
      return;
    }

    // Validate rubric scores against criteria maximums
    let totalAwarded = 0;
    let maxPossible = 0;
    const validatedScores: IRubricScore[] = [];

    for (const scoreItem of rubricScores) {
      const criterionDef = challenge.rubric.find(
        (r: any) => String(r.id) === String(scoreItem.criterionId)
      );

      const criterionMax = criterionDef ? criterionDef.maxMarks : Number(scoreItem.maxMarks) || 10;
      const criterionName = criterionDef ? criterionDef.criterion : String(scoreItem.criterionName || 'Criterion');
      const awarded = Number(scoreItem.awardedMarks);

      if (isNaN(awarded) || awarded < 0) {
        res.status(400).json({
          error: `Marks for "${criterionName}" must be a non-negative number.`,
        });
        return;
      }

      if (awarded > criterionMax) {
        res.status(400).json({
          error: `Awarded marks (${awarded}) for "${criterionName}" cannot exceed criterion maximum (${criterionMax}).`,
        });
        return;
      }

      totalAwarded += awarded;
      maxPossible += criterionMax;

      validatedScores.push({
        criterionId: String(scoreItem.criterionId),
        criterionName,
        maxMarks: criterionMax,
        awardedMarks: awarded,
        comment: scoreItem.comment || '',
      });
    }

    if (totalAwarded > challenge.maxMarks) {
      res.status(400).json({
        error: `Total awarded marks (${totalAwarded}) cannot exceed challenge maximum (${challenge.maxMarks}).`,
      });
      return;
    }

    const percentage = maxPossible > 0 ? Math.round((totalAwarded / maxPossible) * 100) : 0;
    const evaluationStatus = isDraft
      ? 'draft'
      : percentage < 40
      ? 'needs_improvement'
      : 'completed';

    let evaluationDoc: any;

    if (submission.evaluationId) {
      evaluationDoc = await EvaluationModel.findById(submission.evaluationId);
    }

    const historyEntry = {
      action: isDraft ? 'Draft Saved' : 'Evaluation Finalized',
      by: evaluatorName,
      timestamp: new Date(),
      note: isDraft
        ? `Draft score: ${totalAwarded}/${maxPossible}`
        : `Final score awarded: ${totalAwarded}/${maxPossible} (${percentage}%)`,
    };

    if (evaluationDoc) {
      evaluationDoc.rubricScores = validatedScores;
      evaluationDoc.totalMarks = totalAwarded;
      evaluationDoc.maxPossibleMarks = maxPossible;
      evaluationDoc.percentage = percentage;
      evaluationDoc.status = evaluationStatus;
      evaluationDoc.feedback = feedback ? String(feedback).trim() : evaluationDoc.feedback;
      evaluationDoc.improvementSuggestions = improvementSuggestions ? String(improvementSuggestions).trim() : '';
      evaluationDoc.evaluationHistory = evaluationDoc.evaluationHistory || [];
      evaluationDoc.evaluationHistory.push(historyEntry);
      if (!isDraft) {
        evaluationDoc.evaluatedAt = new Date();
      }
      await evaluationDoc.save();
    } else {
      evaluationDoc = await EvaluationModel.create({
        submissionId: String(submission._id || submission.id),
        challengeId: String(challenge._id || challenge.id),
        studentId: String(submission.studentId),
        evaluatorId,
        evaluatorName,
        rubricScores: validatedScores,
        totalMarks: totalAwarded,
        maxPossibleMarks: maxPossible,
        percentage,
        status: evaluationStatus,
        feedback: feedback ? String(feedback).trim() : 'Draft saved.',
        improvementSuggestions: improvementSuggestions ? String(improvementSuggestions).trim() : '',
        evaluationHistory: [historyEntry],
        evaluatedAt: isDraft ? undefined : new Date(),
      });

      submission.evaluationId = String(evaluationDoc._id || evaluationDoc.id);
    }

    // Update submission status
    if (isDraft) {
      submission.status = 'under_review';
    } else {
      submission.status = evaluationStatus === 'needs_improvement' ? 'rejected' : 'evaluated';
    }
    await submission.save();

    res.json({
      message: isDraft
        ? 'Evaluation draft saved successfully.'
        : 'Evaluation successfully finalized and published to student.',
      evaluation: evaluationDoc,
      submission,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Evaluation failed: ' + err.message });
  }
});

// GET /api/evaluator/history - Evaluation history
router.get('/history', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const evaluatorId = String(req.user?._id || req.user?.id);
    const evaluations = await EvaluationModel.find({ evaluatorId });
    res.json({ evaluations });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
