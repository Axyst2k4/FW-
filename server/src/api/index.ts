import { Router } from 'express';
import agendash from './routes/agendash';
import node from './routes/node';
import data from './routes/data';
import calibration from './routes/calibration';
import system from './routes/system';

// guaranteed to get dependencies
export default () => {
  const app = Router();
  data(app);
  node(app);
  agendash(app);
  calibration(app);
  system(app);
  return app;
};
