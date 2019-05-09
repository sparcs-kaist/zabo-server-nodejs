import mongoose from "mongoose"

export const user = new mongoose.Schema({
	sso_uid: { type: String, required: true, unique: true },
	sso_sid: String,
	email: {
		type: String,
		unique: true,
		required: function () {
			return !!this.sso_uid
		},
		match: /^[^@\s]+@[^@\s]+\.[^@\s]+$/s
	},
	/* From SSO */
	gender: String,
	birthday: Date,
	flags: [String],
	firstName: String,
	lastName: String,
	kaistId: String,
	sparcsId: { type: String, sparse: true },
	facebookId: String,
	tweeterId: String,
	/* From SSO */
	boards: [ObjectId], // Only one can be created for current plan, array for probable extensions
}, {
	timestamps: true,
})

export const zabo = new mongoose.Schema({
	photos: [{
		url: String,
		width: Number,
		height: Number
		// Caution : Pay attention when you add getter into array
	}],
	meta: {
		w: { type: Number, alias: "meta.mainImageWidth" },
		h: { type: Number, alias: "meta.mainImageHeight" },
	},
	title: {
		type: String,
		required: [true, "New Post Must Have Title"],
		minLength: 10,
		maxLength: 100,
	},
	description: {
		type: String,
		required: true,
	},
	events: [{
		name: String,
		eventStartAt: Date,
		eventEndAt: Date,
	}],
	registrationType: String,
	category: {
		type: String,
		enum: ["recruit", "event", "show"]
	}, // [리크루팅, 공연, 행사]
	pinnedBy: [ObjectId],

}, {
	timestamps: true,
})


export const board = new mongoose.Schema({
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
	pins: [ObjectId],
}, {
	timestamps: true,
})
