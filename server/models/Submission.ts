import mongoose, { Schema } from 'mongoose';
import { createStoreAccessor, isUsingMongoose } from '../db.ts';

export interface ISubmissionContent {
  code?: string;
  sqlQuery?: string;
  repositoryUrl?: string;
  liveUrl?: string;
  writtenAnswer?: string;
  notes?: string;
}

export interface ISubmission {
  _id?: string;
  id?: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentRollNumber?: string;
  challengeId: string;
  challengeTitle: string;
  challengeCategory: string;
  submissionType: 'code' | 'sql' | 'project_link' | 'written';
  content: ISubmissionContent;
  status: 'submitted' | 'assigned' | 'under_review' | 'evaluated' | 'rejected';
  assignedEvaluatorId?: string | null;
  assignedEvaluatorName?: string | null;
  assignedAt?: Date | null;
  evaluationId?: string | null;
  submittedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true },
    studentRollNumber: { type: String },
    challengeId: { type: String, required: true },
    challengeTitle: { type: String, required: true },
    challengeCategory: { type: String, required: true },
    submissionType: {
      type: String,
      enum: ['code', 'sql', 'project_link', 'written'],
      required: true,
    },
    content: {
      code: { type: String },
      sqlQuery: { type: String },
      repositoryUrl: { type: String },
      liveUrl: { type: String },
      writtenAnswer: { type: String },
      notes: { type: String },
    },
    status: {
      type: String,
      enum: ['submitted', 'assigned', 'under_review', 'evaluated', 'rejected'],
      default: 'submitted',
    },
    assignedEvaluatorId: { type: String, default: null },
    assignedEvaluatorName: { type: String, default: null },
    assignedAt: { type: Date, default: null },
    evaluationId: { type: String, default: null },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const MongooseSubmissionModel =
  mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);
const storeAccessor = createStoreAccessor<ISubmission>('submissions');

export const SubmissionModel = {
  find(query: Record<string, any> = {}) {
    if (isUsingMongoose()) {
      return MongooseSubmissionModel.find(query);
    }
    return storeAccessor.find(query);
  },

  findOne(query: Record<string, any>) {
    if (isUsingMongoose()) {
      return MongooseSubmissionModel.findOne(query);
    }
    return storeAccessor.findOne(query);
  },

  findById(id: string) {
    if (isUsingMongoose()) {
      return MongooseSubmissionModel.findById(id);
    }
    return storeAccessor.findById(id);
  },

  create(doc: Partial<ISubmission>) {
    const withDefaults: Partial<ISubmission> = {
      status: 'submitted',
      assignedEvaluatorId: null,
      assignedEvaluatorName: null,
      assignedAt: null,
      evaluationId: null,
      ...doc,
    };
    if (isUsingMongoose()) {
      return MongooseSubmissionModel.create(withDefaults);
    }
    return storeAccessor.create(withDefaults);
  },

  findByIdAndUpdate(id: string, update: any, options = { new: true }) {
    if (isUsingMongoose()) {
      return MongooseSubmissionModel.findByIdAndUpdate(id, update, options);
    }
    return storeAccessor.findByIdAndUpdate(id, update, options);
  },

  countDocuments(query: Record<string, any> = {}) {
    if (isUsingMongoose()) {
      return MongooseSubmissionModel.countDocuments(query);
    }
    return storeAccessor.countDocuments(query);
  },

  deleteMany(query: Record<string, any> = {}) {
    if (isUsingMongoose()) {
      return MongooseSubmissionModel.deleteMany(query);
    }
    return storeAccessor.deleteMany(query);
  },
};
