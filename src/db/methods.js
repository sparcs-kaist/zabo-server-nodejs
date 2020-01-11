import {
  boardSchema, userSchema, zaboSchema, pinSchema, groupSchema, statisticsSchema, feedbackSchema,
} from './schema';

userSchema.virtual ('name')
  .get (function () {
    return `${this.lastName} ${this.firstName}`;
  })
  .set (function (v) {
    this.lastName = v.substr (0, v.indexOf (' '));
    this.firstName = v.substr (v.indexOf (' ') + 1);
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
  async searchPartial (q) {
    return this.find ({
      $or:
  [
    { title: new RegExp (q, 'gi') },
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
  userSchema, zaboSchema, boardSchema, pinSchema, groupSchema, statisticsSchema, feedbackSchema,
};
