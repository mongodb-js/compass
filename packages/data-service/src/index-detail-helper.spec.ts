import { expect } from 'chai';
import type { IndexInfo } from './index-detail-helper';
import { createIndexDefinition } from './index-detail-helper';

const SIMPLE_INDEX: IndexInfo = {
  v: 1,
  key: {
    foo: 1,
  },
  name: 'foo',
};

const INDEXES_FIXTURE: IndexInfo[] = [
  {
    v: 1,
    key: {
      _id: 1,
    },
    name: '_id_',
  },
  {
    v: 1,
    key: {
      _id: 1,
      gender: -1,
    },
    name: '_id_1_gender_-1',
  },
  {
    v: 1,
    key: {
      last_login: -1,
    },
    name: 'last_login_-1',
  },
  {
    v: 1,
    key: {
      _fts: 'text',
      _ftsx: 1,
    },
    name: '$**_text',
    weights: {
      '$**': 1,
    },
    default_language: 'english',
    language_override: 'language',
    textIndexVersion: 3,
  },
  {
    v: 1,
    key: {
      last_position: '2dsphere',
    },
    name: 'last_position_2dsphere',
    '2dsphereIndexVersion': 3,
  },
  {
    v: 1,
    key: {
      name: 1,
      'address.city': 1,
    },
    name: 'seniors',
    ns: 'mongodb.fanclub',
    partialFilterExpression: {
      age: {
        $gt: 50,
      },
    },
  },
  {
    v: 1,
    key: {
      name: -1,
      'address.city': 1,
    },
    name: 'seniors-inverse',
    ns: 'mongodb.fanclub',
  },
  {
    v: 1,
    key: {
      email: 1,
      favorite_features: 1,
    },
    name: 'email_1_favorite_features_1',
    ns: 'mongodb.fanclub',
  },
  {
    v: 1,
    key: {
      email: 1,
      favorite_features: 1,
      name: 1,
      last_login: -1,
    },
    name: 'big-index',
    ns: 'mongodb.fanclub',
  },
  {
    v: 1,
    key: {
      'address.$**': 1,
    },
    name: 'wildcard_single_subtree',
    ns: 'mongodb.fanclub',
  },
  {
    v: 1,
    key: {
      '$**': 1,
    },
    name: 'wildcard_multi_subtree',
    wildcardProjection: {
      borough: 1,
      cuisine: 1,
    },
    ns: 'mongodb.fanclub',
  },
  {
    v: 1,
    key: {
      'name$**': 1,
    },
    name: 'not_wildcard',
    ns: 'mongodb.fanclub',
  },
  {
    v: 1,
    key: {
      '$**': 'columnstore',
    },
    name: 'columnstore_single_subtree',
    ns: 'mongodb.fanclub',
  },
  {
    v: 1,
    key: {
      'address.$**': 'columnstore',
    },
    name: 'columnstore_multi_subtree',
    columnstoreProjection: {
      borough: 1,
      cuisine: 1,
    },
    ns: 'mongodb.fanclub',
  },
];

describe('createIndexDefinition', function () {
  const definitions = INDEXES_FIXTURE.map((index) => {
    return createIndexDefinition('mongodb.fanclub', index);
  });
  const definitionsMap = new Map(
    definitions.map((index) => [index.name, index])
  );

  it('should get the names right', function () {
    expect(definitions.map((index) => index.name).sort()).to.deep.eq([
      '$**_text',
      '_id_',
      '_id_1_gender_-1',
      'big-index',
      'columnstore_multi_subtree',
      'columnstore_single_subtree',
      'email_1_favorite_features_1',
      'last_login_-1',
      'last_position_2dsphere',
      'not_wildcard',
      'seniors',
      'seniors-inverse',
      'wildcard_multi_subtree',
      'wildcard_single_subtree',
    ]);
  });

  it('should have the correct namespace', function () {
    expect(definitions.every((index) => typeof index.ns === 'string')).to.eq(
      true,
      'expected every index to have a namespace'
    );
  });

  it('should have the correct version', function () {
    expect(
      definitions.every((index) => typeof index.version === 'number')
    ).to.eq(true, 'expected every index to have a version number');
  });

  it('should recognize geo indexes', function () {
    expect(definitionsMap.get('last_position_2dsphere')).to.have.property(
      'type',
      'geospatial'
    );
  });

  it('should recognize single wildcard indexes', function () {
    // eslint-disable-next-line no-console
    console.log(definitionsMap.get('wildcard_single_subtree'));
    expect(definitionsMap.get('wildcard_single_subtree')).to.have.property(
      'type',
      'wildcard'
    );
  });

  it('should recognize multi subtree wildcard indexes', function () {
    expect(definitionsMap.get('wildcard_multi_subtree')).to.have.property(
      'type',
      'wildcard'
    );
  });

  it('should not recognize indexes with $** as wildcard', function () {
    expect(definitionsMap.get('not_wildcard'))
      .to.have.property('type')
      .not.eq('wildcard');
  });

  it('should recognize single columnstore indexes', function () {
    expect(definitionsMap.get('columnstore_single_subtree')).to.have.property(
      'type',
      'columnstore'
    );
  });

  it('should recognize multi subtree columnstore indexes', function () {
    expect(definitionsMap.get('columnstore_multi_subtree')).to.have.property(
      'type',
      'columnstore'
    );
  });

  it('should recognize compound indexes', function () {
    expect(definitionsMap.get('email_1_favorite_features_1')).to.have.property(
      'cardinality',
      'compound'
    );
  });

  it('should return the correct `properties` array', function () {
    expect(definitionsMap.get('seniors'))
      .to.have.property('properties')
      .deep.eq(['partial']);
    expect(definitionsMap.get('last_login_-1'))
      .to.have.property('properties')
      .deep.eq([]);
    expect(definitionsMap.get('_id_'))
      .to.have.property('properties')
      .deep.eq(['unique']);
  });

  it('should recognize text indexes', function () {
    expect(definitionsMap.get('$**_text')).to.have.property('type', 'text');
  });

  it('should recognize unique indexes', function () {
    expect(definitionsMap.get('_id_'))
      .to.have.property('properties')
      .include('unique');
  });

  it('should recognize partial indexes', function () {
    expect(definitionsMap.get('seniors'))
      .to.have.property('properties')
      .include('partial');
    expect(definitionsMap.get('seniors')).to.have.nested.property(
      'extra.partialFilterExpression'
    );
  });

  describe('cardinality', function () {
    it('non-text simple index', function () {
      const index = {
        v: 1,
        key: {
          age: 1,
        },
        name: 'age_index',
        ns: 'mongodb.fanclub',
      };
      expect(createIndexDefinition('', index)).to.have.property(
        'cardinality',
        'single'
      );
    });

    it('non-text index with multiple fields', function () {
      const index = {
        v: 1,
        key: {
          age: 1,
          city: -1,
        },
        name: 'age_index',
        ns: 'mongodb.fanclub',
      };
      expect(createIndexDefinition('', index)).to.have.property(
        'cardinality',
        'compound'
      );
    });

    it('simple text index', function () {
      const index = {
        v: 1,
        key: {
          _fts: 'text',
          _ftsx: 1,
        },
        name: '$**_text',
        ns: 'mongodb.fanclub',
        weights: {
          '$**': 2,
        },
        default_language: 'english',
        language_override: 'language',
        textIndexVersion: 3,
      };
      expect(createIndexDefinition('', index)).to.have.property(
        'cardinality',
        'single'
      );
    });

    it('text index on multiple fields which are all text', function () {
      const index = {
        v: 1,
        key: {
          _fts: 'text',
          _ftsx: 1,
        },
        name: 'name_text_city_text',
        ns: 'mongodb.fanclub',
        weights: {
          name: 1,
          city: 1,
        },
        default_language: 'english',
        language_override: 'language',
        textIndexVersion: 3,
      };
      expect(createIndexDefinition('', index)).to.have.property(
        'cardinality',
        'compound'
      );
    });

    it('text index on multiple fields which are mixed', function () {
      const index = {
        v: 1,
        key: {
          _fts: 'text',
          _ftsx: 1,
          age: 1,
        },
        name: 'name_text_age',
        ns: 'mongodb.fanclub',
        weights: {
          name: 1,
        },
        default_language: 'english',
        language_override: 'language',
        textIndexVersion: 3,
      };
      expect(createIndexDefinition('', index)).to.have.property(
        'cardinality',
        'compound'
      );
    });
  });

  it('calculates correct ttl', function () {
    expect(
      createIndexDefinition('', { ...SIMPLE_INDEX, expireAfterSeconds: 20 })
    )
      .to.have.property('properties')
      .include('ttl');

    expect(
      createIndexDefinition('', { ...SIMPLE_INDEX, expireAfterSeconds: 0 })
    )
      .to.have.property('properties')
      .include('ttl');

    expect(
      createIndexDefinition('', {
        ...SIMPLE_INDEX,
        expireAfterSeconds: undefined,
      })
    )
      .to.have.property('properties')
      .not.include('ttl');

    expect(createIndexDefinition('', { ...SIMPLE_INDEX }))
      .to.have.property('properties')
      .not.include('ttl');
  });

  describe('fields', function () {
    it('should accept numbers as index field values', function () {
      expect(definitionsMap.get('seniors')).to.have.nested.property(
        'fields[0].field',
        'name'
      );
      expect(definitionsMap.get('seniors')).to.have.nested.property(
        'fields[0].value',
        1
      );
    });

    it('should accept dotted field names', function () {
      expect(definitionsMap.get('seniors')).to.have.nested.property(
        'fields[1].field',
        'address.city'
      );
      expect(definitionsMap.get('seniors')).to.have.nested.property(
        'fields[1].value',
        1
      );
    });

    it('should accept selected strings as index field values', function () {
      expect(
        definitionsMap.get('last_position_2dsphere')
      ).to.have.nested.property('fields[0].field', 'last_position');
      expect(
        definitionsMap.get('last_position_2dsphere')
      ).to.have.nested.property('fields[0].value', '2dsphere');
    });
  });
});
