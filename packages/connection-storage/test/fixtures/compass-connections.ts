// These connections have been encrypted with *password* passphrase.
// The password of these connections is *password*
// Exported on Compass 1.40.4
export const connectionsWithEncryptedSecrets = {
  type: 'Compass Connections',
  version: {
    $numberInt: '1',
  },
  connections: [
    {
      id: '30bc83dd-a988-4553-b379-89fac70f3f5a',
      favorite: {
        name: 'Compass 1.39.3',
        color: 'color6',
      },
      connectionOptions: {
        connectionString:
          'mongodb://compass1393@localhost:27017/?authMechanism=DEFAULT',
      },
      connectionSecrets:
        'AAFSEEDlKaJFiXzDE1UFQ9/iokaH3j1t7TOCXUsy6sG+yxASG2WOfTP8rbg0g5XqrOcm6D+IpTni5QxpTXChGkrwngRVOWwmGmHkAItGNlZaR0AGaw==',
    },
    {
      id: '5231cafe-b280-43ac-977b-f95619fb0892',
      favorite: {
        name: 'Compass 1.39.0',
        color: 'color3',
      },
      connectionOptions: {
        connectionString:
          'mongodb://compass1390@localhost:27017/?authMechanism=DEFAULT',
      },
      connectionSecrets:
        'AAFj3cDh/I7e17O0rMczLJBqzNaSHBwbhlzPCek+G43M5H61EOLXGcvMUZpMr+0CYYWl5xSFBaWOX+qCDZDYCsd3Md+HL32F4o78QZDd5XeXA2fjFw==',
    },
    {
      id: '594f1301-30db-4b4b-a341-432bb915cc0b',
      favorite: {
        name: 'Compass 1.38.2',
        color: 'color10',
      },
      connectionOptions: {
        connectionString:
          'mongodb://compass1382@localhost:27017/?authMechanism=DEFAULT',
      },
      connectionSecrets:
        'AAEqe3aNaVhTg+90sm2ESKElVyFDwAoRiXu6D2C+Saelo4jDAqwzH+jOQqmwF0CTLDBjsnKjlKJKxfrzhakgZxy6LgyxGUmM/yrICy/eUjIL75oJOA==',
    },
    {
      id: '9005e859-cf99-4b29-8837-ca9d4bf3b8bf',
      favorite: {
        name: 'Compass 1.39.2',
        color: 'color6',
      },
      connectionOptions: {
        connectionString:
          'mongodb://compass1392@localhost:27017/?authMechanism=DEFAULT',
      },
      connectionSecrets:
        'AAHK7dlGMo8VUT8owt7rbtOhaevPP2ArrAkg+5WablYAAcMQFrxDlFUAambct6uolnpVhTEzfQED2kM5tdmgj8wQiuM0yFvmHNPIU3x/ukZthDJWfA==',
    },
  ],
} as const;

// Exported on Compass 1.40.4
export const connectionsWithPlainSecrets = {
  type: 'Compass Connections',
  version: {
    $numberInt: '1',
  },
  connections: [
    {
      id: '3985f01b-417a-448c-91f5-6b04303a26be',
      favorite: {
        name: 'Compass 1.36.4',
        color: 'color5',
      },
      connectionOptions: {
        connectionString:
          'mongodb://compass1364:password@localhost:27017/?authMechanism=DEFAULT',
      },
    },
    {
      id: '5231cafe-b280-43ac-977b-f95619fb0892',
      favorite: {
        name: 'Compass 1.39.0',
        color: 'color3',
      },
      connectionOptions: {
        connectionString:
          'mongodb://compass1390:password@localhost:27017/?authMechanism=DEFAULT',
      },
    },
    {
      id: '594f1301-30db-4b4b-a341-432bb915cc0b',
      favorite: {
        name: 'Compass 1.38.2',
        color: 'color10',
      },
      connectionOptions: {
        connectionString:
          'mongodb://compass1382:password@localhost:27017/?authMechanism=DEFAULT',
      },
    },
  ],
} as const;
