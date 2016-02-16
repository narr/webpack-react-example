import loggerMaker from './utils/logger';
import { PORT, REDIS_URL } from './config';
import express from 'express';
import morgan from 'morgan';
import compression from 'compression';
import session from 'express-session';
import connectRedis from 'connect-redis';
import redis from 'redis';
import bodyParser from 'body-parser';
import routers from './routes';
import path from 'path';
import http from 'http';

import ejs from 'ejs';

const logger = loggerMaker(module);
const app = express();
const RedisStore = connectRedis(session);
const redisClient = redis.createClient(REDIS_URL);

app.use(morgan('combined', {
  stream: logger.stream
}));
app.use(compression());
app.use(session({
  store: new RedisStore({
    client: redisClient
  }),
  secret: 'webpack-react',
  resave: false,
  saveUninitialized: false
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

// @ react dom rendering
app.set('view engine', 'html');
app.engine('html', ejs.renderFile);
app.use(routers.domRenderer);
// react dom rendering @
app.get(/^\/*$/, (req, res) => { // handle 'root-url//, root-url///, root-url//// and so on'
  res.sendFile(path.join(__dirname, './views/404.html'));
});
app.use(express.static(path.join(__dirname, '../static')));

app.use('/api', routers.api);
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, './views/404.html'));
});

const server = http.createServer(app);

server
  .listen(PORT, () => {
    logger.info(`==> 🌎  Listening on port ${PORT}.` +
      ` Open up http:\/\/localhost:${PORT} in your browser.`);
  })
  .on('error', err => {
    if (err.code === 'EADDRINUSE') {
      logger.error('The port is already in use..!!');
    }
  });