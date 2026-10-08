import React from 'react';
import { expect } from 'chai';
import { render, screen } from '@mongodb-js/testing-library-compass';
import { CATALOGS } from './translations';
import { LanguageProvider, Translated, translate } from './index';

describe('i18n', function () {
  it('returns the English text when there is no translation', function () {
    expect(translate('de', 'does.not.exist', 'Fallback')).to.equal('Fallback');
    expect(translate('xx', 'settings.title', 'Settings')).to.equal('Settings');
  });

  it('returns the translation for the selected language', function () {
    expect(translate('de', 'settings.title', 'Settings')).to.equal(
      'Einstellungen'
    );
  });

  it('has the same keys in every language catalog', function () {
    const allKeys = new Set(Object.values(CATALOGS).flatMap(Object.keys));
    for (const [language, catalog] of Object.entries(CATALOGS)) {
      const missing = [...allKeys].filter((key) => !(key in catalog));
      expect(missing, `missing keys in "${language}"`).to.deep.equal([]);
    }
  });

  it('renders <Translated> in the language of the provider', function () {
    render(
      <LanguageProvider language="fr">
        <Translated id="settings.save">Save</Translated>
      </LanguageProvider>
    );
    expect(screen.getByText('Enregistrer')).to.exist;
  });
});
