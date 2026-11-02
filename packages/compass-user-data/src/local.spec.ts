import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { expect } from 'chai';
import { z, ZodError } from 'zod';
import { createLocalUserDataFetch, createLocalUserDataHandler } from './local';
import {
  FileUserData,
  LOCAL_USER_DATA_BASE_URL,
  UserData,
  UserDataRequestError,
  createUserDataFetch,
} from './user-data';

const schema = z.object({
  name: z.string(),
  count: z.number().default(0),
});

const id = '9f8b2c3e-1d4a-4b5c-8e6f-7a8b9c0d1e2f';
const url = (...segments: string[]) =>
  [LOCAL_USER_DATA_BASE_URL, ...segments].join('/');
const body = (data: string) =>
  JSON.stringify({ data, createdAt: new Date().toISOString() });

describe('createLocalUserDataHandler', function () {
  let basePath: string;
  let handle: ReturnType<typeof createLocalUserDataHandler>;

  beforeEach(async function () {
    basePath = await fs.mkdtemp(path.join(os.tmpdir(), 'local-user-data'));
    handle = createLocalUserDataHandler({ basePath });
  });

  afterEach(async function () {
    await fs.rm(basePath, { recursive: true });
  });

  // The routes, statuses and response shapes below are the Atlas user-data
  // service's (mms systems/data-explorer/user-data/src/resource.mts)

  it('lists nothing for a type that was never written', async function () {
    const response = await handle({ method: 'GET', url: url('RecentQueries') });

    expect(response).to.deep.equal({ status: 200, body: '[]' });
  });

  it('stores the serialized data as the document file', async function () {
    const response = await handle({
      method: 'PUT',
      url: url('RecentQueries', id),
      body: body('{"name":"a"}'),
    });

    expect(response).to.deep.equal({ status: 200, body: '' });
    expect(
      await fs.readFile(
        path.join(basePath, 'RecentQueries', `${id}.json`),
        'utf-8'
      )
    ).to.equal('{"name":"a"}');
  });

  it('returns a document in the shape the service returns', async function () {
    await handle({
      method: 'PUT',
      url: url('RecentQueries', id),
      body: body('{"name":"a"}'),
    });

    const response = await handle({
      method: 'GET',
      url: url('RecentQueries', id),
    });

    expect(response.status).to.equal(200);
    const doc = JSON.parse(response.body) as Record<string, string>;
    expect(doc).to.have.keys('_id', 'data', 'createdAt');
    expect(doc).to.include({ _id: id, data: '{"name":"a"}' });
    expect(Number.isNaN(Date.parse(doc.createdAt))).to.equal(false);
  });

  it('lists every document of a type', async function () {
    const other = '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
    await handle({
      method: 'PUT',
      url: url('SavedPipelines', id),
      body: body('1'),
    });
    await handle({
      method: 'PUT',
      url: url('SavedPipelines', other),
      body: body('2'),
    });

    const response = await handle({
      method: 'GET',
      url: url('SavedPipelines'),
    });

    const docs = JSON.parse(response.body) as { _id: string; data: string }[];
    expect(
      docs
        .map(({ _id, data }) => ({ _id, data }))
        .sort((a, b) => a.data.localeCompare(b.data))
    ).to.deep.equal([
      { _id: id, data: '1' },
      { _id: other, data: '2' },
    ]);
  });

  it('skips entries in a type folder that are not readable documents', async function () {
    await handle({
      method: 'PUT',
      url: url('SavedPipelines', id),
      body: body('1'),
    });
    await fs.writeFile(path.join(basePath, 'SavedPipelines', 'notes.txt'), 'x');
    await fs.mkdir(path.join(basePath, 'SavedPipelines', 'folder.json'));

    const response = await handle({
      method: 'GET',
      url: url('SavedPipelines'),
    });

    expect(JSON.parse(response.body)).to.have.lengthOf(1);
  });

  it('responds 404 for a document that does not exist', async function () {
    const response = await handle({
      method: 'GET',
      url: url('RecentQueries', id),
    });

    expect(response).to.deep.equal({
      status: 404,
      body: '{"error":"Not Found"}',
    });
  });

  it('deletes a document', async function () {
    await handle({
      method: 'PUT',
      url: url('RecentQueries', id),
      body: body('1'),
    });

    const response = await handle({
      method: 'DELETE',
      url: url('RecentQueries', id),
    });

    expect(response.status).to.equal(204);
    expect(
      (await handle({ method: 'GET', url: url('RecentQueries', id) })).status
    ).to.equal(404);
  });

  it('responds 204 when deleting a document that does not exist', async function () {
    const response = await handle({
      method: 'DELETE',
      url: url('RecentQueries', id),
    });

    expect(response.status).to.equal(204);
  });

  it('rejects a write without string data', async function () {
    const response = await handle({
      method: 'PUT',
      url: url('RecentQueries', id),
      body: JSON.stringify({ data: { name: 'a' } }),
    });

    expect(response).to.deep.equal({
      status: 400,
      body: '{"error":"Bad Request"}',
    });
  });

  it('rejects an id that would leave the type folder', async function () {
    const response = await handle({
      method: 'PUT',
      url: url('RecentQueries', encodeURIComponent('../Connections/x')),
      body: body('1'),
    });

    expect(response.status).to.equal(400);
    expect(await fs.readdir(basePath)).to.deep.equal([]);
  });

  it('responds 404 for routes the service does not have', async function () {
    const responses = await Promise.all(
      [
        url('NotAType'),
        url('RecentQueries', id, 'extra'),
        'https://example.com/RecentQueries',
      ].map((routeUrl) => handle({ method: 'GET', url: routeUrl }))
    );

    expect(responses.map(({ status }) => status)).to.deep.equal([
      404, 404, 404,
    ]);
  });

  it('keeps user-scoped data in the General file at the type route', async function () {
    await handle({
      method: 'PUT',
      url: url('AppPreferences'),
      body: body('{"a":1}'),
    });

    expect(
      await fs.readFile(
        path.join(basePath, 'AppPreferences', 'General.json'),
        'utf-8'
      )
    ).to.equal('{"a":1}');
    const response = await handle({
      method: 'GET',
      url: url('AppPreferences'),
    });
    expect(JSON.parse(response.body)).to.include({
      _id: 'General',
      data: '{"a":1}',
    });
  });

  it('serves user-scoped data only with GET and PUT at the type route', async function () {
    const responses = await Promise.all([
      handle({ method: 'DELETE', url: url('AppPreferences') }),
      handle({ method: 'GET', url: url('AppPreferences', 'General') }),
    ]);

    expect(responses.map(({ status }) => status)).to.deep.equal([405, 404]);
  });

  it('reads documents FileUserData wrote', async function () {
    await new FileUserData(schema, 'FavoriteQueries', { basePath }).write(id, {
      name: 'saved before',
    });

    const response = await handle({
      method: 'GET',
      url: url('FavoriteQueries', id),
    });

    const { data } = JSON.parse(response.body) as { data: string };
    expect(JSON.parse(data)).to.deep.equal({
      name: 'saved before',
    });
  });
});

describe('UserData with a local environment', function () {
  let basePath: string;
  let userData: UserData<typeof schema, 'FavoriteQueries'>;

  beforeEach(async function () {
    basePath = await fs.mkdtemp(path.join(os.tmpdir(), 'local-user-data'));
    userData = new UserData(schema, 'FavoriteQueries', {
      kind: 'local',
      fetch: createLocalUserDataFetch({ basePath }),
    });
  });

  afterEach(async function () {
    await fs.rm(basePath, { recursive: true });
  });

  it('reads back what it writes', async function () {
    expect(await userData.write(id, { name: 'a' })).to.equal(true);

    expect(await userData.readOne(id)).to.deep.equal({ name: 'a', count: 0 });
    expect(await userData.readAll()).to.deep.equal({
      data: [{ name: 'a', count: 0 }],
      errors: [],
    });
  });

  it('merges attributes into the stored document', async function () {
    await userData.write(id, { name: 'a', count: 1 });

    expect(await userData.updateAttributes(id, { count: 2 })).to.equal(true);

    expect(await userData.readOne(id)).to.deep.equal({ name: 'a', count: 2 });
  });

  it('removes a deleted document', async function () {
    await userData.write(id, { name: 'a' });

    expect(await userData.delete(id)).to.equal(true);

    expect(await userData.readAll()).to.deep.equal({ data: [], errors: [] });
  });

  it('reads a missing document as undefined even when errors are not ignored', async function () {
    expect(await userData.readOne(id, { ignoreErrors: false })).to.equal(
      undefined
    );
  });

  it('throws for an invalid document when errors are not ignored', async function () {
    await fs.mkdir(path.join(basePath, 'FavoriteQueries'));
    await fs.writeFile(
      path.join(basePath, 'FavoriteQueries', `${id}.json`),
      '{"name":1}'
    );

    const error = await userData
      .readOne(id, { ignoreErrors: false })
      .catch((err: unknown) => err);

    expect(error).to.be.instanceOf(ZodError);
  });

  it('reports each invalid document when reading all', async function () {
    await userData.write(id, { name: 'a' });
    await fs.writeFile(
      path.join(basePath, 'FavoriteQueries', 'broken.json'),
      '{'
    );

    const { data, errors } = await userData.readAll();

    expect(data).to.deep.equal([{ name: 'a', count: 0 }]);
    expect(errors).to.have.lengthOf(1);
    expect(errors[0]).to.be.instanceOf(SyntaxError);
  });

  it('reads unset user-scoped data as undefined', async function () {
    const preferences = new UserData(schema, 'AppPreferences', {
      kind: 'local',
      fetch: createLocalUserDataFetch({ basePath }),
    });

    expect(await preferences.readOne({ ignoreErrors: false })).to.equal(
      undefined
    );
    expect(await preferences.write({ name: 'prefs' })).to.equal(true);
    expect(await preferences.readOne()).to.deep.equal({
      name: 'prefs',
      count: 0,
    });
  });
});

describe('createUserDataFetch', function () {
  it('throws the status of an error response', async function () {
    const fetch = createUserDataFetch(() =>
      Promise.resolve({ status: 404, body: '{"error":"Not Found"}' })
    );

    const error = await fetch(url('RecentQueries', id)).catch(
      (err: unknown) => err
    );

    expect(error)
      .to.be.instanceOf(UserDataRequestError)
      .with.property('statusCode', 404);
  });

  it('sends the method, url and body as plain data', async function () {
    const requests: unknown[] = [];
    const fetch = createUserDataFetch((request) => {
      requests.push(request);
      return Promise.resolve({ status: 204, body: '' });
    });

    const response = await fetch(url('RecentQueries', id), {
      method: 'PUT',
      body: '{}',
    });

    expect(response.status).to.equal(204);
    expect(requests).to.deep.equal([
      { method: 'PUT', url: url('RecentQueries', id), body: '{}' },
    ]);
  });
});
