import React from 'react';
import { shallow } from 'enzyme';

import OptionsToggle from 'components/options-toggle';
import FontAwesome from 'react-fontawesome';

describe('OptionsToggle [Component]', function() {
  let actions;

  beforeEach((done) => {
    actions = { toggleQueryOptions: sinon.stub() };
    done();
  });

  afterEach((done) => {
    actions = null;
    done();
  });

  describe('#rendering', function() {
    it('should render the correct icon when it is not expanded', function() {
      const component = shallow(<OptionsToggle actions={actions} expanded={false} />);
      expect(component.find(FontAwesome)).to.have.prop('name', 'caret-right');
    });

    it('should render the correct icon when it is expanded', function() {
      const component = shallow(<OptionsToggle actions={actions} expanded />);
      expect(component.find(FontAwesome)).to.have.prop('name', 'caret-down');
    });

    it('should render the correct text', function() {
      const component = shallow(<OptionsToggle actions={actions} expanded={false} />);
      expect(component.find('[data-test-id="query-bar-options-toggle-text"]')).to.have.text('Options');
    });
  });

  describe('#behaviour', function() {
    it('should trigger the toggleQueryOptions action when clicked', function() {
      const component = shallow(<OptionsToggle actions={actions} expanded={false} />);

      component.simulate('click');
      actions.toggleQueryOptions.should.have.been.called; // eslint-disable-line no-unused-expressions
    });
  });
});
