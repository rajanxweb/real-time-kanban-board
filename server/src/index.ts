import 'dotenv/config';
import express from 'express';

const app = express();
const port = Number(process.env.PORT) || 5000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
