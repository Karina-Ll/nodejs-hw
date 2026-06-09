import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { errors } from 'celebrate';
import { connectMongoDB } from './db/connectMongoDB.js';
import { logger } from './middleware/logger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import notesRoutes from './routes/notesRoutes.js';

const PORT = process.env.PORT || 3000;

const app = express();

app.use(logger);
app.use(cors());
app.use(express.json());

app.use(notesRoutes);

app.use(errors());
app.use(notFoundHandler);
app.use(errorHandler);

connectMongoDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});