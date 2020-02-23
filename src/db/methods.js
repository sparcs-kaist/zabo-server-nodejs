import {
  adminUserSchema, boardSchema, userSchema, zaboSchema, deletedZaboSchema, groupSchema, statisticsSchema, feedbackSchema,
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
      followingsCount: this.followings ? this.followings.length : undefined,
      followersCount: this.followers ? this.followers.length : undefined,
    };
  });

userSchema.statics.findByName = function (name, cb) {
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
  searchPartial (query, tags, lastSeen) {
    let category = tags;
    if (!Array.isArray (tags)) { category = [tags]; }
    let queryOptions = {
      $or:
        [ // TOOD: Sort search query result
          {
            title: new RegExp (query, 'gi'),
            category: { $all: category },
          },
          {
            description: new RegExp (query, 'gi'),
            category: { $all: category },
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
    if (!query) {
      delete queryOptions.$or[0].title;
      delete queryOptions.$or[1].description;
    }
    if (!tags) {
      delete queryOptions.$or[0].category;
      delete queryOptions.$or[1].category;
    }
    return this.find (queryOptions);
  },

  searchFull (query, tags, lastSeen) {
    let category = tags;
    if (!Array.isArray (tags)) { category = [tags]; }

    let queryOptions = {
      $text: { $search: query, $caseSensitive: false },
      category: { $all: category },
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
    if (!query) {
      delete queryOptions.$text;
    }
    if (!tags) {
      delete queryOptions.category;
    }
    return this.find (queryOptions, {
      score: { $meta: 'textScore' },
    }).sort ({ score: { $meta: 'textScore' } });
    // limit (20)
  },
  // Currently : tags(category) are searched by 'or'
};

groupSchema.statics = {
  searchPartial (q) {
    if (!q) { return []; }
    return this.find ({
      $or:
      [
        { name: new RegExp (q, 'gi') },
        { description: new RegExp (q, 'gi') },
      ],
    }).limit (20);
  },

  searchFull (q) {
    if (!q) { return []; }
    return this.find ({
      $text: { $search: q, $caseSensitive: false },
    }, {
      score: { $meta: 'textScore' },
    }).sort ({ score: { $meta: 'textScore' } }).limit (20);
  },
};


// Bad, don't do this!
// schema.path('arr').get(v => {
// return v.map(el => Object.assign(el, { url: root + el.url }))
// })

export {
  adminUserSchema, userSchema, zaboSchema, deletedZaboSchema, boardSchema, groupSchema, statisticsSchema, feedbackSchema,
};
