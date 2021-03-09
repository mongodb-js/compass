const Enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const sinonChai = require('sinon-chai');

chai.should();
chai.use(sinonChai);
chai.use(chaiEnzyme());

global.expect = chai.expect;


Enzyme.configure({ adapter: new Adapter() });

const context = require.context('.', true, /\.spec\.js$/);

context.keys().forEach(context);
