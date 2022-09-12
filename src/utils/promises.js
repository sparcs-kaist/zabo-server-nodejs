import util from "util";
import jsonwebtoken from "jsonwebtoken";

// eslint-disable-next-line import/prefer-default-export
export const jwt = {
  sign: util.promisify(jsonwebtoken.sign),
  verify: util.promisify(jsonwebtoken.verify),
  decode: util.promisify(jsonwebtoken.decode),
};
