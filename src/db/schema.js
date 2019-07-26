import mongoose from "mongoose"
import { CATEGORIES, EVENTS } from "../utils/variables"

export const userSchema = new mongoose.Schema({
	sso_uid: { type: String, unique: true },
	sso_sid: { type: String, required: true, unique: true },
	email: {
		type: String,
		unique: true,
		required: function () {
			return !!this.sso_uid
		},
		match: /^[^@\s]+@[^@\s]+\.[^@\s]+$/s
	},
	profilePhoto: String,
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
	boards: [{
		type: mongoose.Schema.ObjectId,
		ref: "Board"
	}], // Only one can be created for current plan, array for probable extensions
	groups: [{
		type: mongoose.Schema.ObjectId,
		ref: "Group"
	}],
	currentGroup: {
		type: mongoose.Schema.ObjectId,
		ref: "Group"
	}, // Currently selected group. not an uploader if null
	type: {
		type: String,
		enum: []
	}
}, {
	timestamps: true,
})

export const zaboSchema = new mongoose.Schema({
	createdBy: {
		type: mongoose.Schema.ObjectId,
		ref: "User",
	},
	owner: {
		type: mongoose.Schema.ObjectId,
		ref: "Group",
	},
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
		maxLength: 100,
	},
	description: {
		type: String,
		required: true,
	},
	category: [{
		type: String,
		enum: CATEGORIES, // ["recruit", "seminar", "contest", "event", "show", "fair"]
	}], // [리크루팅, 세미나, 대회, 공연, 행사, 설명회]
	pins: [{
		type: mongoose.Schema.ObjectId,
		ref: "Pin"
	}], // Pin
	endAt: {
		type: Date,
		required: true,
	},
}, {
	timestamps: true,
	autoIndex: false,
})


export const boardSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true,
		default: "저장한 포스터"
	},
	/* For further usage */
	description: String,
	category: String,
	isPrivate: Boolean,
}, {
	timestamps: true,
})

export const pinSchema = new mongoose.Schema({
	/*
		User can pin unlimited zabos and zabos can be pinned by hundreds or thousands
		of users. Therefore, it's hard to manage user pin zabo in user collection or
		zabo pinned by user in zabo collection. Even this model incurs extra db
		operations it's the only way to make it scalable.
	 */
	pinnedBy: {
		type: mongoose.Schema.ObjectId,
		ref: "User",
	}, // _id of user
	zaboId: {
		type: mongoose.Schema.ObjectId,
		ref: "Zabo"
	},
	boardId: {
		type: mongoose.Schema.ObjectId,
		ref: "Board"
	},
}, {
	timestamp: true,
})

export const groupSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		unique: true
	},
	description: String,
	profilePhoto: String,
	members: [{
		studentId: { // TODO: Unique per doc
			type: String,
			required: true
		},
		isAdmin: Boolean
	}], // sso_sid of users
}, {
	timestamp: true,
	autoIndex: false,
})

export const statisticsSchema = new mongoose.Schema({
	type: {
		type: String,
		required: true,
		enum: EVENTS,
	},
	data: {
		type: Map,
	}
}, {
	timestamp: true
})
