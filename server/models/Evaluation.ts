import mongoose, { Schema } from 'mongoose';
import { createStoreAccessor, isUsingMongoose } from '../db.ts';

export interface IRubricScore {
  criterionId: string;
  criterionName: string;
  maxMarks: number;
  awardedMarks: number;
  comment?: string;
}

export interface IEvaluationHistoryItem {
  action: string;
  by: string;
  timestamp: Date;
  note?: string;
}

export interface IEvaluation {
  _id?: string;
  id?: string;
  submissionId: string;
  challengeId: string;
  studentId: string;
  evaluatorId: string;
  evaluatorName: string;
  rubricScores: IRubricScore[];
  totalMarks: number;
  maxPossibleMarks: number;
  percentage: number;
  status: 'draft' | 'completed' | 'needs_improvement';
  feedback: string;
  improvementSuggestions?: string;
  evaluationHistory: IEvaluationHistoryItem[];
  evaluatedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const EvaluationSchema = new Schema<IEvaluation>(
  {
    submissionId: { type: String, required: true },
    challengeId: { type: String, required: true },
    studentId: { type: String, required: true },
    evaluatorId: { type: String, required: true },
    evaluatorName: { type: String, required: true },
    rubricScores: [
      {
        criterionId: { type: String, required: true },
        criterionName: { type: String, required: true },
        maxMarks: { type: Number, required: true },
        awardedMarks: { type: Number, required: true },
        comment: { type: String },
      },
    ],
    totalMarks: { type: Number, required: true },
    maxPossibleMarks: { type: Number, required: true },
    percentage: { type: Number, required: true },
    status: {
      type: String,
      enum: ['draft', 'completed', 'needs_improvement'],
      default: 'draft',
    },
    feedback: { type: String, required: true },
    improvementSuggestions: { type: String, default: '' },
    evaluationHistory: [
      {
        action: { type: String, required: true },
        by: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
    evaluatedAt: { type: Date },
  },
  { timestamps: true }
);

const MongooseEvaluationModel =
  mongoose.models.Evaluation || mongoose.model<IEvaluation>('Evaluation', EvaluationSchema);
const storeAccessor = createStoreAccessor<IEvaluation>('evaluations');

export const EvaluationModel = {
  find(query: Record<string, any> = {}) {
    if (isUsingMongoose()) {
      return MongooseEvaluationModel.find(query);
    }
    return storeAccessor.find(query);
  },

  findOne(query: Record<string, any>) {
    if (isUsingMongoose()) {
      return MongooseEvaluationModel.findOne(query);
    }
    return storeAccessor.findOne(query);
  },

  findById(id: string) {
    if (isUsingMongoose()) {
      return MongooseEvaluationModel.findById(id);
    }
    return storeAccessor.findById(id);
  },

  create(doc: Partial<IEvaluation>) {
    if (isUsingMongoose()) {
      return MongooseEvaluationModel.create(doc);
    }
    return storeAccessor.create(doc);
  },

  findByIdAndUpdate(id: string, update: any, options = { new: true }) {
    if (isUsingMongoose()) {
      return MongooseEvaluationModel.findByIdAndUpdate(id, update, options);
    }
    return storeAccessor.findByIdAndUpdate(id, update, options);
  },

  countDocuments(query: Record<string, any> = {}) {
    if (isUsingMongoose()) {
      return MongooseEvaluationModel.countDocuments(query);
    }
    return storeAccessor.countDocuments(query);
  },

  deleteMany(query: Record<string, any> = {}) {
    if (isUsingMongoose()) {
      return MongooseEvaluationModel.deleteMany(query);
    }
    return storeAccessor.deleteMany(query);
  },
};
