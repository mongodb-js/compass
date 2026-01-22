import React from 'react';
import { connect } from 'react-redux';

const IndexesDrawer = () => {
  return (
    // Actual drawer implementation goes here
    <div data-testid="indexes-tab-drawer">Indexes Drawer</div>
  );
};

export const IndexesTabDrawer = connect()(IndexesDrawer);
