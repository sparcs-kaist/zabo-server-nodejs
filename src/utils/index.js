import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { Group, User } from '../db';
import { RESERVED_ROUTES_USERNAME_EXCEPTIONS } from './variables';

export const parseJSON = (jsonString, fallback = {}) => {
  if (typeof jsonString === 'object') {
    return jsonString;
  }
  try {
    return JSON.parse (jsonString);
  } catch (error) {
    console.error (jsonString);
    console.error (error.message);
    return fallback;
  }
};

export const validateName = (name) => {
  // 1~25자 제한
  if (name.length === 0 || name.length > 25) return false;
  // 첫 글자로는 _, 알파벳, 한글, 숫자만 입력 가능
  // ._- 한글 알파벳 숫자 입력 가능
  const patt = new RegExp (/^[ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-9_][ ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-9._-]*$/);
  if (!patt.test (name)) return false;
  const doubleCharPatt = /(--)|(\.\.)|(__)/;
  if (doubleCharPatt.test (name)) return false;
  const match = RESERVED_ROUTES_USERNAME_EXCEPTIONS.find (exception => exception === name.toLowerCase ());
  return !match;
};

/**
 * Check if username available and if it's already taken
 * Last return value is usability.
 * @param name
 * @returns {Promise<*[User, Group, boolean]>}
 */
export const nameUsabilityCheck = async (name) => {
  const [user, group] = await Promise.all ([
    User.findOne ({ username: { $regex: new RegExp (`^${name}$`, 'i') } }),
    Group.findOne ({ name: { $regex: new RegExp (`^${name}$`, 'i') } }),
  ]);
  return [user, group, (!user && !group)];
};

export const isNameInvalidWithRes = async (name, req, res) => {
  const isValid = validateName (name);
  if (!isValid) {
    return res.status (400).json ({
      error: `'${name}' is not valid.`,
    });
  }
  const [, , usability] = await nameUsabilityCheck (name);
  if (!usability) {
    return res.status (400).json ({
      error: `'${name}' has already been taken.`,
    });
  }
  return false;
};

export const isValidId = mongoose.Types.ObjectId.isValid;

export const escapeRegExp = string => string.replace (/[.*+?^${}()|[\]\\]/g, '\\$&');

export const jwtSign = (user, jwtSecret) => jwt.sign ({
  _id: user._id,
  sid: user.sso_sid,
  email: user.email,
  username: user.username,
}, jwtSecret, {
  expiresIn: '60d',
  issuer: 'zabo-sparcs-kaist',
});
