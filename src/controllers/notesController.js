import createHttpError from 'http-errors';
import { Note } from '../models/note.js';
import { catchAsync } from '../utils/catchAsync.js';

export const getAllNotes = catchAsync(async (req, res) => {
  const { page = 1, perPage = 10, tag, search } = req.query;
  const userId = req.user._id;

  const query = Note.find({ userId });

  if (tag) query.where({ tag });

  if (search) {
    query.where({
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ],
    });
  }

  const [totalNotes, notes] = await Promise.all([
    Note.countDocuments(query.getFilter()),
    query.clone().skip((page - 1) * perPage).limit(Number(perPage)),
  ]);

  const totalPages = Math.ceil(totalNotes / perPage);

  res.status(200).json({
    page: Number(page),
    perPage: Number(perPage),
    totalNotes,
    totalPages,
    notes,
  });
});

export const getNoteById = catchAsync(async (req, res) => {
  const { noteId } = req.params;
  const userId = req.user._id;
  const note = await Note.findOne({ _id: noteId, userId });
  if (!note) throw createHttpError(404, 'Note not found');
  res.status(200).json(note);
});

export const createNote = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const note = await Note.create({ ...req.body, userId });
  res.status(201).json(note);
});

export const updateNote = catchAsync(async (req, res) => {
  const { noteId } = req.params;
  const userId = req.user._id;
  const note = await Note.findOneAndUpdate(
    { _id: noteId, userId },
    req.body,
    { returnDocument: 'after' },
  );
  if (!note) throw createHttpError(404, 'Note not found');
  res.status(200).json(note);
});

export const deleteNote = catchAsync(async (req, res) => {
  const { noteId } = req.params;
  const userId = req.user._id;
  const note = await Note.findOneAndDelete({ _id: noteId, userId });
  if (!note) throw createHttpError(404, 'Note not found');
  res.status(200).json(note);
});