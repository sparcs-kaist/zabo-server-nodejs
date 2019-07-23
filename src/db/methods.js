import { boardSchema, userSchema, zaboSchema, pinSchema, groupSchema } from "./schema"

userSchema.virtual('name')
	.get(function () {
		return `${this.lastName} ${this.firstName}`
	})
	.set(function (v) {
		this.lastName = v.substr(0, v.indexOf(' '))
		this.firstName = v.substr(v.indexOf(' ') + 1)
	})

userSchema.statics.findByName = function (name, cb) {
	return this.find({ name: new RegExp(name, 'i') }, cb)
}

userSchema.query.byName = function (name) {
	return this.where({ name: new RegExp(name, 'i') })
}

userSchema.post('save', function (doc, next) {
	//console.log("post save user")
	next()
})

zaboSchema.index({
	title: "text",
})

groupSchema.index({
	name: "text",
	description: "text",
})

// Bad, don't do this!
//schema.path('arr').get(v => {
//	return v.map(el => Object.assign(el, { url: root + el.url }))
//})

export { userSchema, zaboSchema, boardSchema, pinSchema, groupSchema }
