const app = require('ampersand-app');
const React = require('react');

const Sidebar = require('./lib/components');
const SidebarStore = require('./lib/stores');

app.appRegistry.getAction('Glossary.Actions').addComponent('Sidebar', 'default', () => {
  SidebarStore.setState({
    databases: [{
      _id: 'foo',
      collections: [{
        _id: 'foo.bar',
        database: 'foo'
      }, {
        _id: 'foo.baz',
        database: 'foo'
      }, {
        _id: 'foo.boo',
        database: 'foo'
      }]
    }, {
      _id: 'foods',
      collections: [{
        _id: 'foods.fruits',
        database: 'foods'
      }, {
        _id: 'foods.sweets',
        database: 'foods'
      }, {
        _id: 'foods.meats',
        database: 'foods'
      }]
    }]
  });

  return (<Sidebar key="default" />);
});
