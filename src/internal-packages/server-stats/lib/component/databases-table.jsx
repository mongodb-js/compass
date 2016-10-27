const React = require('react');
const app = require('ampersand-app');
const SortableTable = app.appRegistry.getComponent('App.SortableTable');

class DatabasesTable extends React.Component {

  render() {
    return (
      <SortableTable columns={['Name', 'Size', 'Number of Collections']} />
    );
  }
}

DatabasesTable.propTypes = {
};

DatabasesTable.defaultProps = {
};

DatabasesTable.displayName = 'DatabasesTable';

module.exports = DatabasesTable;
