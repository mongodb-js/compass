const Enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');

Enzyme.configure({ adapter: new Adapter() });

const context = require.context('.', true, /\.spec\.js$/);

context.keys().forEach(context);
