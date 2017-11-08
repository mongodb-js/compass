const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const sinonChai = require('sinon-chai');

require('jsdom-global')();

global.sinon = require('sinon');
global.expect = chai.expect;

chai.should();
chai.use(sinonChai);
chai.use(chaiEnzyme());
