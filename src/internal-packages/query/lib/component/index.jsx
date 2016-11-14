const React = require('react');
const QueryStore = require('../store/query-store');
const QueryInputForm = require('./input-form');
const StateMixin = require('reflux-state-mixin');

// const debug = require('debug')('mongodb-compass:query-bar');

const QueryBar = React.createClass({

  /**
   * automatically subscribe/unsubscribe to changes from the store.
   */
  mixins: [ StateMixin.connect(QueryStore) ],

  /**
   * Render Query Bar.
   *
   * @returns {React.Component} The Query Bar view.
   */
  render() {
    return (
      <div className="refine-view-container">
        <div className="query-input-container">
          <div className="row">
            <div className="col-md-12">
              <QueryInputForm {...this.state} />
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = QueryBar;
