import mongoose from 'mongoose';
import {
  EVENTS, ZABO_CATEGORIES, GROUP_CATEGORIES, GROUP_CATEGORIES_2,
} from '../utils/variables';

const zaboLikeSchema = mongoose.Schema ({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
  id: false,
});

const zaboSchemaObject = {
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
    // enum: ZABO_CATEGORIES,
  }],
  views: Number,
  effectiveViews: Number,
  schedules: [{
    title: String,
    startAt: {
      type: Date,
      required: true,
    },
    endAt: Date,
    eventType: String, // '행사' or '신청'
  }],
  pins: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Board',
  }], // Pin
  likes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  }],
  likesWithTime: [zaboLikeSchema],
  score: {
    type: Number,
    default: 0,
  },
  scoreMeta: {
    lastLikeCount: {
      type: Number,
      default: 0,
    },
    lastLikeTimeMA: {
      type: Date,
      default: () => new Date (+new Date () - 3 * 24 * 60 * 60 * 1000),
    },
    lastCountedViewDate: {
      type: Date,
      default: Date.now,
    },
    lastViewTimeMA: {
      type: Date,
      default: () => new Date (+new Date () - 3 * 24 * 60 * 60 * 1000),
    },
  },
  __v: { type: Number, select: false },
};
export const zaboSchema = new mongoose.Schema (zaboSchemaObject, {
  timestamps: true,
  autoIndex: true,
  toJSON: { virtuals: true },
  id: false,
});

export const deletedZaboSchema = new mongoose.Schema ({
  ...zaboSchemaObject,
  createdAt: Date,
  updatedAt: Date,
}, {
  toJSON: { virtuals: true },
  id: false,
});

export const metaSchema = new mongoose.Schema ({
  type: {
    type: String,
    unique: true,
  },
  value: {
    type: Object,
    required: true,
  },
}, {
  timestamps: true,
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
  followings: [
    new mongoose.Schema ({
      followee: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'onModel',
      },
      onModel: {
        type: String,
        required: true,
        enum: ['User', 'Group'],
      },
    }),
  ],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  recommends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zabo',
  }],
  interests: Object,
  interestMeta: {
    lastCountedDate: {
      type: Date,
      default: Date.now,
    },
  },
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
    ref: 'Zabo',
  }],
  __v: { type: Number, select: false },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  id: false,
});

const revisionHistorySchema = new mongoose.Schema ({
  prev: String,
  next: String,
}, {
  timestamps: { createdAt: true, updatedAt: false },
  id: false,
});

const groupSchemaObject = {
  name: {
    type: String,
    required: true,
    // username and group name are globally unique though it's not represented in schema constraint
    unique: true,
    index: true,
  },
  subtitle: String,
  description: String,
  profilePhoto: String,
  backgroundPhoto: String,
  category: [{
    type: String,
    // enum: [...GROUP_CATEGORIES, ... GROUP_CATEGORIES_2],
  }],
  members: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    role: {
      type: String,
      enum: ['admin', 'editor'],
    },
  }],
  purpose: String,
  isBusiness: {
    type: Boolean,
    default: false,
  },
  __v: { type: Number, select: false },
};

export const groupApplySchema = new mongoose.Schema ({
  ...groupSchemaObject,
}, {
  timestamps: true,
  id: false,
});

export const groupSchema = new mongoose.Schema ({
  ...groupSchemaObject,
  isPreRegistered: Boolean,
  level: {
    type: Number,
    default: 0,
  },
  revisionHistory: [revisionHistorySchema],
  recentUpload: Date,
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  score: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
  autoIndex: true,
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
  zabo: {
    type: mongoose.Schema.ObjectId,
    ref: 'Zabo',
  },
  query: String,
  category: [],
  __v: { type: Number, select: false },
}, {
  timestamps: { createdAt: true, updatedAt: false },
  id: false,
});

const actionHistory = new mongoose.Schema ({
  name: {
    type: String,
    required: true,
  },
  target: String,
  info: Object,
  __v: { type: Number, select: false },
}, {
  timestamps: { createdAt: true, updatedAt: false },
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
