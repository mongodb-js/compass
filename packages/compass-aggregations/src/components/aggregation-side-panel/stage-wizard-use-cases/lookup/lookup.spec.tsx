import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { LookupForm } from './lookup';
import sinon from 'sinon';

const renderLookupForm = (
  props: Partial<ComponentProps<typeof LookupForm>> = {}
) => {
  return render(
    <LookupForm
      fields={['address', 'city_id']}
      collectionsFields={{}}
      onSelectCollection={() => {}}
      onChange={() => {}}
      {...props}
    />
  );
};

const openComboBox = (name: RegExp) => {
  const combobox = screen.getByRole('textbox', {
    name,
  });
  combobox.click();
  return combobox;
};

const setComboboxValue = (name: RegExp, value: string) => {
  const combobox = openComboBox(name);
  userEvent.click(combobox);
  const menuId = `#${combobox.getAttribute('aria-controls')}`;
  userEvent.click(
    within(document.querySelector(menuId)!).getByText(new RegExp(value, 'i')),
    undefined,
    {
      skipPointerEventsCheck: true,
    }
  );
};

const setInputElementValue = (name: RegExp, value: string) => {
  const input = screen.getByRole('textbox', {
    name,
  });
  userEvent.clear(input);
  userEvent.type(input, value);
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
    setInputElementValue(/name of the array/i, 'data');
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
    setInputElementValue(/name of the array/i, 'data');
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
            error: new Error('Failed to fetch fields'),
          },
        },
      });
      setComboboxValue(/select collection/i, 'test');
      openComboBox(/select foreign field/i);
      expect(screen.getByText('Failed to fetch fields')).to.exist;
    });
  });
});
