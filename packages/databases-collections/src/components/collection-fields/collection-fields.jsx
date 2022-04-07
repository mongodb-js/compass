/* eslint-disable react/no-multi-comp */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import mongodbQueryParser from 'mongodb-query-parser';

import CappedCollectionFields from './capped-collection-fields';
import CollectionName from './collection-name';
import DatabaseName from './database-name';
import hasTimeSeriesSupport from './has-time-series-support';
import TimeSeriesFields from './time-series-fields';
import hasClusteredCollectionSupport from './has-clustered-collection-support';
import ClusteredCollectionFields from './clustered-collection-fields';
import Collation from './collation';

function asNumber(value) {
  return !_.isNil(value) && `${value}` ? +value : undefined;
}

function asBSON(value) {
  try {
    return mongodbQueryParser(value);
  } catch (err) {
    return undefined;
  }
}

function omitEmptyFormFields(obj) {
  const omitted = {};
  for (const [key, value] of Object.entries(obj)) {
    if (_.isNil(value) || (_.isString(value) && value.trim() === '')) {
      continue;
    }
    omitted[key] = _.isObjectLike(value) ? omitEmptyFormFields(value) : value;
  }
  return omitted;
}

export default class CollectionFields extends PureComponent {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    serverVersion: PropTypes.string,
    withDatabase: PropTypes.bool
  }

  state = {
    isCapped: false,
    isCustomCollation: false,
    isTimeSeries: false,
    isClustered: false,
    fields: {
      cappedSize: '',
      collation: {},
      collectionName: '',
      databaseName: '',
      timeSeries: {},
      expireAfterSeconds: '',
      clusteredIndex: { unique: true }
    }
  };

  setField(fieldName, value) {
    const fields = _.cloneDeep(this.state.fields);
    _.set(fields, fieldName, value);
    this.setState({ fields }, this.updateOptions);
  }

  updateOptions = () => {
    this.props.onChange({
      database: this.state.fields.databaseName,
      collection: this.state.fields.collectionName,
      options: this.buildOptions()
    });
  }

  buildOptions() {
    const { isCapped, isCustomCollation, isTimeSeries, isClustered, fields } = this.state;

    const cappedOptions = isCapped
      ? { capped: true, size: asNumber(fields.cappedSize) }
      : {};

    const collationOptions = isCustomCollation
      ? { collation: fields.collation }
      : {};

    const timeSeriesOptions = isTimeSeries
      ? {
        timeseries: fields.timeSeries,
        expireAfterSeconds: asNumber(fields.expireAfterSeconds),
      }
      : {};

    const clusteredOptions = isClustered
      ? {
        clusteredIndex: {
          ...fields.clusteredIndex,
          // leaving it as is should make the command to create the clustered
          // collection fail because it is a string
          key: asBSON(fields.clusteredIndex.key) ?? fields.clusteredIndex
        }
      }
      : {};

    return omitEmptyFormFields({
      ...collationOptions,
      ...cappedOptions,
      ...timeSeriesOptions,
      ...clusteredOptions
    });
  }

  render() {
    const {
      serverVersion,
      withDatabase
    } = this.props;

    const {
      fields,
      isCapped,
      isCustomCollation,
      isTimeSeries,
      isClustered
    } = this.state;

    const {
      collectionName,
      databaseName,
      cappedSize,
      collation,
      timeSeries,
      expireAfterSeconds,
      clusteredIndex
    } = fields;

    return (<>
      {withDatabase && (
        <DatabaseName
          databaseName={databaseName}
          onChangeDatabaseName={
            (newDatabaseName) => this.setField('databaseName', newDatabaseName)
          }
        />
      )}
      <CollectionName
        collectionName={collectionName}
        onChangeCollectionName={(newCollectionName) => this.setField(
          'collectionName',
          newCollectionName
        )}
      />
      <CappedCollectionFields
        cappedSize={`${cappedSize}`}
        isCapped={isCapped}
        isTimeSeries={isTimeSeries}
        isClustered={isClustered}
        onChangeCappedSize={(newCappedSizeString) =>
          this.setField('cappedSize', newCappedSizeString)
        }
        onChangeIsCapped={
          (capped) => this.setState({ isCapped: capped }, this.updateOptions)
        }
      />
      <Collation
        collation={collation}
        onChangeCollationOption={(fieldName, value) => {
          this.setField(`collation.${fieldName}`, value);
        }}
        onChangeIsCustomCollation={(customCollation) => this.setState(
          { isCustomCollation: customCollation },
          this.updateOptions
        )}
        isCustomCollation={isCustomCollation}
      />
      {hasTimeSeriesSupport(serverVersion) && (
        <TimeSeriesFields
          isCapped={isCapped}
          isTimeSeries={isTimeSeries}
          isClustered={isClustered}
          onChangeIsTimeSeries={(newIsTimeSeries) => this.setState(
            { isTimeSeries: newIsTimeSeries },
            this.updateOptions
          )}
          onChangeTimeSeriesField={(fieldName, value) =>
            this.setField(fieldName, value)
          }
          timeSeries={timeSeries}
          expireAfterSeconds={expireAfterSeconds}
        />
      )}
      {hasClusteredCollectionSupport(serverVersion) && (
        <ClusteredCollectionFields
          isCapped={isCapped}
          isTimeSeries={isTimeSeries}
          isClustered={isClustered}
          clusteredIndex={clusteredIndex}
          onChangeIsClustered={(newIsClustered) => this.setState(
            { isClustered: newIsClustered },
            this.updateOptions
          )}
          onChangeClusteredIndex={(fieldName, value) => {
            this.setField(fieldName, value);
          }
          }
          openLink={openLink}
        />
      )}
    </>);
  }
}
