import mongoose from "mongoose"

mongoose.connect('mongodb://localhost/test', {
	useNewUrlParser: true,
	autoIndex: process.env.NODE_ENV !== "production"
})

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {
	// we're connected!
	console.log("connected")
})

const kittySchema = new mongoose.Schema({
	name: String,
})

// NOTE: methods must be added to the schema before compiling it with mongoose.model()
kittySchema.methods.speak = function () {
	var greeting = this.name
		? "Meow name is " + this.name
		: "I don't have a name"
	console.log(greeting)
}

const Kitten = mongoose.model('Kitten', kittySchema)

const silence = new Kitten({ name: 'Silence' })

console.log(silence.name) // 'Silence'

silence.speak()

silence.save(function (err, fluffy) {
	if (err) return console.error(err)
	fluffy.speak()
})


Kitten.find(function (err, kittens) {
	if (err) return console.error(err);
	console.log(kittens);
})
