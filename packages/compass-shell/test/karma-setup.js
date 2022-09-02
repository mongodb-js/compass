const Enzyme = require('enzyme');
const Adapter = require('@wojtekmaj/enzyme-adapter-react-17');

Enzyme.configure({ adapter: new Adapter() });

const context = require.context('.', true, /\.spec\.jsx?$/);

context.keys().forEach(context);
