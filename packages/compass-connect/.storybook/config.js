import '../styles/index.less';

import { configure, setAddon } from '@kadira/storybook';
import infoAddon from '@kadira/react-storybook-addon-info';

setAddon(infoAddon);

// load all stories matching ../stories/*.js
const req = require.context('../stories', true, /.js$/);
function loadStories() {
  req.keys().forEach(req);
}

configure(loadStories, module);
