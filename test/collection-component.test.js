/* eslint no-unused-vars: 0 */
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');

const mount = require('enzyme').mount;
const shallow = require('enzyme').shallow;
const Collection = require('../src/internal-packages/collection/lib/components/index');
const _ = require('lodash');

const debug = require('debug')('compass:collection:test');

// use chai-enzyme assertions, see https://github.com/producthunt/chai-enzyme
chai.use(chaiEnzyme());

describe('<Collection />', function() {
  it.skip('has 4 tabs by default', function() {
    const component = shallow(<Collection />);
    // debug('component', component.debug());
    expect(component).to.have.length(4);
  });
  it.skip('has a validation tab when serverVersion >= 3.2', function() {
    const component = shallow(<Collection serverVersion={'3.2.0'} />);
    expect(component).to.have.length(5);
  });
});
