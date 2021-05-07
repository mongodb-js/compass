module.exports = [
  {
    'v': 1,
    'key': {
      '_id': 1
    },
    'name': '_id_',
    'ns': 'mongodb.fanclub'
  },
  {
    'v': 1,
    'key': {
      '_id': 1,
      'gender': -1
    },
    'name': '_id_1_gender_-1',
    'ns': 'mongodb.fanclub'
  },
  {
    'v': 1,
    'key': {
      'last_login': -1
    },
    'name': 'last_login_-1',
    'ns': 'mongodb.fanclub'
  },
  {
    'v': 1,
    'key': {
      '_fts': 'text',
      '_ftsx': 1
    },
    'name': '$**_text',
    'ns': 'mongodb.fanclub',
    'weights': {
      '$**': 1
    },
    'default_language': 'english',
    'language_override': 'language',
    'textIndexVersion': 3
  },
  {
    'v': 1,
    'key': {
      'last_position': '2dsphere'
    },
    'name': 'last_position_2dsphere',
    'ns': 'mongodb.fanclub',
    '2dsphereIndexVersion': 3
  },
  {
    'v': 1,
    'key': {
      'name': 1,
      'address.city': 1
    },
    'name': 'seniors',
    'ns': 'mongodb.fanclub',
    'partialFilterExpression': {
      'age': {
        '$gt': 50
      }
    }
  },
  {
    'v': 1,
    'key': {
      'name': -1,
      'address.city': 1
    },
    'name': 'seniors-inverse',
    'ns': 'mongodb.fanclub'
  },
  {
    'v': 1,
    'key': {
      'email': 1,
      'favorite_features': 1
    },
    'name': 'email_1_favorite_features_1',
    'ns': 'mongodb.fanclub'
  },
  {
    'v': 1,
    'key': {
      'email': 1,
      'favorite_features': 1,
      'name': 1,
      'last_login': -1
    },
    'name': 'big-index',
    'ns': 'mongodb.fanclub'
  },
  {
    'v': 1,
    'key': {
      'address.$**': 1
    },
    'name': 'wildcard_single_subtree',
    'ns': 'mongodb.fanclub'
  },
  {
    'v': 1,
    'key': {
      '$**': 1
    },
    'name': 'wildcard_multi_subtree',
    'wildcardProjection': {
      'borough': 1,
      'cuisine': 1
    },
    'ns': 'mongodb.fanclub'
  },
  {
    'v': 1,
    'key': {
      'name$**': 1
    },
    'name': 'not_wildcard',
    'ns': 'mongodb.fanclub'
  }
];
