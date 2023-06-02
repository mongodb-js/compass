'use strict';
const chai = require('chai');
const Enzyme = require('enzyme');
const Adapter = require('@wojtekmaj/enzyme-adapter-react-17');

Enzyme.configure({ adapter: new Adapter() });

chai.use(require('chai-enzyme')());
