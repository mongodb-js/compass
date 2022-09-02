const chai = require('chai');
const Enzyme = require('enzyme');
// const Adapter = require('enzyme-adapter-react-16');
const Adapter = require('@wojtekmaj/enzyme-adapter-react-17');

Enzyme.configure({ adapter: new Adapter() });

chai.use(require('chai-enzyme')());
