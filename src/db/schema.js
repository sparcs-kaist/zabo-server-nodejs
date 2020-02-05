import mongoose from 'mongoose';
import { TAGS, EVENTS } from '../utils/variables';

export const likeSchema = new mongoose.Schema ({
  likedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  zabo: {
    type: mongoose.Schema.ObjectId,
    ref: 'Zabo',
  },
}, {
  id: false,
});

export const zaboSchema = new mongoose.Schema ({
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'Group',
  },
  photos: [{
    url: String,
    width: Number,
    height: Number,
    // Caution : Pay attention when you add getter into array
  }],
  meta: {
    w: { type: Number, alias: 'meta.mainImageWidth' },
    h: { type: Number, alias: 'meta.mainImageHeight' },
  },
  title: {
    type: String,
    required: [true, 'New Post Must Have Title'],
    maxLength: 100,
  },
  description: {
    type: String,
    required: true,
  },
  category: [{
    type: String,
    // enum: TAGS, // ["recruit", "seminar", "contest", "event", "show", "fair"]
  }], // [리크루팅, 세미나, 대회, 공연, 행사, 설명회]
  views: Number,
  endAt: {
    type: Date,
    required: true,
  },
  pins: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Pin',
  }], // Pin
  likes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Like',
  }], // Like
  __v: { type: Number, select: false },
}, {
  timestamps: true,
  autoIndex: true,
  toJSON: { virtuals: true },
  id: false,
});

export const userSchema = new mongoose.Schema ({
  sso_uid: { type: String, unique: true },
  sso_sid: {
    type: String, required: true, unique: true, index: true,
  },
  email: {
    type: String,
    unique: true,
    required () {
      return !!this.sso_uid;
    },
    match: /^[^@\s]+@[^@\s]+\.[^@\s]+$/s,
  },
  username: {
    type: String,
    // username and group name are globaly unique though it's not represented in schema constraint
    unique: true,
    required: true,
    index: true,
  },
  description: String,
  profilePhoto: String,
  backgroundPhoto: String,
  isAdmin: { // Only for usage in front.
    type: Boolean,
    default: false,
  },
  /* From SSO */
  gender: String,
  birthday: Date,
  flags: [String],
  firstName: String,
  lastName: String,
  koreanName: String,
  kaistId: String,
  sparcsId: { type: String, sparse: true },
  facebookId: String,
  tweeterId: String,
  studentId: String,
  kaistEmail: String,
  kaistPersonType: String,
  kaistInfoTime: String,
  kaistStatus: String,
  /* From SSO */
  boards: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Board',
  }], // Only one can be created for current plan, array for probable extensions
  likes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Like',
  }], // Like
  groups: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Group',
  }],
  currentGroup: {
    type: mongoose.Schema.ObjectId,
    ref: 'Group',
  }, // Currently selected group. not an uploader if null
  type: {
    type: String,
    enum: [],
  },
  followings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Follow',
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Follow',
  }],
  __v: { type: Number, select: false },
}, {
  timestamps: true,
  autoIndex: true,
  toJSON: { virtuals: true },
  id: false,
});

export const boardSchema = new mongoose.Schema ({
  title: {
    type: String,
    required: true,
    default: '저장한 포스터',
  },
  /* For further usage */
  description: String,
  category: String,
  isPrivate: Boolean,
  pins: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Pin',
  }],
  __v: { type: Number, select: false },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  id: false,
});

export const pinSchema = new mongoose.Schema ({
  /*
User can pin unlimited zabos and zabos can be pinned by hundreds or thousands
of users. Therefore, it's hard to manage user pin zabo in user collection or
zabo pinned by user in zabo collection. Even this model incurs extra db
operations it's the only way to make it scalable. */
  pinnedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  }, // _id of user
  zabo: {
    type: mongoose.Schema.ObjectId,
    ref: 'Zabo',
  },
  board: {
    type: mongoose.Schema.ObjectId,
    ref: 'Board',
  },
  __v: { type: Number, select: false },
}, {
  timestamps: true,
  id: false,
});

const revisionHistorySchema = new mongoose.Schema ({
  prev: String,
  next: String,
}, {
  timestamps: true,
});

export const groupSchema = new mongoose.Schema ({
  name: {
    type: String,
    required: true,
    // username and group name are globally unique though it's not represented in schema constraint
    unique: true,
    index: true,
  },
  isPreRegistered: Boolean,
  revisionHistory: [revisionHistorySchema],
  subtitle: String,
  description: String,
  profilePhoto: String,
  backgroundPhoto: String,
  recentUpload: Date,
  members: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    role: {
      type: String,
      enum: ['admin', 'editor'],
    },
  }], // sso_sid of users
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Follow',
    default: [],
  }],
  __v: { type: Number, select: false },
}, {
  timestamps: true,
  autoIndex: true,
  id: false,
});

export const followSchema = new mongoose.Schema ({
  followee: {
    required: true,
    type: mongoose.Schema.ObjectId,
    refPath: 'onModel',
  },
  follower: {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  onModel: {
    type: String,
    required: true,
    enum: ['User', 'Group'],
  },
  __v: { type: Number, select: false },
}, {
  id: false,
});

export const statisticsSchema = new mongoose.Schema ({
  type: {
    type: String,
    required: true,
    enum: EVENTS,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  data: {
    type: Map,
  },
  __v: { type: Number, select: false },
}, {
  timestamps: true,
  id: false,
});

export const feedbackSchema = new mongoose.Schema ({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  feedback: {
    type: String,
  },
  __v: { type: Number, select: false },
}, {
  timestamps: true,
  id: false,
});

const actionHistory = new mongoose.Schema ({
  name: {
    type: String,
    required: true,
  },
  target: String,
  info: Map,
  __v: { type: Number, select: false },
}, {
  timestamps: true,
  id: false,
});

export const adminUserSchema = new mongoose.Schema ({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  actionHistory: [actionHistory],
  __v: { type: Number, select: false },
}, {
  timestamps: true,
  id: false,
});

export const preRegisterSchema = new mongoose.Schema ({
  group: {
    required: true,
    type: mongoose.Schema.ObjectId,
    ref: 'Group',
  },
  groupName: {
    type: String,
    required: true,
    unique: true,
  },
  owner: String,
  ownerSID: String,
  registered: {
    type: Boolean,
    default: false,
  },
});
