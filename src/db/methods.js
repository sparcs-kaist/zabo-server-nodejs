import {
  adminUserSchema, boardSchema, userSchema, zaboSchema, pinSchema, likeSchema, groupSchema, statisticsSchema, feedbackSchema, followSchema,
} from './schema';

userSchema.virtual ('name')
  .get (function () {
    return `${this.lastName} ${this.firstName}`;
  })
  .set (function (v) {
    this.lastName = v.substr (0, v.indexOf (' '));
    this.firstName = v.substr (v.indexOf (' ') + 1);
  });

userSchema.virtual ('stats')
  .get (function () {
    return {
      likesCount: this.likes.length,
      followingsCount: this.followings.length,
      followersCount: this.followers.length,
    };
  });

userSchema.statics.findByName = function (name, cb) {
  return this.find ({ name: new RegExp (name, 'i') }, cb);
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
    return this.pins.length;
  });

zaboSchema.virtual ('likesCount')
  .get (function () {
    return this.likes.length;
  });

zaboSchema.virtual ('pinsCount')
  .get (function () {
    return this.pins.length;
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
  async searchPartial (query, tags) {
    if (tags.length === 0) {
      return this.find ({
        $or:
        [
          { title: new RegExp (query, 'gi') },
          { description: new RegExp (query, 'gi') },
        ],
      }).limit (20);
    }
    return this.find ({
      $or:
      [
        {
          title: new RegExp (query, 'gi'),
          category: { $in: tags },
        },
        {
          description: new RegExp (query, 'gi'),
          category: { $in: tags },
        },
      ],
    }).limit (20);
  },

  async searchFull (query, tags) {
    if (tags.length === 0) {
      return this.find ({
        $text: { $search: '아주', $caseSensitive: false },
      }, {
        score: { $meta: 'textScore' },
      }).sort ({ score: { $meta: 'textScore' } }).limit (20);
    }
    return this.find ({
      $text: { $search: '아주', $caseSensitive: false },
      category: { $in: tags },
    }, {
      score: { $meta: 'textScore' },
    }).sort ({ score: { $meta: 'textScore' } }).limit (20);
  },

  async search (q, tags) {
    // Currently : tags are searched by 'or'
    const result = await this.searchFull (q, tags, (err, data) => {
      if (!err && data.length) {
        return this.callback (err, data);
      }
    });
    if (result.length < 10) {
      return this.searchPartial (q, tags);
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
