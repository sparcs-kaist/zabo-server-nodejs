import mongoose from "mongoose"

export const userSchema = new mongoose.Schema({
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
	studentId: String,
	kaistEmail: String,
	kaistPersonType: String,
	kaistInfoTime: String,
	/* From SSO */
	boards: [mongoose.Schema.ObjectId], // Only one can be created for current plan, array for probable extensions
	type: {
		type: String,
		enum: []
	}
}, {
	timestamps: true,
})

export const zaboSchema = new mongoose.Schema({
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
	category: {
		type: String,
		enum: ["recruit", "seminar", "contest", "event", "show", "fair"]
	}, // [리크루팅, 세미나, 대회, 공연, 행사, 설명회]
	pinnedBy: [mongoose.Schema.ObjectId],
	endAt: Date,
}, {
	timestamps: true,
})


export const boardSchema = new mongoose.Schema({
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
	pins: [mongoose.Schema.ObjectId],
}, {
	timestamps: true,
})
