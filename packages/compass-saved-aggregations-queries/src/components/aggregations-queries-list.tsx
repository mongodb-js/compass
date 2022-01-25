import React, { useEffect } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { State, fetchItems } from './../stores/aggregations-queries-items';

const AggregationsQueriesList = ({
  loading,
  items,
  fetchItems,
}: PropsFromRedux) => {
  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  if (loading) {
    return <p>Loading ...</p>;
  }
  if (!items.length) {
    return <p>No saved queries/aggregations.</p>;
  }
  return (
    <div>
      <h3>Saved Items</h3>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            Name: {item.name} ( Type: {item.type}; Modified: {item.lastModified}
            ; Namespace: ${item.namespace})
          </li>
        ))}
      </ul>
    </div>
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
