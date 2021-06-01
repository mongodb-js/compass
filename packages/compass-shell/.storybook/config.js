import { configure, addDecorator, setAddon } from '@storybook/react';
import PageDecorator from 'storybook/decorators/page';

// Add decorators globally to wrap our stories with
addDecorator(PageDecorator);

// Dynamically load all stories found in the components directory that
// match the .stores.js extension
const req = require.context('../src', true, /\.stories\.js$/);
const loadStories = () => req.keys().forEach((filename) => req(filename));

configure(loadStories, module);
