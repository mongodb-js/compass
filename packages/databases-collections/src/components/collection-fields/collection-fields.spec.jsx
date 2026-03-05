import React from 'react';
import {
  render,
  screen,
  cleanup,
  userEvent,
  within,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';

import CollectionFields from '.';

describe('CollectionFields [Component]', function () {
  afterEach(function () {
    cleanup();
  });

  context('when withDatabase prop is true', function () {
    it('renders a database name input field', function () {
      render(
        <CollectionFields
          onChange={() => {}}
          withDatabase
          serverVersion="5.0"
        />
      );
      expect(screen.getByRole('textbox', { name: /Database Name/i })).to.exist;
    });
  });

  context('when withDatabase prop is false', function () {
    it('does not render a database name input field', function () {
      render(<CollectionFields onChange={() => {}} serverVersion="5.0" />);
      expect(
        screen.queryByRole('textbox', { name: /Database Name/i })
      ).to.not.exist;
    });
  });

  context('with server version >= 5.3', function () {
    describe('when the clustered collection checkbox is clicked', function () {
      it('calls the onchange with clustered collection on', function () {
        const onChangeSpy = sinon.spy();
        render(
          <CollectionFields
            onChange={onChangeSpy}
            withDatabase
            serverVersion="5.3"
          />
        );

        // Open additional preferences accordion
        const accordionButton = screen.getByText('Additional preferences');
        userEvent.click(accordionButton, undefined, {
          skipPointerEventsCheck: true,
        });

        // Click the clustered collection checkbox
        const clusteredCheckbox = screen.getByRole('checkbox', {
          name: /Clustered Collection/i,
        });
        userEvent.click(clusteredCheckbox, undefined, {
          skipPointerEventsCheck: true,
        });

        expect(onChangeSpy.callCount).to.equal(1);
        expect(onChangeSpy.firstCall.args[0]).to.deep.equal({
          database: '',
          collection: '',
          options: {
            clusteredIndex: {
              key: { _id: 1 },
              unique: true,
            },
          },
        });
      });

      it('calls the onchange with clustered collection off when clicked twice', function () {
        const onChangeSpy = sinon.spy();
        render(
          <CollectionFields
            onChange={onChangeSpy}
            withDatabase
            serverVersion="5.3"
          />
        );

        // Open additional preferences accordion
        const accordionButton = screen.getByText('Additional preferences');
        userEvent.click(accordionButton, undefined, {
          skipPointerEventsCheck: true,
        });

        const clusteredCheckbox = screen.getByRole('checkbox', {
          name: /Clustered Collection/i,
        });

        // Click to enable
        userEvent.click(clusteredCheckbox, undefined, {
          skipPointerEventsCheck: true,
        });

        // Click to disable
        userEvent.click(clusteredCheckbox, undefined, {
          skipPointerEventsCheck: true,
        });

        expect(onChangeSpy.callCount).to.equal(2);
        expect(onChangeSpy.secondCall.args[0]).to.deep.equal({
          database: '',
          collection: '',
          options: {},
        });
      });
    });
  });

  context('with server version >= 5.0', function () {
    it('shows time series options', function () {
      render(
        <CollectionFields
          onChange={() => {}}
          withDatabase
          serverVersion="5.0"
        />
      );
      expect(screen.getByRole('checkbox', { name: /Time-Series/i })).to.exist;
    });

    describe('when the time series checkbox is clicked', function () {
      it('calls the onchange with time series collection on', function () {
        const onChangeSpy = sinon.spy();
        render(
          <CollectionFields
            onChange={onChangeSpy}
            withDatabase
            serverVersion="5.0"
          />
        );

        const timeSeriesCheckbox = screen.getByRole('checkbox', {
          name: /Time-Series/i,
        });
        userEvent.click(timeSeriesCheckbox, undefined, {
          skipPointerEventsCheck: true,
        });

        expect(onChangeSpy.callCount).to.equal(1);
        expect(onChangeSpy.firstCall.args[0]).to.deep.equal({
          database: '',
          collection: '',
          options: {
            timeseries: {},
          },
        });
      });
    });
  });

  context('with server version < 5.0', function () {
    it('does not show time series options', function () {
      render(
        <CollectionFields
          onChange={() => {}}
          withDatabase
          serverVersion="4.3.0"
        />
      );
      expect(
        screen.queryByRole('checkbox', { name: /Time-Series/i })
      ).to.not.exist;
    });
  });

  context(
    'when rendered and the advanced collection options are opened',
    function () {
      describe('when the collation checkbox is clicked', function () {
        it('calls the onchange with collation', function () {
          const onChangeSpy = sinon.spy();
          render(
            <CollectionFields onChange={onChangeSpy} serverVersion="4.3.0" />
          );

          // Open additional preferences accordion
          const accordionButton = screen.getByText('Additional preferences');
          userEvent.click(accordionButton, undefined, {
            skipPointerEventsCheck: true,
          });

          // Click the collation checkbox
          const collationCheckbox = screen.getByRole('checkbox', {
            name: /Use Custom Collation/i,
          });
          userEvent.click(collationCheckbox, undefined, {
            skipPointerEventsCheck: true,
          });

          expect(onChangeSpy.callCount).to.equal(1);
          expect(onChangeSpy.firstCall.args[0]).to.deep.equal({
            database: '',
            collection: '',
            options: {
              collation: {},
            },
          });
        });
      });

      describe('when the collation checkbox is clicked and a locale chosen', function () {
        it('calls the onchange with collation locale set', function () {
          const onChangeSpy = sinon.spy();
          render(
            <CollectionFields onChange={onChangeSpy} serverVersion="4.3.0" />
          );

          // Open additional preferences accordion
          const accordionButton = screen.getByText('Additional preferences');
          userEvent.click(accordionButton, undefined, {
            skipPointerEventsCheck: true,
          });

          // Click the collation checkbox
          const collationCheckbox = screen.getByRole('checkbox', {
            name: /Use Custom Collation/i,
          });
          userEvent.click(collationCheckbox, undefined, {
            skipPointerEventsCheck: true,
          });

          // Click the locale dropdown and select 'af - Afrikaans'
          const localeButton = screen.getByRole('button', { name: /locale/i });
          userEvent.click(localeButton, undefined, {
            skipPointerEventsCheck: true,
          });

          const listbox = screen.getByRole('listbox');
          const afOption = within(listbox).getByText('af - Afrikaans');
          userEvent.click(afOption, undefined, {
            skipPointerEventsCheck: true,
          });

          expect(onChangeSpy.callCount).to.equal(2);
          expect(onChangeSpy.secondCall.args[0]).to.deep.equal({
            database: '',
            collection: '',
            options: {
              collation: {
                locale: 'af',
              },
            },
          });
        });
      });
    }
  );
});
