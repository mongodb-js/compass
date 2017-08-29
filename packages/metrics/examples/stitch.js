var resources = require('../').resources;
var metrics = require('../')();

metrics.configure({
  stitch: {
    appId: 'compass-metrics-irinb',
    enabled: true
  }
});

// create an app resource with name and version
var app = new resources.AppResource({
  appName: 'My Cool App',
  appVersion: '2.0.1',
  userId: '3c007a83-e8c3-4b52-9631-b5fd97950dce'
});

// create a user resource with client id (UUID v4 recommended)
var user = new resources.UserResource({
  userId: '3c007a83-e8c3-4b52-9631-b5fd97950dce',
  name: 'Thomas'
});

// add the resources to the metrics module to set everything up
metrics.addResource(app, user);

// track an application launch event
metrics.track('App', 'launched');
