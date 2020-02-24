import { configure, addDecorator, setAddon } from '@storybook/react';
import { setOptions } from '@storybook/addon-options';
// import { withKnobs } from '@storybook/addon-knobs';

// import chaptersAddon from 'react-storybook-addon-chapters';
// import { Page } from '@mongodb-js/migrator-storybook-decorators';

// Configure the Storybook UI
import "less/global.less";
setOptions({
  name: "Deployment Awareness",
  url: "https://github.com/mongodb-js/compass-deployment-awareness",
  showAddonPanel: false
});

// setAddon(chaptersAddon);

// Add decorators globally to wrap our stories with
// addDecorator(Page);
// addDecorator(withKnobs);

// Dynamically load all stories found in the components directory that
// match the .stories.js or .story.js extension
const req = require.context(
  '../stories',
  true,
  /^((?!node_modules).)*\.js$/
);

function loadStories() {
  req.keys().forEach(filename => req(filename));
}

configure(loadStories, module);
