import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import ExpansionBar from './expansion-bar';

describe('<ExpansionBar />', () => {
  describe('#render', () => {
    let bar;
    let hideSize;
    let showSize;
    let spy;

    context('when initialSize === totalSize', () => {
      before(() => {
        const size = 8;
        const props = {
          initialSize: size,
          perClickSize: size,
          renderSize: size,
          setRenderSize: () => {},
          totalSize: size
        };
        bar = mount(<ExpansionBar {...props} />);
      });
      it('does not render a show more fields button', () => {
        const downButtons = bar.find('.fa-arrow-down');
        expect(downButtons.length).to.equal(0);
      });
      it('does not render a hide fields button', () => {
        const upButtons = bar.find('.fa-arrow-up');
        expect(upButtons.length).to.equal(0);
      });
    });

    context('when initialSize === renderSize and renderSize < totalSize', () => {
      before(() => {
        showSize = 2;
        const size = 3;
        const props = {
          initialSize: size,
          perClickSize: showSize,
          renderSize: size,
          setRenderSize: () => {},
          totalSize: 8
        };
        bar = mount(<ExpansionBar {...props} />);
      });
      it('renders a show more fields button', () => {
        const downButtons = bar.find('.expansion-bar-show');
        expect(downButtons).to.have.text(`Show ${showSize} more fields`);
      });
      it('does not render a hide fields button', () => {
        const upButtons = bar.find('.fa-arrow-up');
        expect(upButtons.length).to.equal(0);
      });
    });

    context('when initialSize < renderSize < totalSize', () => {
      before(() => {
        const props = {
          initialSize: 3,
          perClickSize: 2,
          setRenderSize: () => {},
          totalSize: 8
        };
        hideSize = 2 * props.perClickSize; // 2 clicks of "Show more" button
        expect(hideSize).to.be.equal(4);
        props.renderSize = props.initialSize + hideSize;
        expect(props.renderSize).to.be.equal(7);
        showSize = props.totalSize - props.renderSize;
        expect(showSize).to.be.equal(1);
        bar = mount(<ExpansionBar {...props} />);
      });
      it('renders a show more fields button', () => {
        const downButtons = bar.find('.expansion-bar-show');
        expect(downButtons).to.have.text(`Show ${showSize} more fields`);
      });
      it('renders a hide fields button', () => {
        const upButtons = bar.find('.expansion-bar-hide');
        expect(upButtons).to.have.text(`Hide ${hideSize} fields`);
      });
    });

    context('when initialSize < renderSize < totalSize and disableHideButton', () => {
      before(() => {
        const props = {
          disableHideButton: true,
          initialSize: 3,
          perClickSize: 2,
          setRenderSize: () => {},
          totalSize: 8
        };
        hideSize = 2 * props.perClickSize; // 2 clicks of "Show more" button
        props.renderSize = props.initialSize + hideSize;
        expect(props.renderSize).to.be.equal(7);
        showSize = props.totalSize - props.renderSize;
        expect(showSize).to.be.equal(1);
        bar = mount(<ExpansionBar {...props} />);
      });
      it('renders a show more fields button', () => {
        const downButtons = bar.find('.expansion-bar-show');
        expect(downButtons).to.have.text(`Show ${showSize} more fields`);
      });
      it('does not render a hide fields button', () => {
        const upButtons = bar.find('.fa-arrow-up');
        expect(upButtons.length).to.equal(0);
      });
    });

    context('when initialSize < renderSize and renderSize === totalSize', () => {
      before(() => {
        const size = 8;
        const props = {
          totalSize: size,
          initialSize: 3,
          perClickSize: 2,
          renderSize: size,
          setRenderSize: () => {}
        };
        hideSize = props.totalSize - props.initialSize;
        expect(hideSize).to.be.equal(5);
        bar = mount(<ExpansionBar {...props} />);
      });
      it('does not render a show more fields button', () => {
        const downButtons = bar.find('.fa-arrow-down');
        expect(downButtons.length).to.equal(0);
      });
      it('renders a hide fields button', () => {
        const upButtons = bar.find('.expansion-bar-hide');
        expect(upButtons).to.have.text(`Hide ${hideSize} fields`);
      });
    });

    context('when clicking buttons', () => {
      before(() => {
        spy = sinon.spy();
        const props = {
          initialSize: 3,
          perClickSize: 2,
          renderSize: 5, // Between 3 and 8 to make both buttons show
          setRenderSize: spy,
          totalSize: 8
        };
        bar = mount(<ExpansionBar {...props} />);
      });

      context('show N more fields button', () => {
        it('setRenderSize is called', () => {
          const parent = bar.find('.expansion-bar-show');
          parent.simulate('click');
          expect(spy.called).to.be.equal(true);
        });
      });

      context('hide N fields button', () => {
        it('setRenderSize is called', () => {
          const parent = bar.find('.expansion-bar-hide');
          parent.simulate('click');
          expect(spy.called).to.be.equal(true);
        });
      });
    });
  });
});
