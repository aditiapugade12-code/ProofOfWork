import mongoose, { Schema } from 'mongoose';
import { createStoreAccessor, isUsingMongoose } from '../db.ts';

export interface IUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  username: string;
  password?: string;
  role: 'admin' | 'student' | 'evaluator';
  status: 'active' | 'deactivated';
  
  // Student attributes
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  college?: string;
  department?: string;
  branch?: string;
  year?: string;
  rollNumber?: string;
  skills?: string[];
  bio?: string;
  avatarUrl?: string;

  // Evaluator attributes
  staffId?: string;
  mustChangePassword?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'student', 'evaluator'], required: true },
    status: { type: String, enum: ['active', 'deactivated'], default: 'active' },

    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String },
    college: { type: String },
    department: { type: String },
    branch: { type: String },
    year: { type: String },
    rollNumber: { type: String },
    skills: [{ type: String }],
    bio: { type: String },
    avatarUrl: { type: String },

    staffId: { type: String },
    mustChangePassword: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const MongooseUserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
const storeAccessor = createStoreAccessor<IUser>('users');

export const UserModel = {
  find(query: Record<string, any> = {}) {
    if (isUsingMongoose()) {
      return MongooseUserModel.find(query);
    }
    return storeAccessor.find(query);
  },

  findOne(query: Record<string, any>) {
    if (isUsingMongoose()) {
      return MongooseUserModel.findOne(query);
    }
    return storeAccessor.findOne(query);
  },

  findById(id: string) {
    if (isUsingMongoose()) {
      return MongooseUserModel.findById(id);
    }
    return storeAccessor.findById(id);
  },

  create(doc: Partial<IUser>) {
    if (isUsingMongoose()) {
      return MongooseUserModel.create(doc);
    }
    return storeAccessor.create(doc);
  },

  findByIdAndUpdate(id: string, update: any, options = { new: true }) {
    if (isUsingMongoose()) {
      return MongooseUserModel.findByIdAndUpdate(id, update, options);
    }
    return storeAccessor.findByIdAndUpdate(id, update, options);
  },

  countDocuments(query: Record<string, any> = {}) {
    if (isUsingMongoose()) {
      return MongooseUserModel.countDocuments(query);
    }
    return storeAccessor.countDocuments(query);
  },

  distinct(field: string, query: Record<string, any> = {}) {
    if (isUsingMongoose()) {
      return MongooseUserModel.distinct(field, query);
    }
    return storeAccessor.distinct(field, query);
  },

  deleteMany(query: Record<string, any> = {}) {
    if (isUsingMongoose()) {
      return MongooseUserModel.deleteMany(query);
    }
    return storeAccessor.deleteMany(query);
  },
};
