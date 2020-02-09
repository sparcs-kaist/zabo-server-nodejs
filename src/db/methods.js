import {
  adminUserSchema, boardSchema, userSchema, zaboSchema, pinSchema, likeSchema, groupSchema, statisticsSchema, feedbackSchema, followSchema,
} from './schema';

userSchema.virtual ('name')
  .get (function () {
    if (this.firstName && this.lastName) return `${this.firstName} ${this.lastName}`;
    return undefined;
  })
  .set (function (v) {
    this.lastName = v.substr (0, v.indexOf (' '));
    this.firstName = v.substr (v.indexOf (' ') + 1);
  });

userSchema.virtual ('stats')
  .get (function () {
    return {
      likesCount: this.likes ? this.likes.length : undefined,
      followingsCount: this.followings ? this.followings.length : undefined,
      followersCount: this.followers ? this.followers.length : undefined,
    };
  });

userSchema.statics.findByName = function (name, cb) {
  console.log (name);
  return this.find ().or ([
    { username: new RegExp (name, 'gi') },
    { koreanName: new RegExp (name, 'gi') },
    { firstName: new RegExp (name, 'gi') },
    { lastName: new RegExp (name, 'gi') },
  ], cb);
};

userSchema.query.byName = function (name) {
  return this.where ({ name: new RegExp (name, 'i') });
};

userSchema.post ('save', (doc, next) => {
  // console.log("post save user")
  next ();
});

groupSchema.virtual ('followersCount')
  .get (function () {
    return this.followers.length;
  });

boardSchema.virtual ('pinsCount')
  .get (function () {
    return this.pins ? this.pins.length : undefined;
  });

zaboSchema.virtual ('likesCount')
  .get (function () {
    return this.likes ? this.likes.length : undefined;
  });

zaboSchema.virtual ('pinsCount')
  .get (function () {
    return this.pins ? this.pins.length : undefined;
  });

zaboSchema.index ({
  title: 'text',
  description: 'text',
}, {
  weights: {
    name: 3,
    description: 1,
  },
});

groupSchema.index ({
  name: 'text',
  description: 'text',
}, {
  weights: {
    name: 3,
    description: 1,
  },
});

zaboSchema.statics = {
  async searchPartial (query, tags, lastSeen) {
    let queryOptions = {
      $or:
        [ // TOOD: Sort search query result
          {
            title: new RegExp (query, 'gi'),
            category: { $in: tags },
          },
          {
            description: new RegExp (query, 'gi'),
            category: { $in: tags },
          },
        ],
    };
    if (lastSeen) {
      queryOptions = {
        ...queryOptions,
        _id: {
          ...queryOptions._id,
          $lt: lastSeen,
        },
      };
    }

    if (tags.length === 0) {
      delete queryOptions.$or[0].category;
      delete queryOptions.$or[1].category;
    }
    return this.find (queryOptions).limit (20);
  },

  async searchFull (query, tags, lastSeen) {
    let queryOptions = {
      $text: { $search: query, $caseSensitive: false },
      category: { $in: tags },
    };
    if (lastSeen) {
      queryOptions = {
        ...queryOptions,
        _id: {
          ...queryOptions._id,
          $lt: lastSeen,
        },
      };
    }

    if (tags.length === 0) {
      delete queryOptions.category;
    }
    return this.find (queryOptions, {
      score: { $meta: 'textScore' },
    }).sort ({ score: { $meta: 'textScore' } }).limit (20);
  },

  async search (query, tags, lastSeen) {
    // Currently : tags are searched by 'or'
    const result = await this.searchFull (query, tags, lastSeen);
    if (result.length < 10) {
      return this.searchPartial (query, tags, lastSeen);
    }
    return result;
  },
};

groupSchema.statics = {
  async searchPartial (q) {
    return this.find ({
      $or:
      [
        { name: new RegExp (q, 'gi') },
        { description: new RegExp (q, 'gi') },
      ],
    }).limit (20);
  },

  async searchFull (q) {
    return this.find ({
      $text: { $search: q, $caseSensitive: false },
    }, {
      score: { $meta: 'textScore' },
    }).sort ({ score: { $meta: 'textScore' } }).limit (20);
  },

  async search (q) {
    const result = await this.searchFull (q, (err, data) => {
      if (!err && data.length) {
        return this.callback (err, data);
      }
    });
    if (result.length < 10) {
      return this.searchPartial (q);
    }
    return result;
  },
};


// Bad, don't do this!
// schema.path('arr').get(v => {
// return v.map(el => Object.assign(el, { url: root + el.url }))
// })

export {
  adminUserSchema, userSchema, zaboSchema, boardSchema, pinSchema, likeSchema, groupSchema, statisticsSchema, feedbackSchema, followSchema,
};
