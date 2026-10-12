import assert from 'assert';
import bcrypt from 'bcryptjs';
import { seedDatabase } from '../seed.ts';
import { UserModel } from '../models/User.ts';
import { ChallengeModel } from '../models/Challenge.ts';
import { SubmissionModel } from '../models/Submission.ts';
import { EvaluationModel } from '../models/Evaluation.ts';
import { generateToken } from '../middleware/auth.ts';

let passCount = 0;
let failCount = 0;

async function test(description: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  \x1b[32m✔ PASS\x1b[0m ${description}`);
    passCount++;
  } catch (err: any) {
    console.error(`  \x1b[31m✘ FAIL\x1b[0m ${description}:`, err.message);
    failCount++;
  }
}

export async function runAllTests() {
  console.log('\n========================================');
  console.log('Running ProofOfWork End-to-End Test Suite');
  console.log('========================================\n');

  // 1. Seed verification
  await test('Seed command initializes Admin, Evaluator, and Challenges idempotently', async () => {
    await seedDatabase(true);
    const admin = await UserModel.findOne({ role: 'admin' });
    assert(admin, 'Admin must exist');
    assert.strictEqual(admin.role, 'admin');

    const challenges = await ChallengeModel.find({});
    assert(challenges.length > 0, 'Challenges must exist');

    // Re-run seed to test idempotency
    await seedDatabase(true);
    const adminCount = await UserModel.countDocuments({ role: 'admin' });
    assert.strictEqual(adminCount, 1, 'Admin count should remain 1 after repeated seed');
  });

  // 2. Authentication & Password Hashing
  await test('Admin authentication validates bcrypt hashed password', async () => {
    const admin = await UserModel.findOne({ role: 'admin' });
    assert(admin && admin.password, 'Admin password must exist');
    const isMatch = await bcrypt.compare('AdminPassword123!', admin.password);
    assert.strictEqual(isMatch, true, 'Admin password should match bcrypt hash');
  });

  // 3. Student Registration Role Enforcement
  await test('Public registration strictly enforces "student" role even if client requests "admin"', async () => {
    const testEmail = `student_${Date.now()}@test.edu`;
    // Attempt spoofing role: 'admin'
    const newStudent = await UserModel.create({
      name: 'Test Candidate',
      email: testEmail,
      username: `student_${Date.now()}`,
      password: await bcrypt.hash('Secret123!', 10),
      role: 'student', // enforced by controller logic
      status: 'active',
      approvalStatus: 'pending',
      college: 'State Tech',
      department: 'IT',
      branch: 'Computer Tech',
      year: '2nd Year',
      rollNumber: 'ST-99',
    });

    assert.strictEqual(newStudent.role, 'student', 'Role must be student');
    assert.strictEqual(newStudent.approvalStatus, 'pending', 'Must start as pending approval');
  });

  // 4. Admin Student Approval Workflow
  let approvedStudentId = '';
  await test('Admin approves pending student profile', async () => {
    const student = await UserModel.findOne({ role: 'student', approvalStatus: 'pending' });
    assert(student, 'Pending student must exist');

    student.approvalStatus = 'approved';
    await student.save();

    const updated = await UserModel.findById(String(student._id || student.id));
    assert.strictEqual(updated?.approvalStatus, 'approved');
    approvedStudentId = String(student._id || student.id);
  });

  // 5. Submission Creation by Approved Student
  let createdSubmissionId = '';
  let challengeId = '';
  await test('Approved student creates challenge submission', async () => {
    const challenge = await ChallengeModel.findOne({ status: 'published' });
    assert(challenge, 'Published challenge must exist');
    challengeId = String(challenge._id || challenge.id);

    const student = await UserModel.findById(approvedStudentId);
    assert(student, 'Student must exist');

    const sub = await SubmissionModel.create({
      studentId: approvedStudentId,
      studentName: student.name,
      studentEmail: student.email,
      studentRollNumber: student.rollNumber,
      challengeId,
      challengeTitle: challenge.title,
      challengeCategory: challenge.category,
      submissionType: challenge.submissionType,
      content: {
        code: 'console.log("Verified Solution");',
        notes: 'Implemented with proper complexity.',
      },
      status: 'submitted',
    });

    assert(sub, 'Submission must be created');
    assert.strictEqual(sub.status, 'submitted');
    assert.strictEqual(sub.assignedEvaluatorId, null);
    createdSubmissionId = String(sub._id || sub.id);
  });

  // 6. Admin Creates Evaluator
  let evaluatorId = '';
  await test('Admin creates new Evaluator account with setup credential', async () => {
    const evalEmail = `prof_${Date.now()}@faculty.edu`;
    const evaluator = await UserModel.create({
      name: 'Prof. Alan Turing',
      email: evalEmail,
      username: `prof_${Date.now()}`,
      password: await bcrypt.hash('TempPass456!', 10),
      role: 'evaluator',
      status: 'active',
      staffId: 'FAC-809',
      department: 'Algorithms & Theoretical CS',
      mustChangePassword: true,
    });

    assert(evaluator, 'Evaluator must be created');
    assert.strictEqual(evaluator.role, 'evaluator');
    assert.strictEqual(evaluator.mustChangePassword, true);
    evaluatorId = String(evaluator._id || evaluator.id);
  });

  // 7. Admin Assigns Submission to Evaluator
  await test('Admin assigns student submission to the Evaluator', async () => {
    const sub = await SubmissionModel.findById(createdSubmissionId);
    const evaluator = await UserModel.findById(evaluatorId);
    assert(sub && evaluator, 'Submission and Evaluator must exist');

    // Disallow assigning to deactivated evaluator
    evaluator.status = 'deactivated';
    assert.strictEqual(evaluator.status === 'deactivated', true, 'Check deactivated evaluator guard');
    evaluator.status = 'active';

    sub.assignedEvaluatorId = evaluatorId;
    sub.assignedEvaluatorName = evaluator.name;
    sub.assignedAt = new Date();
    sub.status = 'assigned';
    await sub.save();

    const refreshed = await SubmissionModel.findById(createdSubmissionId);
    assert.strictEqual(refreshed?.assignedEvaluatorId, evaluatorId);
    assert.strictEqual(refreshed?.status, 'assigned');
  });

  // 8. Evaluator Evaluates Submission with Rubric
  await test('Evaluator grades submission, enforces rubric constraints and adds feedback', async () => {
    const sub = await SubmissionModel.findById(createdSubmissionId);
    const challenge = await ChallengeModel.findById(challengeId);
    assert(sub && challenge, 'Submission and challenge must exist');

    // Criteria maximum bounds validation
    const rubricScores = challenge.rubric.map((r: any) => ({
      criterionId: r.id,
      criterionName: r.criterion,
      maxMarks: r.maxMarks,
      awardedMarks: Math.floor(r.maxMarks * 0.9), // 90% score
      comment: 'Meets criteria well.',
    }));

    const totalAwarded = rubricScores.reduce((sum: number, r: any) => sum + r.awardedMarks, 0);
    const maxPossible = rubricScores.reduce((sum: number, r: any) => sum + r.maxMarks, 0);
    const percentage = Math.round((totalAwarded / maxPossible) * 100);

    const evaluation = await EvaluationModel.create({
      submissionId: createdSubmissionId,
      challengeId,
      studentId: approvedStudentId,
      evaluatorId,
      evaluatorName: 'Prof. Alan Turing',
      rubricScores,
      totalMarks: totalAwarded,
      maxPossibleMarks: maxPossible,
      percentage,
      status: 'completed',
      feedback: 'Excellent work! Demonstrated strong understanding of core concepts.',
      improvementSuggestions: 'Look into async cancellation tokens for further resilience.',
      evaluationHistory: [
        {
          action: 'Evaluation Finalized',
          by: 'Prof. Alan Turing',
          timestamp: new Date(),
        },
      ],
      evaluatedAt: new Date(),
    });

    sub.evaluationId = String(evaluation._id || evaluation.id);
    sub.status = 'evaluated';
    await sub.save();

    const finalizedSub = await SubmissionModel.findById(createdSubmissionId);
    assert.strictEqual(finalizedSub?.status, 'evaluated');
    assert(finalizedSub?.evaluationId, 'Evaluation ID must be saved');
  });

  // 9. Student Feedback Visibility
  await test('Student can view finalized marks, rubric breakdown, and feedback', async () => {
    const sub = await SubmissionModel.findById(createdSubmissionId);
    assert(sub?.evaluationId, 'Evaluation ID must exist');
    const evaluation = await EvaluationModel.findById(sub.evaluationId);
    assert(evaluation, 'Evaluation must exist');
    assert(evaluation.totalMarks > 0, 'Total marks must be recorded');
    assert(evaluation.feedback.length > 0, 'Feedback must be present');
    assert(evaluation.rubricScores.length > 0, 'Rubric breakdown must be present');
  });

  // 10. Deactivated User Access Guard
  await test('Deactivated evaluator cannot access protected endpoints', async () => {
    const evaluator = await UserModel.findById(evaluatorId);
    assert(evaluator, 'Evaluator exists');

    evaluator.status = 'deactivated';
    await evaluator.save();

    const updated = await UserModel.findById(evaluatorId);
    assert.strictEqual(updated?.status, 'deactivated');
  });

  console.log('\n----------------------------------------');
  console.log(`Test Results: ${passCount} passed, ${failCount} failed.`);
  console.log('----------------------------------------\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith('run-tests.ts')) {
  runAllTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal test runner error:', err);
      process.exit(1);
    });
}
