import mongoose from 'mongoose';
import { Like } from '../db';
import { logger } from '../utils/logger';
import { isValidId } from '../utils';

export const getLikeNum = async (req, res) => {
  const { name } = req.params;
  // const [user, group]
};
