import { board, user, zabo } from "./schema"

user.virtual('name')
	.get(function () {
		return `${this.lastName} ${this.firstName}`
	})
	.set(function (v) {
		this.lastName = v.substr(0, v.indexOf(' '))
		this.firstName = v.substr(v.indexOf(' ') + 1)
	})

user.statics.findByName = function (name, cb) {
	return this.find({ name: new RegExp(name, 'i') }, cb)
}

user.query.byName = function (name) {
	return this.where({ name: new RegExp(name, 'i') })
}


// Bad, don't do this!
//schema.path('arr').get(v => {
//	return v.map(el => Object.assign(el, { url: root + el.url }))
//})

export { user, zabo, board }
