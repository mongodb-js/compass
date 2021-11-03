import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';

import Connections from './connections';

// const mockRecents: ConnectionInfo[] = [];
// for (let i = 0; i < 15; i++) {
//   mockRecents.push({
//     id: `mock-connection-${i}`,
//     connectionOptions: {
//       connectionString: `mongodb://localhost:2${
//         5000 + Math.floor(Math.random() * 5000)
//       }`,
//     },
//     lastUsed: new Date(Date.now() - (Date.now() / 2) * Math.random()),
//   });
// }

// const mockConnections = [
//   {
//     id: 'mock-connection-dev',
//     connectionOptions: {
//       connectionString: '',
//     },
//     favorite: {
//       name: 'Development cluster',
//       color: '#deb342',
//     },
//     lastUsed: new Date(),
//   },
//   {
//     id: 'mock-connection-atlas',
//     connectionOptions: {
//       connectionString:
//         'mongodb+srv://testUserForTesting:notMyRealPassword@test.mongodb.net/test?authSource=admin&replicaSet=art-dev-shard-0&readPreference=primary&ssl=true',
//     },
//     favorite: {
//       name: 'Atlas test',
//       color: '#d4366e',
//     },
//     lastUsed: new Date(),
//   },
//   {
//     id: 'mock-connection-empty-connection',
//     connectionOptions: {
//       connectionString: '',
//     },
//     favorite: {
//       name: 'super long favorite name - super long favorite name - super long favorite name - super long favorite name',
//       color: '#5fc86e',
//     },
//     lastUsed: new Date(),
//   },
//   {
//     id: 'mock-connection-invalid string',
//     connectionOptions: {
//       connectionString: 'invalid connection string',
//     },
//     lastUsed: new Date(),
//   },
//   ...mockRecents,
// ];

describe('Connections Component', function () {
  describe('when rendered', function () {
    beforeEach(function () {
      render(<Connections />);
    });

    it('renders the connect button from the connect-form', function () {
      const button = screen.queryByText('Connect').closest('button');
      expect(button).to.not.equal(null);
    });

    it('renders atlas cta button', function () {
      const button = screen.getByTestId('atlas-cta-link');
      expect(button.getAttribute('href')).to.equal(
        'https://www.mongodb.com/cloud/atlas/lp/general/try?utm_source=compass&utm_medium=product'
      );
    });
  });
});
