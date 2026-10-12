import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel, IUser } from '../models/User.ts';
import { authenticate, generateToken, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// Sanitize user object to never return password
export function sanitizeUser(user: any): Partial<IUser> {
  const u = user.toObject ? user.toObject() : { ...user };
  delete u.password;
  return u;
}

// POST /api/auth/login
router.post('/login', async (req, res): Promise<void> => {
  try {
    const { login, password } = req.body;
    if (!login || !password) {
      res.status(400).json({ error: 'Email/Username and password are required.' });
      return;
    }

    const cleanLogin = String(login).trim().toLowerCase();

    // Find by email or username
    let user = await UserModel.findOne({ email: cleanLogin });
    if (!user) {
      user = await UserModel.findOne({ username: cleanLogin });
    }

    if (!user || !user.password) {
      res.status(401).json({ error: 'Invalid credentials. Please verify your email/username and password.' });
      return;
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials. Please verify your email/username and password.' });
      return;
    }

    // Check if account is deactivated
    if (user.status === 'deactivated') {
      res.status(403).json({ error: 'This account has been deactivated by an administrator.' });
      return;
    }

    const token = generateToken(user);
    res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// POST /api/auth/register
// Public registration creates STUDENT accounts ONLY
router.post('/register', async (req, res): Promise<void> => {
  try {
    const {
      name,
      email,
      username,
      password,
      college,
      department,
      branch,
      year,
      rollNumber,
      skills,
      bio,
      avatarUrl,
    } = req.body;

    if (!name || !email || !password || !username) {
      res.status(400).json({ error: 'Name, email, username, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanUsername = String(username).trim().toLowerCase();

    // Check if email already taken
    const existingEmail = await UserModel.findOne({ email: cleanEmail });
    if (existingEmail) {
      res.status(400).json({ error: 'An account with this email address already exists.' });
      return;
    }

    // Check if username already taken
    const existingUsername = await UserModel.findOne({ username: cleanUsername });
    if (existingUsername) {
      res.status(400).json({ error: 'This username is already taken. Please choose another.' });
      return;
    }

    // Hash password securely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // CRITICAL: Role is strictly locked to 'student'. Never trust client-supplied role!
    const newUser = await UserModel.create({
      name: String(name).trim(),
      email: cleanEmail,
      username: cleanUsername,
      password: hashedPassword,
      role: 'student', // Enforce Student role
      status: 'active',
      approvalStatus: 'pending', // Requires admin approval
      college: college || 'National Institute of Technology',
      department: department || 'Computer Science & Engineering',
      branch: branch || 'B.Tech CSE',
      year: year || '3rd Year',
      rollNumber: rollNumber || '',
      skills: Array.isArray(skills) ? skills : (skills ? String(skills).split(',').map((s) => s.trim()) : []),
      bio: bio || '',
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
    });

    const token = generateToken(newUser);
    res.status(201).json({
      message: 'Student account created successfully. Your profile is pending Administrator approval.',
      token,
      user: sanitizeUser(newUser),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await UserModel.findById(String(req.user?._id || req.user?.id));
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    res.json({ user: sanitizeUser(user) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      return;
    }

    const userId = String(req.user?._id || req.user?.id);
    const user = await UserModel.findById(userId);
    if (!user || !user.password) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        res.status(400).json({ error: 'Current password does not match.' });
        return;
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.mustChangePassword = false;
    await user.save();

    res.json({ message: 'Password updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
