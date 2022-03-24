import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import sinon from 'sinon';

import FindInPageInput from './find-in-page-input';

describe('FindInPageInput [Component]', function () {
  describe('when the component is first rendered', function () {
    let dispatchStopFindSpy: sinon.SinonSpy;
    let setSearchTermSpy: sinon.SinonSpy;
    let toggleStatusSpy: sinon.SinonSpy;
    let dispatchFindSpy: sinon.SinonSpy;
    const searching = false;
    const searchTerm = '';

    beforeEach(function () {
      dispatchStopFindSpy = sinon.spy();
      setSearchTermSpy = sinon.spy();
      toggleStatusSpy = sinon.spy();
      dispatchFindSpy = sinon.spy();

      render(
        <FindInPageInput
          dispatchStopFind={dispatchStopFindSpy}
          setSearchTerm={setSearchTermSpy}
          toggleStatus={toggleStatusSpy}
          dispatchFind={dispatchFindSpy}
          searchTerm={searchTerm}
          searching={searching}
        />
      );
    });

    afterEach(cleanup);

    it('should show navigation text', function () {
      expect(screen.getByText('Use (Shift+) Enter to navigate results.')).to.be
        .visible;
    });

    it('input should have empty value', function () {
      expect(screen.getByRole('textbox').getAttribute('value')).to.equal('');
    });

    it('should call to close the find when the close button is clicked', function () {
      expect(dispatchStopFindSpy.callCount).to.equal(0);

      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);

      expect(dispatchStopFindSpy.callCount).to.equal(1);
    });

    it('should call to set the search term when the input changes', function () {
      expect(setSearchTermSpy.callCount).to.equal(0);

      const textInputElement = screen.getByRole('textbox');
      fireEvent.click(textInputElement);
      userEvent.keyboard('8');

      expect(setSearchTermSpy.callCount).to.equal(1);
      expect(setSearchTermSpy.firstCall.args[0]).to.equal('8');
    });

    it('should call to close the find when escape is entered', function () {
      expect(setSearchTermSpy.callCount).to.equal(0);

      userEvent.keyboard('{Escape}');

      expect(dispatchStopFindSpy.callCount).to.equal(1);
    });

    it('should not call to dispatch find when enter is pressed (no search term)', function () {
      expect(dispatchFindSpy.callCount).to.equal(0);

      userEvent.keyboard('{enter}');

      expect(dispatchFindSpy.callCount).to.equal(0);
    });
  });

  describe('when the component is rendered and search term has a value', function () {
    let dispatchStopFindSpy: sinon.SinonSpy;
    let setSearchTermSpy: sinon.SinonSpy;
    let toggleStatusSpy: sinon.SinonSpy;
    let dispatchFindSpy: sinon.SinonSpy;
    const searching = false;
    const searchTerm = 'tomatoes';

    beforeEach(function () {
      dispatchStopFindSpy = sinon.spy();
      setSearchTermSpy = sinon.spy();
      toggleStatusSpy = sinon.spy();
      dispatchFindSpy = sinon.spy();

      render(
        <FindInPageInput
          dispatchStopFind={dispatchStopFindSpy}
          setSearchTerm={setSearchTermSpy}
          toggleStatus={toggleStatusSpy}
          dispatchFind={dispatchFindSpy}
          searchTerm={searchTerm}
          searching={searching}
        />
      );
    });

    afterEach(cleanup);

    it('input field should have search term as value', function () {
      expect(screen.getByRole('textbox').getAttribute('value')).to.equal(
        'tomatoes'
      );
    });

    it('should call to dispatch find the find when enter is pressed', function () {
      expect(dispatchFindSpy.callCount).to.equal(0);

      userEvent.keyboard('{enter}');

      expect(dispatchFindSpy.callCount).to.equal(1);
      expect(dispatchFindSpy.firstCall.args).to.deep.equal([
        'tomatoes',
        true,
        false,
      ]);
    });
  });
});
