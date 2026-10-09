import { app } from './app.js';
import { env } from './config/env.js';
import { createServer } from 'node:http';
import { attachSocketServer } from './socket/index.js';

const server = createServer(app);
attachSocketServer(server);

server.listen(env.PORT, () => {
  console.log(`Server listening on port ${env.PORT}`);
});
