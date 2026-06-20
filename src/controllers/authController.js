import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import handlebars from 'handlebars';
import createHttpError from 'http-errors';
import { User } from '../models/user.js';
import { Session } from '../models/session.js';
import { createSession, setSessionCookies } from '../services/auth.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendEmail } from '../utils/sendMail.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const registerUser = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) throw createHttpError(400, 'Email in use');

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hashedPassword });

  const session = await createSession(user._id);
  setSessionCookies(res, session);

  res.status(201).json(user);
});

export const loginUser = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw createHttpError(401, 'Invalid credentials');

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw createHttpError(401, 'Invalid credentials');

  await Session.deleteOne({ userId: user._id });
  const session = await createSession(user._id);
  setSessionCookies(res, session);

  res.status(200).json(user);
});

export const refreshUserSession = catchAsync(async (req, res) => {
  const { sessionId, refreshToken } = req.cookies;

  const session = await Session.findOne({ _id: sessionId, refreshToken });
  if (!session) throw createHttpError(401, 'Session not found');

  if (new Date() > session.refreshTokenValidUntil) {
    await Session.deleteOne({ _id: sessionId });
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.clearCookie('sessionId');
    throw createHttpError(401, 'Session token expired');
  }

  await Session.deleteOne({ _id: sessionId });
  const newSession = await createSession(session.userId);
  setSessionCookies(res, newSession);

  res.status(200).json({ message: 'Session refreshed' });
});

export const logoutUser = catchAsync(async (req, res) => {
  const { sessionId } = req.cookies;

  if (sessionId) {
    await Session.deleteOne({ _id: sessionId });
  }

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.clearCookie('sessionId');

  res.status(204).send();
});

export const requestResetEmail = catchAsync(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(200).json({ message: 'Password reset email sent successfully' });
  }

  const token = jwt.sign(
    { sub: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '15m' },
  );

  const templatePath = path.join(__dirname, '../templates/reset-password-email.html');
  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  const template = handlebars.compile(templateSource);

  const resetLink = `${process.env.FRONTEND_DOMAIN}/reset-password?token=${token}`;
  const html = template({ username: user.username, resetLink });

  await sendEmail({
    to: user.email,
    subject: 'Reset your password',
    html,
  });

  res.status(200).json({ message: 'Password reset email sent successfully' });
});

export const resetPassword = catchAsync(async (req, res) => {
  const { token, password } = req.body;

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw createHttpError(401, 'Invalid or expired token');
  }

  const user = await User.findOne({ _id: payload.sub, email: payload.email });
  if (!user) throw createHttpError(404, 'User not found');

  const hashedPassword = await bcrypt.hash(password, 10);
  user.password = hashedPassword;
  await user.save();

  res.status(200).json({ message: 'Password reset successfully' });
});