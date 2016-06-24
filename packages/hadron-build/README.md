# hadron-build

> Complete tooling for large-scale [Electron](http://electron.atom.io/) apps.

[![travis][travis_img]][travis_url] [![npm][npm_img]][npm_url]


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
          "codesign_identity": "Developer ID Application: <your-name> (<your-apple-developer-id>)",
          "codesign_sha1": "<your-certs-sha1>",
          "app_bundle_id": "com.<your-company>.<your-project-id>",
          "app_category_type": "public.app-category.productivity"
        }
      },
      "endpoint": "<hadron-endpoint-server-url>"
    }
  },
  "scripts": {
    "check": "hadron-build check",
    "ci": "npm run test",
    "clean": "hadron-build clean",
    "compile-ui": "hadron-build ui",
    "fmt": "hadron-build fmt",
    "postuninstall": "hadron-build clean",
    "release": "hadron-build release",
    "start": "hadron-build develop",
    "test": "hadron-build test",
    "test-functional": "npm test -- --functional",
    "test-unit": "npm test -- --unit",
    "test-release": "npm test -- --release"
  }
}
```

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
- `C:\Users\${username}\AppData\Local\SquirrelTemp\SquirrelSetup.log`: Installation log
- `C:\Users\${username}\AppData\Local\${_.titlecase(productName)}\SquirrelSetup.log`: Auto update log

#### The Installation Log Explained

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

## Auto Update

- `hadron-auto-update-manager`: https://github.com/hadron-auto-update-manager
- `electron-squirrel-startup`: https://github.com/mongodb-js/electron-squirrel-startup

## Todo

- Functional tests for `release` command
- `railcars` command
- `check` command ->  `mongodb-js-precommit`
- `fmt` command ->  `mongodb-js-fmt`
- Make `test` use `xvfb-maybe` by default


## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/hadron-build.svg
[travis_url]: https://travis-ci.org/mongodb-js/hadron-build
[npm_img]: https://img.shields.io/npm/v/hadron-build.svg
[npm_url]: https://npmjs.org/package/hadron-build
[npm-scripts]: https://docs.npmjs.com/misc/scripts
[spectron]: https://github.com/kevinsawicki/spectron
[electron-mocha]: https://github.com/jprichardson/electron-mocha
[electron-app-getPath]: https://github.com/electron/electron/blob/78193a0608b5fa55161e95b7b3845b6bd85af377/docs/api/app.md#appgetpathname
