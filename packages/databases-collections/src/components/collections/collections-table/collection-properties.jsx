import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Icon from '@leafygreen-ui/icon';

import {
  PROPERTIES_CAPPED,
  PROPERTIES_COLLATION,
  PROPERTIES_READ_ONLY,
  PROPERTIES_TIME_SERIES,
  PROPERTIES_VIEW
} from '../../../modules/collections';

import PropertyBadge from './property-badge';

import styles from './collection-properties.less';

export default class CollectionProperties extends PureComponent {
  static propTypes = {
    collection: PropTypes.shape({
      Properties: PropTypes.array.isRequired,
      _id: PropTypes.string.isRequired
    }).isRequired
  }

  renderProperty = (property) => {
    const { name, options } = property || {};

    if (name === PROPERTIES_COLLATION) {
      return (<PropertyBadge
        label="Collation"
        variant="darkgray"
        tooltip={this.renderOptions(options)}
      />);
    }

    if (name === PROPERTIES_VIEW) {
      return (<PropertyBadge
        label="View"
        icon={<Icon glyph="Visibility" />}
        variant="darkgray"
        tooltip={this.renderOptions(options)} />);
    }

    if (name === PROPERTIES_CAPPED) {
      return (<PropertyBadge
        label="Capped"
        variant="darkgray"
        tooltip={this.renderOptions(options)} />);
    }

    if (name === PROPERTIES_TIME_SERIES) {
      return (<PropertyBadge
        label="Time-series"
        variant="darkgray"
        tooltip={this.renderOptions(options)} />);
    }

    if (name === PROPERTIES_READ_ONLY) {
      return (<PropertyBadge
        label="Read-only"
        variant="lightgray"
        tooltip={this.renderOptions(options)} />);
    }
  }

  renderOptions(options) {
    const entries = Object.entries(options || {});

    if (!entries.length) {
      return;
    }

    return (<div>{entries.map(
      ([key, value]) => {
        return <div key={key}><b>{key}</b>: {`${value}`}</div>;
      }
    )}</div>);
  }

  render() {
    const properties = (this.props.collection.Properties || []);
    const propertyElements = properties.map((property, i) => {
      return (
        <div key={`${this.props.collection._id}-prop-${i}`}
          className={styles['collection-properties-property']}>
          {this.renderProperty(property)}
        </div>
      );
    });

    return <div className={styles['collection-properties']}>{propertyElements}</div>;
  }
}
