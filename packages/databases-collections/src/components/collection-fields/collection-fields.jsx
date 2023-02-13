/* eslint-disable react/no-multi-comp */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Accordion, spacing, css } from '@mongodb-js/compass-components';

import CappedCollectionFields from './capped-collection-fields';
import CollectionName from './collection-name';
import DatabaseName from './database-name';
import hasTimeSeriesSupport from './has-time-series-support';
import TimeSeriesFields from './time-series-fields';
import hasClusteredCollectionSupport from './has-clustered-collection-support';
import ClusteredCollectionFields from './clustered-collection-fields';
import hasFLE2Support from './has-fle2-support';
import hasFlexibleBucketConfigSupport from './has-flexible-bucket-config-support';
import FLE2Fields, { ENCRYPTED_FIELDS_PLACEHOLDER } from './fle2-fields';
import Collation from './collation';

const advancedCollectionOptionsContainerStyles = css({
  paddingLeft: spacing[3],
});

function asNumber(value) {
  return !_.isNil(value) && `${value}` ? +value : undefined;
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
    withDatabase: PropTypes.bool,
    configuredKMSProviders: PropTypes.array,
    currentTopologyType: PropTypes.string,
  };

  state = {
    isCapped: false,
    isCustomCollation: false,
    isTimeSeries: false,
    isClustered: false,
    isFLE2: false,
    fields: {
      cappedSize: '',
      collation: {},
      collectionName: '',
      databaseName: '',
      timeSeries: {},
      expireAfterSeconds: '',
      clusteredIndex: { name: '', unique: true, key: { _id: 1 } },
      fle2: {
        encryptedFields: ENCRYPTED_FIELDS_PLACEHOLDER,
        kmsProvider:
          (this.props.configuredKMSProviders || []).length === 1
            ? this.props.configuredKMSProviders[0]
            : '',
        keyEncryptionKey: '',
      },
    },
  };

  setField(fieldName, value) {
    const fields = _.cloneDeep(this.state.fields);
    if (Array.isArray(fieldName)) {
      for (let i = 0; i < fieldName.length; i++) {
        _.set(fields, fieldName[i], value[i]);
      }
    } else {
      _.set(fields, fieldName, value);
    }
    this.setState({ fields }, this.updateOptions);
  }

  updateOptions = () => {
    this.props.onChange({
      database: this.state.fields.databaseName,
      collection: this.state.fields.collectionName,
      options: this.buildOptions(),
    });
  };

  buildOptions() {
    const {
      isCapped,
      isCustomCollation,
      isTimeSeries,
      isClustered,
      isFLE2,
      fields,
    } = this.state;

    const cappedOptions = isCapped
      ? { capped: true, size: asNumber(fields.cappedSize) }
      : {};

    const collationOptions = isCustomCollation
      ? { collation: fields.collation }
      : {};

    const timeSeriesOptions = isTimeSeries
      ? {
          timeseries: {
            ...fields.timeSeries,
            bucketMaxSpanSeconds: asNumber(
              fields.timeSeries.bucketMaxSpanSeconds
            ),
            bucketRoundingSeconds: asNumber(
              fields.timeSeries.bucketRoundingSeconds
            ),
          },
          expireAfterSeconds: asNumber(fields.expireAfterSeconds),
        }
      : {};

    const clusteredOptions = isClustered
      ? {
          clusteredIndex: {
            ...fields.clusteredIndex,
          },
          expireAfterSeconds: asNumber(fields.expireAfterSeconds),
        }
      : {};

    const fle2Options = isFLE2
      ? {
          encryptedFields: fields.fle2.encryptedFields.trim(),
          kmsProvider: `${fields.fle2.kmsProvider || ''}`,
          keyEncryptionKey: fields.fle2.keyEncryptionKey.trim(),
        }
      : {};

    return omitEmptyFormFields({
      ...collationOptions,
      ...cappedOptions,
      ...timeSeriesOptions,
      ...clusteredOptions,
      ...fle2Options,
    });
  }

  render() {
    const { serverVersion, withDatabase } = this.props;

    const {
      fields,
      isCapped,
      isCustomCollation,
      isTimeSeries,
      isClustered,
      isFLE2,
    } = this.state;

    const {
      collectionName,
      databaseName,
      cappedSize,
      collation,
      timeSeries,
      expireAfterSeconds,
      clusteredIndex,
      fle2,
    } = fields;

    return (
      <>
        {withDatabase && (
          <DatabaseName
            databaseName={databaseName}
            onChangeDatabaseName={(newDatabaseName) =>
              this.setField('databaseName', newDatabaseName)
            }
          />
        )}
        <CollectionName
          collectionName={collectionName}
          onChangeCollectionName={(newCollectionName) =>
            this.setField('collectionName', newCollectionName)
          }
        />
        {hasTimeSeriesSupport(serverVersion) && (
          <TimeSeriesFields
            isCapped={isCapped}
            isTimeSeries={isTimeSeries}
            isClustered={isClustered}
            isFLE2={isFLE2}
            onChangeIsTimeSeries={(newIsTimeSeries) =>
              this.setState(
                { isTimeSeries: newIsTimeSeries, expireAfterSeconds: '' },
                this.updateOptions
              )
            }
            onChangeField={(fieldName, value) =>
              this.setField(fieldName, value)
            }
            timeSeries={timeSeries}
            expireAfterSeconds={expireAfterSeconds}
            supportsFlexibleBucketConfiguration={hasFlexibleBucketConfigSupport(
              serverVersion
            )}
          />
        )}
        <Accordion
          data-testid="additional-collection-preferences"
          text="Additional preferences"
          hintText="(e.g. Custom collation, Capped, Clustered collections)"
        >
          <div className={advancedCollectionOptionsContainerStyles}>
            <CappedCollectionFields
              cappedSize={`${cappedSize}`}
              isCapped={isCapped}
              isTimeSeries={isTimeSeries}
              isClustered={isClustered}
              isFLE2={isFLE2}
              onChangeCappedSize={(newCappedSizeString) =>
                this.setField('cappedSize', newCappedSizeString)
              }
              onChangeIsCapped={(capped) =>
                this.setState({ isCapped: capped }, this.updateOptions)
              }
            />
            <Collation
              collation={collation}
              onChangeCollationOption={(fieldName, value) => {
                this.setField(`collation.${fieldName}`, value);
              }}
              onChangeIsCustomCollation={(customCollation) =>
                this.setState(
                  { isCustomCollation: customCollation },
                  this.updateOptions
                )
              }
              isCustomCollation={isCustomCollation}
            />
            {hasClusteredCollectionSupport(serverVersion) && (
              <ClusteredCollectionFields
                isCapped={isCapped}
                isTimeSeries={isTimeSeries}
                isClustered={isClustered}
                clusteredIndex={clusteredIndex}
                expireAfterSeconds={expireAfterSeconds}
                onChangeIsClustered={(newIsClustered) =>
                  this.setState(
                    { isClustered: newIsClustered, expireAfterSeconds: '' },
                    this.updateOptions
                  )
                }
                onChangeField={(fieldName, value) => {
                  this.setField(fieldName, value);
                }}
              />
            )}
            {hasFLE2Support(
              serverVersion,
              this.props.currentTopologyType,
              this.props.configuredKMSProviders
            ) && (
              <FLE2Fields
                isCapped={isCapped}
                isTimeSeries={isTimeSeries}
                isFLE2={isFLE2}
                fle2={fle2}
                configuredKMSProviders={this.props.configuredKMSProviders}
                onChangeIsFLE2={(newIsFLE2) =>
                  this.setState(
                    {
                      isFLE2: newIsFLE2,
                      encryptedFields: {},
                      kmsProvider: '',
                      keyEncryptionKey: {},
                    },
                    this.updateOptions
                  )
                }
                onChangeField={(fieldName, value) => {
                  this.setField(fieldName, value);
                }}
              />
            )}
          </div>
        </Accordion>
      </>
    );
  }
}
