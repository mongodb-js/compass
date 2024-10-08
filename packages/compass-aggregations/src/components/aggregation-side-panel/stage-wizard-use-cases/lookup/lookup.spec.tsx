import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { LookupForm } from './lookup';
import sinon from 'sinon';
import {
  setComboboxValue,
  openComboBox,
  setInputElementValueByTestId,
} from '../../../../../test/form-helper';
import type { StageWizardFields } from '..';

const SAMPLE_FIELDS: StageWizardFields = [
  {
    name: 'address',
    type: 'String',
  },
  {
    name: 'city_id',
    type: 'String',
  },
];

const renderLookupForm = (
  props: Partial<ComponentProps<typeof LookupForm>> = {}
) => {
  return render(
    <LookupForm
      fields={SAMPLE_FIELDS}
      collectionsFields={{}}
      onSelectCollection={() => {}}
      onChange={() => {}}
      {...props}
    />
  );
};

describe('lookup', function () {
  it('renders the form', function () {
    renderLookupForm();
    expect(
      screen.getByRole('textbox', {
        name: /select collection/i,
      })
    ).to.exist;
    expect(
      screen.getByRole('textbox', {
        name: /select foreign field/i,
      })
    ).to.exist;
    expect(
      screen.getByRole('textbox', {
        name: /select local field/i,
      })
    ).to.exist;
    expect(
      screen.getByRole('textbox', {
        name: /name of the array/i,
      })
    ).to.exist;
  });

  it('sets the collection', function () {
    const onChange = sinon.spy();
    renderLookupForm({
      collectionsFields: {
        test: {
          fields: ['street', 'city', 'zip'],
          isLoading: false,
          type: 'collection',
        },
      },
      onChange: onChange,
    });
    setComboboxValue(/select collection/i, 'test');

    const [value, error] = onChange.lastCall.args;
    expect(JSON.parse(value)).to.deep.equal({
      from: 'test',
      foreignField: '',
      localField: '',
      as: 'test',
    });
    expect(error).to.not.be.null;
  });

  it('sets the foreign field', function () {
    const onChange = sinon.spy();
    renderLookupForm({
      collectionsFields: {
        test: {
          fields: ['street', 'city', 'zip'],
          isLoading: false,
          type: 'collection',
        },
      },
      onChange: onChange,
    });
    setComboboxValue(/select collection/i, 'test');
    setComboboxValue(/select foreign field/i, 'street');
    const [value, error] = onChange.lastCall.args;
    expect(JSON.parse(value)).to.deep.equal({
      from: 'test',
      foreignField: 'street',
      localField: '',
      as: 'test',
    });
    expect(error).to.not.be.null;
  });

  it('sets the local field', function () {
    const onChange = sinon.spy();
    renderLookupForm({
      onChange: onChange,
    });
    setComboboxValue(/select local field/i, 'address');
    const [value, error] = onChange.lastCall.args;
    expect(JSON.parse(value)).to.deep.equal({
      from: '',
      foreignField: '',
      localField: 'address',
      as: '',
    });
    expect(error).to.not.be.null;
  });

  it('sets the as', function () {
    const onChange = sinon.spy();
    renderLookupForm({
      onChange: onChange,
    });
    setInputElementValueByTestId('name-of-the-array-input', 'data');
    const [value, error] = onChange.lastCall.args;
    expect(JSON.parse(value)).to.deep.equal({
      from: '',
      foreignField: '',
      localField: '',
      as: 'data',
    });
    expect(error).to.not.be.null;
  });

  it('sets all the form values', function () {
    const onChange = sinon.spy();
    renderLookupForm({
      collectionsFields: {
        test: {
          fields: ['street', 'city', 'zip'],
          isLoading: false,
          type: 'collection',
        },
      },
      onChange: onChange,
    });
    setComboboxValue(/select collection/i, 'test');
    setComboboxValue(/select foreign field/i, 'street');
    setComboboxValue(/select local field/i, 'address');
    setInputElementValueByTestId('name-of-the-array-input', 'data');
    const [value, error] = onChange.lastCall.args;
    expect(JSON.parse(value)).to.deep.equal({
      from: 'test',
      foreignField: 'street',
      localField: 'address',
      as: 'data',
    });
    expect(error).to.be.null;
  });

  context('when handling collections and foreign fields', function () {
    it('calls onSelectCollection when collection is selected', function () {
      const onSelectCollection = sinon.spy();
      renderLookupForm({
        collectionsFields: {
          test: {
            fields: [],
            isLoading: false,
            type: 'collection',
          },
        },
        onSelectCollection: onSelectCollection,
      });
      setComboboxValue(/select collection/i, 'test');
      expect(onSelectCollection.calledOnceWith('test')).to.be.true;
    });

    it('renders foreign fields when collection is selected', function () {
      renderLookupForm({
        collectionsFields: {
          test: {
            fields: ['street', 'city', 'zip'],
            isLoading: false,
            type: 'collection',
          },
        },
      });
      setComboboxValue(/select collection/i, 'test');
      openComboBox(/select foreign field/i);
      expect(screen.getByText('street')).to.exist;
      expect(screen.getByText('city')).to.exist;
      expect(screen.getByText('zip')).to.exist;
    });

    it('renders loading when collection is selected and fields are loading', function () {
      renderLookupForm({
        collectionsFields: {
          test: {
            fields: [],
            isLoading: true,
            type: 'collection',
          },
        },
      });
      setComboboxValue(/select collection/i, 'test');
      openComboBox(/select foreign field/i);
      expect(screen.getByText('Fetching fields ...')).to.exist;
    });

    it('renders text to select collection first if foreign field combobox is opened', function () {
      renderLookupForm();
      openComboBox(/select foreign field/i);
      expect(screen.getByText('Select a collection first.')).to.exist;
    });

    it('renders error if fails to fetch fields', function () {
      renderLookupForm({
        collectionsFields: {
          test: {
            fields: [],
            isLoading: false,
            type: 'collection',
            error: new Error(),
          },
        },
      });
      setComboboxValue(/select collection/i, 'test');
      openComboBox(/select foreign field/i);
      expect(
        screen.getByText(
          'Failed to fetch the fields. Type the field name manually.'
        )
      ).to.exist;
    });
  });
});
