import mongoose from "mongoose"
import { userSchema, zaboSchema, boardSchema, pinSchema, groupSchema, statisticsSchema, feedbackSchema } from "./methods"
import { logger } from "../utils/logger"

mongoose.connect('mongodb://localhost/zabo-develop', {
	useNewUrlParser: true,
	autoIndex: process.env.NODE_ENV !== "production",
	useFindAndModify: false,
	useCreateIndex: true,
})

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {
	const boldBlue = text => `\u001b[1m\u001b[34m${text}\u001b[39m\u001b[22m`
	logger.info(`${boldBlue(`Mongo db successfully connected!!`)}`)
})

export const User = mongoose.model("User", userSchema)
export const Zabo = mongoose.model("Zabo", zaboSchema)
export const Board = mongoose.model("Board", boardSchema)
export const Pin = mongoose.model("Pin", pinSchema)
export const Group = mongoose.model("Group", groupSchema)
export const Statistic = mongoose.model("Statistic", statisticsSchema)
export const Feedback = mongoose.model("Feedback", feedbackSchema)

//const kittySchema = new mongoose.Schema({
//	name: String,
//})
//
//// NOTE: methods must be added to the schema before compiling it with mongoose.model()
//kittySchema.methods.speak = function () {
//	var greeting = this.name
//		? "Meow name is " + this.name
//		: "I don't have a name"
//	console.log(greeting)
//}
//
//const Kitten = mongoose.model('Kitten', kittySchema)
//
//const silence = new Kitten({ name: 'Silence' })
//
//console.log(silence.name) // 'Silence'
//
//silence.speak()
//
//silence.save(function (err, fluffy) {
//	if (err) return console.error(err)
//	fluffy.speak()
//})
//
//
//Kitten.find(function (err, kittens) {
//	if (err) return console.error(err);
//	console.log(kittens);
//})
