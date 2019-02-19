const Reflux = require('reflux');
const StateMixin = require('reflux-state-mixin');

/**
 * Convert into format expected
 * @param {Object} db - {_id: dbname, collections: ['coll1', 'coll2']}
 * @return {Object}
 */
const makeModel = (db) => {
  const colls = db.collections.map((c) => ({
    _id: `${db._id}.${c}`, database: db._id, capped: false, power_of_two: false, readonly: false
  }));

  return {
    _id: db._id,
    collections: { models: colls },
    toJSON: () => ({
      _id: db._id,
      collections: colls
    })
  };
};


const InstanceStore = Reflux.createStore({
  mixins: [StateMixin.store],
  getInitialState() {
    return {
      instance: {
        databases: [],
        collections: []
      }
    };
  },
  setupStore() {
    this.setState(
      {
        instance: {
          databases: [
            {_id: 'admin', collections: ['citibikecoll', 'coll']},
            {_id: 'citibike', collections: ['admincoll', 'coll2']}
          ].map((d) => (makeModel(d))),
          collections: [
            { _id: 'citibikecoll' }, { _id: 'coll' }, { _id: 'admincoll' }, { _id: 'coll2' }
          ]
        }
      }
    );
  }
});

const InstanceActions = Reflux.createActions([
  'refreshInstance'
]);

module.exports = {
  InstanceStore,
  InstanceActions,
  makeModel
};
