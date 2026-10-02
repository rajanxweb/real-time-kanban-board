import express from 'express';
import { env } from './config/env.js';

const app = express();

app.listen(env.PORT, () => {
  console.log(`Server listening on port ${env.PORT}`);
});
