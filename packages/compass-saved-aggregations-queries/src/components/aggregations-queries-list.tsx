import React, { useEffect } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { fetchItems, State } from './../stores/aggregations-queries-items';

const AggregationsQueriesList = ({
  loading,
  items,
  fetchItems,
}: PropsFromRedux) => {
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  if (loading) {
    return <p>Loading ...</p>;
  }
  if (!loading && !items.length) {
    return <p>No saved queries/aggregations.</p>;
  }
  return (
    <div>{`Hello, world! We have ${items.length} saved queries/aggregations`}</div>
  );
};

const mapState = ({ loading, items }: State) => ({
  loading,
  items,
});

const mapDispatch = {
  fetchItems,
};

const connector = connect(mapState, mapDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(AggregationsQueriesList);
