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

  it('sets the collection', async function () {
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
    await setComboboxValue(/select collection/i, 'test');

    const [value, error] = onChange.lastCall.args;
    expect(JSON.parse(value)).to.deep.equal({
      from: 'test',
      foreignField: '',
      localField: '',
      as: 'test',
    });
    expect(error).to.not.be.null;
  });

  it('sets the foreign field', async function () {
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
    await setComboboxValue(/select collection/i, 'test');
    await setComboboxValue(/select foreign field/i, 'street');
    const [value, error] = onChange.lastCall.args;
    expect(JSON.parse(value)).to.deep.equal({
      from: 'test',
      foreignField: 'street',
      localField: '',
      as: 'test',
    });
    expect(error).to.not.be.null;
  });

  it('sets the local field', async function () {
    const onChange = sinon.spy();
    renderLookupForm({
      onChange: onChange,
    });
    await setComboboxValue(/select local field/i, 'address');
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

  it('sets all the form values', async function () {
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
    await setComboboxValue(/select collection/i, 'test');
    await setComboboxValue(/select foreign field/i, 'street');
    await setComboboxValue(/select local field/i, 'address');
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
    it('calls onSelectCollection when collection is selected', async function () {
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
      await setComboboxValue(/select collection/i, 'test');
      expect(onSelectCollection.calledOnceWith('test')).to.be.true;
    });

    it('renders foreign fields when collection is selected', async function () {
      renderLookupForm({
        collectionsFields: {
          test: {
            fields: ['street', 'city', 'zip'],
            isLoading: false,
            type: 'collection',
          },
        },
      });
      await setComboboxValue(/select collection/i, 'test');
      await openComboBox(/select foreign field/i);
      expect(screen.getByText('street')).to.exist;
      expect(screen.getByText('city')).to.exist;
      expect(screen.getByText('zip')).to.exist;
    });

    it('renders loading when collection is selected and fields are loading', async function () {
      renderLookupForm({
        collectionsFields: {
          test: {
            fields: [],
            isLoading: true,
            type: 'collection',
          },
        },
      });
      await setComboboxValue(/select collection/i, 'test');
      await openComboBox(/select foreign field/i);
      expect(screen.getByText('Fetching fields ...')).to.exist;
    });

    it('renders text to select collection first if foreign field combobox is opened', async function () {
      renderLookupForm();
      await openComboBox(/select foreign field/i);
      expect(screen.getByText('Select a collection first.')).to.exist;
    });

    it('renders error if fails to fetch fields', async function () {
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
      await setComboboxValue(/select collection/i, 'test');
      await openComboBox(/select foreign field/i);
      expect(
        screen.getByText(
          'Failed to fetch the fields. Type the field name manually.'
        )
      ).to.exist;
    });
  });
});
