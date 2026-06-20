import createHttpError from 'http-errors';

export const validateBody = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body);
  if (error) {
    return next(createHttpError(400, error.message));
  }
  req.body = value;
  next();
};