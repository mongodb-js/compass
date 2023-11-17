# hadron-build

> Complete tooling for large-scale [Electron](http://electron.atom.io/) apps.

## Background

> Why does this exist? How did it come to be?

## Commands

```bash
npm install --save-dev hadron-build;
```

### `hadron-build verify`

### `hadron-build info`

### `hadron-build develop`

### `hadron-build clean`

### `hadron-build release`

### `hadron-build upload`

### `hadron-build publish`

## CLI Usage

```bash
hadron-build <command> [options]

Commands:
  release            :shipit:
  clean              Remove generated directories.
  config             Configuration.
  develop [options]  Run the app in development mode.
  test [options]     Run app tests.
  upload [options]   Upload assets from `release`.
  ui [options]       Compile the app UI.
  verify [options]   Verify the current environment meets the app\'s requirements.

Options:
  --help  Show help                                                    [boolean]
```


## Configuration

```json
{
  "config": {
    "hadron": {
      "build": {
        "win32": {
          "icon": "resources/win32/<your-project-id>.ico",
          "favicon_url": "https://raw.githubusercontent.com/mongodb-js/favicon/master/favicon.ico",
          "loading_gif": "resources/win32/loading.gif"
        },
        "darwin": {
          "icon": "resources/darwin/<your-project-id>.icns",
          "dmg_background": "resources/darwin/background.png",
          "app_bundle_id": "com.<your-company>.<your-project-id>",
          "app_category_type": "public.app-category.productivity"
        },
        "linux": {
          "icon": "resources/linux/<your-project-id>.png"
        }
      },
      "endpoint": "<hadron-endpoint-server-url>"
    }
  },
  "scripts": {
    "check": "hadron-build check",
    "test-check-ci": "npm run test",
    "clean": "hadron-build clean",
    "compile-ui": "hadron-build ui",
    "fmt": "hadron-build fmt",
    "postuninstall": "hadron-build clean",
    "release": "hadron-build release",
    "start": "hadron-build develop",
  }
}
```


### build.win32

#### build.win32.icon

#### build.win32.favicon_url

#### build.win32.loading_gif

### build.darwin

#### build.darwin.icon

#### build.darwin.dmg_background

#### build.darwin.codesign_identity

#### build.darwin.codesign_sha1

#### build.darwin.app_bundle_id

#### build.darwin.app_category_type

### build.linux

#### build.linux.icon

## Important Paths

```javascript
var version = '1.1.0'; // channel = stable
var productName = 'Hadron Build';
var appBundleId = 'com.mongodb.hadron';
```

### macOS

- `~/Library/Application\ Support/${productName}`: The `[userData][electron-app-getPath]` directory
- `~/Library/Application\ Support/${appBundleId}.ShipIt/ShipItState.plist`: Auto update state persistence
- `~/Library/Application\ Support/${appBundleId}.ShipIt/ShipIt_stderr.log`: Auto update log

### Windows

- `C:\Users\${username}\AppData\Local\${_.titlecase(productName)}`: App installation path.  Why in a temp dir? Allows installation and auto update without requiring Administrator.
- `C:\Users\${username}\AppData\Roaming\${productName}`: The `[userData][electron-app-getPath]` directory
- `C:\Users\${username}\AppData\Local\SquirrelTemp\SquirrelSetup.log`: Squirrel.Windows installation log. Global for any app installation that's using Squirrel.Windows.
- `C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\SquirrelSetup.log`: Application level Squirrel.Windows log

#### The Squirrel.Windows Installation Log Explained

> `C:\Users\${username}\AppData\Local\SquirrelTemp\SquirrelSetup.log`

What you can expect from a successful installation:

```
2016-06-24 09:46:12> Program: Starting Squirrel Updater: --install .
2016-06-24 09:46:12> Program: Starting install, writing to C:\Users\${username}\AppData\Local\SquirrelTemp
2016-06-24 09:46:12> Program: About to install to: C:\Users\${username}\AppData\Local\${_.titlecase(productName)}
```

The following exception might be scary, but it's purely informational and ok to ignore.
```
2016-06-24 09:46:12> CheckForUpdateImpl: Couldn't write out staging user ID, this user probably shouldn't get beta anything: System.IO.DirectoryNotFoundException: Could not find a part of the path 'C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\packages\.betaId'.
   at System.IO.__Error.WinIOError(Int32 errorCode, String maybeFullPath)
   at System.IO.FileStream.Init(String path, FileMode mode, FileAccess access, Int32 rights, Boolean useRights, FileShare share, Int32 bufferSize, FileOptions options, SECURITY_ATTRIBUTES secAttrs, String msgPath, Boolean bFromProxy, Boolean useLongPath, Boolean checkHost)
   at System.IO.FileStream..ctor(String path, FileMode mode, FileAccess access, FileShare share, Int32 bufferSize, FileOptions options, String msgPath, Boolean bFromProxy, Boolean useLongPath, Boolean checkHost)
   at System.IO.StreamWriter.CreateFile(String path, Boolean append, Boolean checkHost)
   at System.IO.StreamWriter..ctor(String path, Boolean append, Encoding encoding, Int32 bufferSize, Boolean checkHost)
   at System.IO.File.InternalWriteAllText(String path, String contents, Encoding encoding, Boolean checkHost)
   at System.IO.File.WriteAllText(String path, String contents, Encoding encoding)
   at Squirrel.UpdateManager.CheckForUpdateImpl.getOrCreateStagedUserId()
2016-06-24 09:46:12> CheckForUpdateImpl: Failed to load local releases, starting from scratch: System.IO.DirectoryNotFoundException: Could not find a part of the path 'C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\packages\RELEASES'.
   at System.IO.__Error.WinIOError(Int32 errorCode, String maybeFullPath)
   at System.IO.FileStream.Init(String path, FileMode mode, FileAccess access, Int32 rights, Boolean useRights, FileShare share, Int32 bufferSize, FileOptions options, SECURITY_ATTRIBUTES secAttrs, String msgPath, Boolean bFromProxy, Boolean useLongPath, Boolean checkHost)
   at System.IO.FileStream..ctor(String path, FileMode mode, FileAccess access, FileShare share)
   at Squirrel.Utility.LoadLocalReleases(String localReleaseFile)
   at Squirrel.UpdateManager.CheckForUpdateImpl.<CheckForUpdate>d__3f.MoveNext()
```

The actual installation:

```
2016-06-24 09:46:12> CheckForUpdateImpl: Reading RELEASES file from C:\Users\${username}\AppData\Local\SquirrelTemp
2016-06-24 09:46:12> CheckForUpdateImpl: First run or local directory is corrupt, starting from scratch
2016-06-24 09:46:12> ApplyReleasesImpl: Writing files to app directory: C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}
2016-06-24 09:46:16> ApplyReleasesImpl: Moving file C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\lib\net45\content_resources_200_percent.pak to C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\content_resources_200_percent.pak
2016-06-24 09:46:16> ApplyReleasesImpl: Moving file C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\lib\net45\d3dcompiler_47.dll to C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\d3dcompiler_47.dll
2016-06-24 09:46:16> ApplyReleasesImpl: Moving file C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\lib\net45\content_shell.pak to C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\content_shell.pak
2016-06-24 09:46:16> ApplyReleasesImpl: Moving file C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\lib\net45\ffmpeg.dll to C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\ffmpeg.dll
2016-06-24 09:46:16> ApplyReleasesImpl: Moving file C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\lib\net45\icudtl.dat to C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\icudtl.dat
2016-06-24 09:46:16> ApplyReleasesImpl: Moving file C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\lib\net45\libEGL.dll to C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\libEGL.dll
2016-06-24 09:46:16> ApplyReleasesImpl: Moving file C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\lib\net45\LICENSE to C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\LICENSE
2016-06-24 09:46:16> ApplyReleasesImpl: Moving file C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\lib\net45\libGLESv2.dll to C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\libGLESv2.dll
2016-06-24 09:46:16> ApplyReleasesImpl: Moving file C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\lib\net45\${_.titlecase(productName)}.exe to C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\${_.titlecase(productName)}.exe
2016-06-24 09:46:16> ApplyReleasesImpl: Moving file C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\lib\net45\msvcp120.dll to C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\msvcp120.dll
2016-06-24 09:46:16> ApplyReleasesImpl: Moving file C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\lib\net45\msvcr120.dll to C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\msvcr120.dll
2016-06-24 09:46:16> ApplyReleasesImpl: Moving file C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\lib\net45\natives_blob.bin to C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\natives_blob.bin
2016-06-24 09:46:16> ApplyReleasesImpl: Moving file C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\lib\net45\pdf.dll to C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\pdf.dll
2016-06-24 09:46:16> ApplyReleasesImpl: Moving file C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\lib\net45\squirrel.exe to C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\squirrel.exe
2016-06-24 09:46:16> ApplyReleasesImpl: Moving file C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\lib\net45\ui_resources_200_percent.pak to C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\ui_resources_200_percent.pak
2016-06-24 09:46:16> ApplyReleasesImpl: Moving file C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\lib\net45\snapshot_blob.bin to C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\snapshot_blob.bin
2016-06-24 09:46:16> ApplyReleasesImpl: Moving file C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\lib\net45\node.dll to C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\node.dll
2016-06-24 09:46:16> ApplyReleasesImpl: Moving file C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\lib\net45\vccorlib120.dll to C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\vccorlib120.dll
2016-06-24 09:46:16> ApplyReleasesImpl: Moving file C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\lib\net45\xinput1_3.dll to C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\xinput1_3.dll
2016-06-24 09:46:17> ApplyReleasesImpl: Squirrel Enabled Apps: [C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\${_.titlecase(productName)}.exe]
2016-06-24 09:46:18> ApplyReleasesImpl: Starting fixPinnedExecutables
2016-06-24 09:46:18> ApplyReleasesImpl: Examining Pin: Command Prompt.lnk
2016-06-24 09:46:18> ApplyReleasesImpl: Examining Pin: File Explorer.lnk
2016-06-24 09:46:18> ApplyReleasesImpl: Examining Pin: Google Chrome.lnk
2016-06-24 09:46:18> ApplyReleasesImpl: Examining Pin: Internet Explorer.lnk
2016-06-24 09:46:18> ApplyReleasesImpl: Examining Pin: sublime_text - Shortcut.lnk
2016-06-24 09:46:18> ApplyReleasesImpl: Examining Pin: Task Manager.lnk
2016-06-24 09:46:18> ApplyReleasesImpl: Examining Pin: Windows PowerShell.lnk
2016-06-24 09:46:18> ApplyReleasesImpl: Fixing up tray icons
```

Another exception that might be scary, but it's purely informational and ok to ignore.
```
2016-06-24 09:46:18> ApplyReleasesImpl: Couldn't rewrite shim RegKey, most likely no apps are shimmed: System.NullReferenceException: Object reference not set to an instance of an object.
   at Squirrel.UpdateManager.ApplyReleasesImpl.<unshimOurselves>b__ee(RegistryView view)
2016-06-24 09:46:18> ApplyReleasesImpl: Couldn't rewrite shim RegKey, most likely no apps are shimmed: System.NullReferenceException: Object reference not set to an instance of an object.
   at Squirrel.UpdateManager.ApplyReleasesImpl.<unshimOurselves>b__ee(RegistryView view)
```

And then finally
```
2016-06-24 09:46:18> ApplyReleasesImpl: cleanDeadVersions: for version ${version}
2016-06-24 09:46:18> ApplyReleasesImpl: cleanDeadVersions: exclude folder app-${version}
```

#### The Windows Application Log Explained

> `C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\SquirrelSetup.log`

##### Windows Startup Log

- User's launch application via a desktop shortcut `${productName}`
- Installing into `C:\\Program Files\` would require Administrator
- Desktop shortcut managed for you automatically if you use https://github.com/mongodb-js/electron-squirrel-startup
- Shortcut Target: `C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\Update.exe --processStart ${_.titlecase(productName)}.exe`
- Shortcut Start In: `C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}`

```
2016-06-24 12:32:51> Program: Starting Squirrel Updater: --processStart ${_.titlecase(productName)}.exe
2016-06-24 12:32:51> Program: Want to launch 'C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\${_.titlecase(productName)}.exe'
2016-06-24 12:32:51> Program: About to launch: 'C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\app-${version}\${_.titlecase(productName)}.exe':
```

##### Windows Auto Update Log

```
2016-06-24 12:33:00> Program: Starting Squirrel Updater: --download https://${server}/update?version=${version}&platform=win32&arch=x64
2016-06-24 12:33:00> Program: Fetching update information, downloading from https://${server}/update?version=${version}&platform=win32&arch=x64
2016-06-24 12:33:00> CheckForUpdateImpl: Using existing staging user ID: 4b7f7d53-806c-5724-9079-695fe1657b09
2016-06-24 12:33:00> CheckForUpdateImpl: Downloading RELEASES file from https://${server}/update?version=${version}&platform=win32&arch=x64
2016-06-24 12:33:00> FileDownloader: Downloading url: https://${server}/update/RELEASES?version=${version}&platform=win32&arch=amd64&id=${_.titlecase(productName)}&localVersion=${version}
```

See Squirrel.Windows docs https://github.com/Squirrel/Squirrel.Windows/blob/master/docs/getting-started/5-updating.md

## Assets

When `hadron-build release` is run, there are several assets which are created in the `./dist` directory.
Which assets are generated depends on the target platform.

### macOS

- `.dmg`: Installer
- `-darwin-${arch}.zip`: Auto update payload

### Windows

- `.exe`: Installer
- `.full-nupkg`: Auto update payload
- `.delta-nupkg`: Auto update payload w/ delta compression against previous release
- `RELEASES`: Manifest for auto update checksumming and local delta calculation
- `.msi`: Global Windows installer (requires Administrator)
- `-win32-${arch}.zip`: Convenience for techops team's that can't use `.msi` or use a package manager such as Chocolatey.

### Linux

- `.rpm`: Installer for Redhat
- `.deb`: Installer for Ubuntu and Debian
- `.tar.gz`: Convenience for easy automation on unix
- `-linux-${arch}.zip`: Convenience for easy automation on win32-x64

### macOS

- Works out of the box

### Windows

- `electron-squirrel-startup`: https://github.com/mongodb-js/electron-squirrel-startup
- [Update process explained step by step](https://github.com/Squirrel/Squirrel.Windows/blob/master/docs/using/update-process.md#update-process)

### Linux

- Not currently supported. Waiting for upstream to do it

## Todo

- upload (github/s3) refactoring
- `upload` writes to Atlas
- yargs -> commander
- Docs
- Changelog generator
- nightly auto update channel
- `upload` called and result is all assets needed to release ready? Write manifest to nightly auto update channel
- `publish` command for setting `draft=true` on GitHub Release and pushing S3 manifest
- `snap` and `appimage` installers for Linux

[npm_img]: https://img.shields.io/npm/v/hadron-build.svg
[npm_url]: https://npmjs.org/package/hadron-build
[npm-scripts]: https://docs.npmjs.com/misc/scripts
[electron-mocha]: https://github.com/jprichardson/electron-mocha
[electron-app-getPath]: https://github.com/electron/electron/blob/78193a0608b5fa55161e95b7b3845b6bd85af377/docs/api/app.md#appgetpathname
[appveyor_img]: https://ci.appveyor.com/api/projects/status/n9yqrfsf17s4g1ss?svg=true
[appveyor_url]: https://ci.appveyor.com/project/imlucas/hadron-build
