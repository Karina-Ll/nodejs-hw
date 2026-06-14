import bcrypt from 'bcrypt';
import createHttpError from 'http-errors';
import { User } from '../models/user.js';
import { Session } from '../models/session.js';
import { createSession, setSessionCookies } from '../services/auth.js';
import { catchAsync } from '../utils/catchAsync.js';

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