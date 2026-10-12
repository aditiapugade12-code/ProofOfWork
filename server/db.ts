import fs from 'fs';
import path from 'path';
import mongoose, { Schema } from 'mongoose';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'proofofwork-db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let isMongooseConnected = false;

// Initialize MongoDB connection if MONGODB_URI is provided
export async function initDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (uri) {
    try {
      console.log(`[DB] Attempting connection to MongoDB at: ${uri.replace(/\/\/.*@/, '//***@')}`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 2000,
      });
      isMongooseConnected = true;
      console.log('[DB] Successfully connected to MongoDB via Mongoose.');
      return;
    } catch (err: any) {
      console.warn('[DB] MongoDB connection failed. Falling back to persistent local storage.', err.message);
      isMongooseConnected = false;
    }
  } else {
    console.log('[DB] No MONGODB_URI provided. Running on local persistent file store.');
  }
}

// In-Memory & File-backed Store for fallback/dev stability
interface DbCollections {
  users: any[];
  challenges: any[];
  submissions: any[];
  evaluations: any[];
}

function loadLocalData(): DbCollections {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error('[DB] Error reading fallback file, creating fresh store', e);
    }
  }
  return {
    users: [],
    challenges: [],
    submissions: [],
    evaluations: [],
  };
}

let localStore: DbCollections = loadLocalData();

export function saveLocalData(): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(localStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Error saving data to file:', err);
  }
}

// Helper to check match against simple Mongo query
function matchesQuery(doc: any, query: Record<string, any>): boolean {
  for (const key of Object.keys(query)) {
    const val = query[key];
    if (key === '_id' || key === 'id') {
      const docId = String(doc._id || doc.id);
      if (typeof val === 'object' && val !== null) {
        if (val.$in && !val.$in.map(String).includes(docId)) return false;
        if (val.$ne && String(val.$ne) === docId) return false;
      } else if (docId !== String(val)) {
        return false;
      }
      continue;
    }

    if (val === undefined) continue;

    if (typeof val === 'object' && val !== null) {
      if (val.$in && Array.isArray(val.$in)) {
        if (!val.$in.includes(doc[key])) return false;
      } else if (val.$nin && Array.isArray(val.$nin)) {
        if (val.$nin.includes(doc[key])) return false;
      } else if (val.$ne !== undefined) {
        if (doc[key] === val.$ne) return false;
      } else if (val.$regex) {
        const regex = new RegExp(val.$regex, val.$options || 'i');
        if (!regex.test(String(doc[key] || ''))) return false;
      }
    } else {
      if (doc[key] !== val) return false;
    }
  }
  return true;
}

// Document Wrapper to mimic Mongoose document methods like .save(), .toObject()
export class DocumentModel<T extends Record<string, any>> {
  collectionName: keyof DbCollections;
  [key: string]: any;

  constructor(collectionName: keyof DbCollections, data: Partial<T>) {
    this.collectionName = collectionName;
    Object.assign(this, data);
    if (!this._id && !this.id) {
      this._id = 'doc_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    }
    if (!this.id) {
      this.id = this._id;
    }
  }

  toObject(): T {
    const copy: any = { ...this };
    delete copy.collectionName;
    return copy;
  }

  toJSON(): T {
    return this.toObject();
  }

  async save(): Promise<this> {
    const targetCollection = localStore[this.collectionName];
    const existingIndex = targetCollection.findIndex(
      (item) => String(item._id || item.id) === String(this._id || this.id)
    );
    this.updatedAt = new Date();
    const docData = this.toObject();
    if (existingIndex >= 0) {
      targetCollection[existingIndex] = docData;
    } else {
      if (!this.createdAt) this.createdAt = new Date();
      targetCollection.push(docData);
    }
    saveLocalData();
    return this;
  }
}

export function createStoreAccessor<T extends Record<string, any>>(collectionName: keyof DbCollections) {
  return {
    async find(query: Record<string, any> = {}): Promise<DocumentModel<T>[]> {
      const docs = localStore[collectionName].filter((doc) => matchesQuery(doc, query));
      return docs.map((d) => new DocumentModel<T>(collectionName, d));
    },

    async findOne(query: Record<string, any>): Promise<DocumentModel<T> | null> {
      const doc = localStore[collectionName].find((item) => matchesQuery(item, query));
      return doc ? new DocumentModel<T>(collectionName, doc) : null;
    },

    async findById(id: string | any): Promise<DocumentModel<T> | null> {
      const strId = String(id);
      const doc = localStore[collectionName].find((item) => String(item._id || item.id) === strId);
      return doc ? new DocumentModel<T>(collectionName, doc) : null;
    },

    async create(docData: Partial<T>): Promise<DocumentModel<T>> {
      const newDoc = new DocumentModel<T>(collectionName, {
        ...docData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await newDoc.save();
      return newDoc;
    },

    async findByIdAndUpdate(
      id: string | any,
      update: Partial<T> | Record<string, any>,
      options: { new?: boolean } = { new: true }
    ): Promise<DocumentModel<T> | null> {
      const doc = await this.findById(id);
      if (!doc) return null;

      // Handle MongoDB $set or direct update
      const updatePayload = update.$set ? { ...update.$set } : { ...update };
      delete (updatePayload as any)._id;
      delete (updatePayload as any).id;

      Object.assign(doc, updatePayload);
      doc.updatedAt = new Date();
      await doc.save();
      return doc;
    },

    async updateOne(query: Record<string, any>, update: Record<string, any>): Promise<boolean> {
      const doc = await this.findOne(query);
      if (!doc) return false;
      const updatePayload = update.$set ? { ...update.$set } : { ...update };
      delete (updatePayload as any)._id;
      Object.assign(doc, updatePayload);
      doc.updatedAt = new Date();
      await doc.save();
      return true;
    },

    async countDocuments(query: Record<string, any> = {}): Promise<number> {
      return localStore[collectionName].filter((doc) => matchesQuery(doc, query)).length;
    },

    async deleteMany(query: Record<string, any> = {}): Promise<number> {
      const initialCount = localStore[collectionName].length;
      localStore[collectionName] = localStore[collectionName].filter((doc) => !matchesQuery(doc, query));
      saveLocalData();
      return initialCount - localStore[collectionName].length;
    },

    async distinct(field: string, query: Record<string, any> = {}): Promise<any[]> {
      const docs = localStore[collectionName].filter((doc) => matchesQuery(doc, query));
      const set = new Set();
      docs.forEach((d) => {
        if (d[field] !== undefined) set.add(d[field]);
      });
      return Array.from(set);
    },
  };
}

export function isUsingMongoose(): boolean {
  return isMongooseConnected;
}
