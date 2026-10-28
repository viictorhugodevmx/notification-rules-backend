import express from 'express';
import cors from 'cors';

import { ruleRouter } from './routes/ruleRoutes.js';

import {
  handleRouteNotFound,
  handleApiError,
} from './middleware/errorHandlers.js';

export const app = express();

app.disable('x-powered-by');

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  })
);

app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_request, response) => {
  response.status(200).json({
    status: 'ok',
    service: 'notification-rules-api',
  });
});

app.use('/api/rules', ruleRouter);

app.use(handleRouteNotFound);

app.use(handleApiError);
