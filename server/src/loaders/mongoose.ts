import mongoose, { Connection } from 'mongoose';
import config from '@/config';

export default async (): Promise<Connection['db']> => {
  const connection = await mongoose.connect(config.mongoURL, {
    useNewUrlParser: true,
    // useCreateIndex: true,
    useUnifiedTopology: true,
  });
  return connection.connection.db;
};
