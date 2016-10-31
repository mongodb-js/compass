const _ = require('lodash');
const app = require('ampersand-app');
const React = require('react');

const Sidebar = require('./lib/components');
const SidebarStore = require('./lib/stores');
const InstanceStore = app.appRegistry.getStore('App.InstanceStore');

app.appRegistry.getAction('Glossary.Actions').addComponent('Sidebar', 'default', () => {
  const databases = [{
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
  }];

  InstanceStore.setState({
    instance: {
      databases,
      collections: _.flatten(databases.map(db => db.collections)),
      build: {
        version: '3.3.8',
        enterprise_module: false
      },
      hostname: 'data.mongodb.parts',
      port: 27017
    }
  });

  SidebarStore.setState({
    databases
  });

  return (
    <div key="default" className="compass-sidebar-container compass-sidebar-container-is-fixed-height">
      <Sidebar />
    </div>
  );
});
