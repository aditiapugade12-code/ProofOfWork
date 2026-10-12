import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel, IUser } from '../models/User.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'proofofwork_development_jwt_secret_key_change_in_production';

export interface AuthRequest extends Request {
  user?: IUser;
}

export function generateToken(user: IUser): string {
  const userId = String(user._id || user.id);
  return jwt.sign(
    {
      id: userId,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    // Check authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({ error: 'Authentication required. Please log in.' });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
      return;
    }

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      res.status(401).json({ error: 'User no longer exists.' });
      return;
    }

    if (user.status === 'deactivated') {
      res.status(403).json({ error: 'Your account has been deactivated by an administrator.' });
      return;
    }

    req.user = (user.toObject ? user.toObject() : user) as IUser;
    next();
  } catch (error: any) {
    res.status(500).json({ error: 'Internal authentication error: ' + error.message });
  }
}

export function requireRole(...roles: Array<'admin' | 'student' | 'evaluator'>) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: Access restricted to ${roles.join(' or ')} role(s). Your role is ${req.user.role}.`,
      });
      return;
    }

    next();
  };
}

export function requireApprovedStudent(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  if (req.user.role === 'student') {
    if (req.user.approvalStatus !== 'approved') {
      res.status(403).json({
        error:
          req.user.approvalStatus === 'rejected'
            ? `Your student profile has been rejected: ${req.user.rejectionReason || 'Please update your details.'}`
            : 'Your student profile is currently pending Administrator approval.',
      });
      return;
    }
  }

  next();
}
