import AppRegistry from 'hadron-app-registry';
import { expect } from 'chai';
import sinon from 'sinon';

import { exportToLanguage } from './export-to-language';
import configureStore from '../stores';

const mockQueryBarStore = {
  filterString: '',
  projectString: '',
  sortString: '',
  collationString: '',
  skipString: '',
  limitString: '',
  maxTimeMSString: '',
};

describe('exportToLanguage', function () {
  it('emits an export to language app registry event', function () {
    const globalAppRegistry = new AppRegistry();
    const localAppRegistry = new AppRegistry();
    const globalAppRegistrySpy = sinon.spy();
    const localAppRegistrySpy = sinon.spy();
    sinon.replace(globalAppRegistry, 'emit', globalAppRegistrySpy);
    sinon.replace(localAppRegistry, 'emit', localAppRegistrySpy);

    const store = configureStore({
      localAppRegistry,
      globalAppRegistry,
    });

    expect(globalAppRegistrySpy.called).to.be.false;
    expect(localAppRegistrySpy.called).to.be.false;

    // js import that requires assertion
    (store as any).dispatch(exportToLanguage(mockQueryBarStore));

    expect(globalAppRegistrySpy.calledOnce).to.be.true;
    expect(localAppRegistrySpy.calledOnce).to.be.true;

    expect(localAppRegistrySpy.firstCall.args[0]).to.equal(
      'open-query-export-to-language'
    );
    expect(localAppRegistrySpy.firstCall.args[1]).to.deep.equal({
      filter: '',
      project: '',
      sort: '',
      collation: '',
      skip: '',
      limit: '',
      maxTimeMS: '',
    });

    expect(globalAppRegistrySpy.firstCall.args[0]).to.equal(
      'compass:export-to-language:opened'
    );
    expect(globalAppRegistrySpy.firstCall.args[1]).to.deep.equal({
      source: 'Explain',
    });
  });
});
