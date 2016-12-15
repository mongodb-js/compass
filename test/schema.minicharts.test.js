/* eslint no-unused-vars: 0, no-unused-expressions: 0 */
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');

const shallow = require('enzyme').shallow;
const Minichart = require('../src/internal-packages/schema/lib/component/minichart');

chai.use(chaiEnzyme());

describe('<Minichart />', () => {
  context('when passing in unique long values', () => {
    const schemaType = {
      count: 4,
      has_duplicates: false,
      name: 'Int64',
      path: 'test_unique_longs',
      probability: 1,
      unique: 4
    };
    const minichart = shallow(
      <SidebarInstanceProperties
        fieldName="test_unique_longs"
        type={schemaType}
      />);

    it('renders a unique minichart with bubbles for each datum', () => {
      expect(minichart).to.contain(<UniqueMinichart />);
    });
  });
});
