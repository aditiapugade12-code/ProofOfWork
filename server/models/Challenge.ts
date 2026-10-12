import mongoose, { Schema } from 'mongoose';
import { createStoreAccessor, isUsingMongoose } from '../db.ts';

export interface IRubricItem {
  id: string;
  criterion: string;
  maxMarks: number;
  description: string;
}

export interface IExample {
  title: string;
  input: string;
  expectedOutput: string;
  explanation?: string;
}

export interface IChallenge {
  _id?: string;
  id?: string;
  title: string;
  slug: string;
  description: string;
  category: 'Web Development' | 'Data & SQL' | 'Backend Systems' | 'Algorithms' | 'DevOps' | 'Mobile';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  submissionType: 'code' | 'sql' | 'project_link' | 'written';
  starterCode?: string;
  testCasesOrExamples?: IExample[];
  maxMarks: number;
  deadline?: string;
  status: 'published' | 'draft' | 'archived';
  rubric: IRubricItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

const ChallengeSchema = new Schema<IChallenge>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['Web Development', 'Data & SQL', 'Backend Systems', 'Algorithms', 'DevOps', 'Mobile'],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      required: true,
    },
    submissionType: {
      type: String,
      enum: ['code', 'sql', 'project_link', 'written'],
      required: true,
    },
    starterCode: { type: String, default: '' },
    testCasesOrExamples: [
      {
        title: { type: String },
        input: { type: String },
        expectedOutput: { type: String },
        explanation: { type: String },
      },
    ],
    maxMarks: { type: Number, required: true, default: 100 },
    deadline: { type: String },
    status: {
      type: String,
      enum: ['published', 'draft', 'archived'],
      default: 'published',
    },
    rubric: [
      {
        id: { type: String, required: true },
        criterion: { type: String, required: true },
        maxMarks: { type: Number, required: true },
        description: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

const MongooseChallengeModel =
  mongoose.models.Challenge || mongoose.model<IChallenge>('Challenge', ChallengeSchema);
const storeAccessor = createStoreAccessor<IChallenge>('challenges');

export const ChallengeModel = {
  find(query: Record<string, any> = {}) {
    if (isUsingMongoose()) {
      return MongooseChallengeModel.find(query);
    }
    return storeAccessor.find(query);
  },

  findOne(query: Record<string, any>) {
    if (isUsingMongoose()) {
      return MongooseChallengeModel.findOne(query);
    }
    return storeAccessor.findOne(query);
  },

  findById(id: string) {
    if (isUsingMongoose()) {
      return MongooseChallengeModel.findById(id);
    }
    return storeAccessor.findById(id);
  },

  create(doc: Partial<IChallenge>) {
    const withDefaults = {
      status: 'published' as const,
      ...doc,
    };
    if (isUsingMongoose()) {
      return MongooseChallengeModel.create(withDefaults);
    }
    return storeAccessor.create(withDefaults);
  },

  findByIdAndUpdate(id: string, update: any, options = { new: true }) {
    if (isUsingMongoose()) {
      return MongooseChallengeModel.findByIdAndUpdate(id, update, options);
    }
    return storeAccessor.findByIdAndUpdate(id, update, options);
  },

  countDocuments(query: Record<string, any> = {}) {
    if (isUsingMongoose()) {
      return MongooseChallengeModel.countDocuments(query);
    }
    return storeAccessor.countDocuments(query);
  },

  deleteMany(query: Record<string, any> = {}) {
    if (isUsingMongoose()) {
      return MongooseChallengeModel.deleteMany(query);
    }
    return storeAccessor.deleteMany(query);
  },
};
