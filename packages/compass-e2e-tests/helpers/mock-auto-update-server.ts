import path from 'path';
import express from 'express';

type AvailableUpdate =
  | {
      version: string;
      notes: string;
    }
  | undefined;

export function startAutoUpdateServer({
  expectedPlatform,
  expectedChannel,
  expectedVersion,
  newVersion,
  filename,
  mockedDistDir,
  newNotes,
  port,
}: {
  // the fake update will only apply to this exact platform
  expectedPlatform: string;
  // which channel the version applies to
  expectedChannel: 'dev' | 'beta' | 'stable';
  // the fake update will only apply to versions matching exactly this string
  expectedVersion: string;
  // the fake version number of what we'll allow updating to
  newVersion: string;
  // the of the (probably fake) file containing the new version
  filename: string;
  // where to read the file from
  mockedDistDir: string;
  // the release notes of the new version
  newNotes: string;
  // port number for the this fake update server we're starting
  port: number;
}) {
  const app = express();

  app.use((req, res, next) => {
    console.log(req.method, req.path);
    next();
  });

  const updatablePlatforms = [
    'linux-x64',
    'win32-x64',
    'darwin-x64',
    'darwin-arm64',
  ].join('|');

  // http://localhost:3000/api/v2/update/compass/dev/darwin-arm64/1.45.0/check
  app.get(
    `/api/v2/update/:distribution/:channel/:platform(${updatablePlatforms})/:version/check`,
    (req, res) => {
      const match = {
        route: 'check',
        params: req.params,
      };
      console.log(match);

      let availableUpdate: AvailableUpdate = undefined;

      if (
        req.params.channel === expectedChannel &&
        req.params.platform === expectedPlatform &&
        req.params.version === expectedVersion
      ) {
        availableUpdate = {
          version: newVersion,
          notes: newNotes,
        };
      }

      if (!availableUpdate) {
        console.log(
          'no update for',
          req.params.channel,
          req.params.platform,
          req.params.version
        );
        res.status(204).send();
        return;
      }

      const response = {
        name: availableUpdate.version,
        from: req.params.version,
        to: availableUpdate.version,
      };

      console.log('response:', response);
      res.json(response);
    }
  );

  // http://localhost:3000/api/v2/update/compass/dev/win32-x64/1.45.0/RELEASES
  app.get(
    '/api/v2/update/:distribution/:channel/:platform(windows|win32-x64)/:version/RELEASES',
    (req, res) => {
      const match = {
        route: 'windows-releases',
        params: req.params,
      };
      console.log(match);
      // TODO: implement this
      res.send(match);
    }
  );

  // http://localhost:3000/api/v2/update/compass/dev/win32-x64/1.45.0/something.nupkg
  app.get(
    '/api/v2/update/:distribution/:channel/:platform(windows|win32-x64)/:version/:nupkg',
    (req, res) => {
      const match = {
        route: 'windows-nupkg',
        params: req.params,
      };
      console.log(match);
      // TODO: implement this
      res.send(match);
    }
  );

  // http://localhost:3000/api/v2/update/compass/dev/darwin-arm64/1.45.0
  app.get(
    '/api/v2/update/:distribution/:channel/:platform(osx|darwin-x64|darwin-arm64)/:version',
    (req, res) => {
      const match = {
        route: 'mac-version',
        params: req.params,
      };
      console.log(match);
      //res.send(match);

      let availableUpdate: AvailableUpdate = undefined;

      if (
        req.params.channel === expectedChannel &&
        req.params.platform === expectedPlatform &&
        req.params.version === expectedVersion
      ) {
        availableUpdate = {
          version: newVersion,
          notes: newNotes,
        };
      }

      if (!availableUpdate) {
        console.log(
          'no update for',
          req.params.channel,
          req.params.platform,
          req.params.version
        );
        res.status(204).send();
        return;
      }

      const response = {
        url: `http://localhost:${port}/download/${filename}`,
        name: availableUpdate.version,
        notes: availableUpdate.notes || '',
        from: req.params.version,
        to: availableUpdate.version,
      };

      console.log('response:', response);
      res.json(response);
    }
  );

  // Usually the update file would be on S3 somewhere. We're not uploading the
  // mocked compass anywhere on the internet, we're serving it ourselves. So
  // this server just tells Compass to download the new update from here.
  app.get('/download/:filename', (req, res) => {
    const match = {
      route: 'fake-download',
      params: req.params,
    };
    console.log(match);

    if (req.params.filename !== filename) {
      console.log('filename does not match', req.params.filename, filename);
      res.status(404).send();
      return;
    }

    res.sendFile(path.join(mockedDistDir, filename));
  });

  // fallback to 404 for anything unknown, with some debugging
  app.get('/*', (req, res) => {
    res.status(404).send(req.path);
  });

  const server = app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });

  return { server, app };
}

/*
const { server } = start({
  expectedPlatform: 'darwin-arm64',
  expectedVersion: '0.0.1-dev.0',
  newVersion: '1.46.0',
  newURL: 'TODO',
  newNotes: 'release notes go here',
  port: 3000,
});
*/
