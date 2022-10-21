import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Banner, BannerVariant, EmptyContent, Link, css, spacing } from '@mongodb-js/compass-components';
import { DatabasesList } from '@mongodb-js/databases-collections-list';

const errorContainerStyles = css({
  padding: spacing[3],
});

const nonGenuineErrorContainerStyles = css({
  width: '100%',
});

const NON_GENUINE_SUBTEXT =
  'This server or service appears to be emulating' +
  ' MongoDB. Some documented MongoDB features may work differently, may be' +
  ' entirely missing or incomplete, or may have unexpectedly different' +
  ' performance characteristics than would be found when connecting to a' +
  ' real MongoDB server or service.';
const DOCUMENTATION_LINK = 'https://www.mongodb.com/cloud/atlas';

const ERROR_WARNING = 'An error occurred while loading databases';

const DatabaseErrorZeroGraphic = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="51" viewBox="0 0 48 51">
    <g fill="none" fillRule="evenodd" transform="translate(1 1)">
      <g transform="translate(23.125 26.25)">
        <polygon stroke="#15CC62" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" points=".313 22.813 22.813 22.813 11.563 .313"/>
        <path stroke="#116149" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M11.5625,9.6875 L11.5625,16.25"/>
        <path fill="#116149" d="M11.5625,18.125 C11.045,18.125 10.625,18.545 10.625,19.0625 C10.625,19.58 11.045,20 11.5625,20 C12.08,20 12.5,19.58 12.5,19.0625 C12.5,18.545 12.08,18.125 11.5625,18.125 Z"/>
      </g>
      <g stroke="#116149" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75">
        <path d="M6.25 1.25C5.07716795 1.64190062 4.26189876 2.66207556 4.1764842 3.8439516L4.1764842 15.758164C4.23244618 18.0107406 2.36333618 19.8804049 0 19.935434L0 20.0701891C2.36097956 20.1224005 4.23126787 21.9892594 4.1764842 24.2395943 4.1764842 24.2418486 4.1764842 24.2446539 4.1764842 24.2474592L4.1764842 36.1560522C4.26189876 37.3379269 5.07716795 38.3581081 6.25 38.75M38.75 1.25C39.9224317 1.64077724 40.7375907 2.6615145 40.8217582 3.8439516L40.8217582 15.758164C40.7687921 18.0118677 42.6380836 19.8804049 45 19.935434L45 20.0701891C42.6374898 20.1224005 40.7670235 21.9915012 40.8217582 24.2452174 40.8217582 26.4594297 40.8217582 28.1197153 40.8217582 29.2260742M10 38.75C10 38.75 15.8403771 39.4564507 23.2208907 39.4600749M10 20C10 20 23.2085236 21.5971375 35 20M10 2.5C10 2.5 23.2085236 4.09713625 35 2.5M10 .777980134C14.203048.262413509 24.428028-.679055991 35 .777980134"/>
      </g>
    </g>
  </svg>
);

function NonGenuineZeroState() {
  return (
    <div className={nonGenuineErrorContainerStyles} data-testid="databases-non-genuine-warning">
      <EmptyContent
        icon={DatabaseErrorZeroGraphic}
        title="Unable to display databases and collections"
        subTitle={NON_GENUINE_SUBTEXT}
        callToActionLink={
          <Link href={DOCUMENTATION_LINK}>
            Try MongoDB Atlas
          </Link>
        }
      />
    </div>
  );
}

class Databases extends PureComponent {
  static propTypes = {
    databases: PropTypes.array.isRequired,
    databasesStatus: PropTypes.object.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    isWritable: PropTypes.bool.isRequired,
    isGenuineMongoDB: PropTypes.bool.isRequired,
    isDataLake: PropTypes.bool.isRequired,
    onDatabaseClick: PropTypes.func.isRequired,
    onDeleteDatabaseClick: PropTypes.func.isRequired,
    onCreateDatabaseClick: PropTypes.func.isRequired,
  };

  /**
   * Render Databases component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const {
      databases,
      databasesStatus,
      isReadonly,
      isWritable,
      isDataLake,
      isGenuineMongoDB,
      onDatabaseClick,
      onDeleteDatabaseClick,
      onCreateDatabaseClick,
    } = this.props;

    if (databasesStatus.status === 'error') {
      return (
        <div className={errorContainerStyles}>
          <Banner variant={BannerVariant.Danger}>
            {ERROR_WARNING}: {databasesStatus.error}
          </Banner>
        </div>
      );
    }

    if (databases.length === 0 && !isGenuineMongoDB) {
      return <NonGenuineZeroState />;
    }

    const actions = Object.assign(
      { onDatabaseClick },
      !isReadonly && isWritable && !isDataLake
        ? { onDeleteDatabaseClick, onCreateDatabaseClick }
        : {}
    );

    return <DatabasesList databases={databases} {...actions} />;
  }
}

/**
 * Map the store state to properties to pass to the components.
 *
 * @param {Object} state - The store state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = (state) => ({
  databases: state.databases,
  databasesStatus: state.databasesStatus,
  isReadonly: state.isReadonly,
  isWritable: state.isWritable,
  isGenuineMongoDB: state.isGenuineMongoDB,
  isDataLake: state.isDataLake,
});

function createEmit(evtName) {
  return function(...args) {
    return function(_dispatch, getState) {
      const { appRegistry } = getState();
      appRegistry?.emit(evtName, ...args);
    };
  };
}

const mapDispatchToProps = {
  onDatabaseClick: createEmit('select-database'),
  onDeleteDatabaseClick: createEmit('open-drop-database'),
  onCreateDatabaseClick: createEmit('open-create-database'),
};

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const ConnectedDatabases = connect(
  mapStateToProps,
  mapDispatchToProps
)(Databases);

export default ConnectedDatabases;
export { Databases };
