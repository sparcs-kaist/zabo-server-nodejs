import util from "util"
import jsonwebtoken from "jsonwebtoken"

export const jwt = {
	sign: util.promisify(jsonwebtoken.sign),
	verify: util.promisify(jsonwebtoken.verify),
	decode: util.promisify(jsonwebtoken.decode),
}
