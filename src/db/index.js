import mongoose from 'mongoose';
import {
  adminUserSchema, userSchema, zaboSchema, boardSchema, pinSchema, likeSchema, groupSchema, statisticsSchema, feedbackSchema, followSchema,
} from './methods';
import { preRegisterSchema } from './schema';
import { logger } from '../utils/logger';

mongoose.connect ('mongodb://localhost/zabo-develop', {
  useNewUrlParser: true,
  autoIndex: process.env.NODE_ENV !== 'production',
  useFindAndModify: false,
  useCreateIndex: true,
  // sets how many times to try reconnecting (default: 30)
  // reconnectTries: Number.MAX_VALUE, // incompatible with the unified topology. http://bit.ly/2D8WfT6
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on ('error', console.error.bind (console, 'connection error:'));
db.once ('open', () => {
  const boldBlue = text => `\u001b[1m\u001b[34m${text}\u001b[39m\u001b[22m`;
  logger.info (`${boldBlue ('Mongo db successfully connected!!')}`);
});

export const AdminUser = mongoose.model ('AdminUser', adminUserSchema);
export const User = mongoose.model ('User', userSchema);
export const Zabo = mongoose.model ('Zabo', zaboSchema);
export const Board = mongoose.model ('Board', boardSchema);
export const Pin = mongoose.model ('Pin', pinSchema);
export const Like = mongoose.model ('Like', likeSchema);
export const Group = mongoose.model ('Group', groupSchema);
export const Follow = mongoose.model ('Follow', followSchema);
export const Statistic = mongoose.model ('Statistic', statisticsSchema);
export const Feedback = mongoose.model ('Feedback', feedbackSchema);
export const PreRegister = mongoose.model ('PreRegister', preRegisterSchema);
