![electron-wix-msi](.github/logo.png)

[![Build status](https://ci.appveyor.com/api/projects/status/s54pty8rve3yemb9?svg=true)](https://ci.appveyor.com/project/felixrieseberg/electron-wix-msi)
[![Build Status](https://travis-ci.org/felixrieseberg/electron-wix-msi.svg?branch=master)](https://travis-ci.org/felixrieseberg/electron-wix-msi)
[![Coverage Status](https://coveralls.io/repos/github/felixrieseberg/electron-wix-msi/badge.svg?branch=master)](https://coveralls.io/github/felixrieseberg/electron-wix-msi?branch=master)
![TypeScript](https://img.shields.io/badge/typings-included-brightgreen.svg)

## Traditional MSI Installers

Most Electron developers use the official
[windows-installer](https://github.com/electron/windows-installer) to create
Windows installers. It does not require Administrator privileges and comes
bundled with an automatic updater. If your app targets consumers, it will likely
be the better choice.

However, if you need to create a traditional MSI the way Microsoft intended for
software to be installed, this module is your friend. It creates a standalone
MSI that installs your application to `Program Files` or any user-defined
directory, much like the installers for Office, Node.js, or other popular apps.
It allows up- and downgrades. For more details, see:
[Should I use this?](#should-i-use-this)

## Look & Feel

<p align="center"><img src="https://github.com/felixrieseberg/electron-wix-msi/raw/master/.github/installer.gif" alt="Installer GIF"></p>

## Prerequisites

Before using this module, make sure to
[install the Wix toolkit v3](http://wixtoolset.org/releases/). Only the command
line tools are required. If you are using AppVeyor or another Windows CI system,
it is likely already installed.

```
npm i --save-dev electron-wix-msi
```

## Usage

Creating an installer is a three-step process:

```js
import { MSICreator } from 'electron-wix-msi';

// Step 1: Instantiate the MSICreator
const msiCreator = new MSICreator({
  appDirectory: '/path/to/built/app',
  description: 'My amazing Kitten simulator',
  exe: 'kittens',
  name: 'Kittens',
  manufacturer: 'Kitten Technologies',
  version: '1.1.2',
  outputDirectory: '/path/to/output/folder'
});

// Step 2: Create a .wxs template file
await msiCreator.create();

// Step 3: Compile the template to a .msi file
await msiCreator.compile();
```

### Configuration

* `appDirectory` (string) - The source directory for the installer, usually the
  output of
  [electron-packager](https://github.com/electron-userland/electron-packager).
* `outputDirectory` (string) - The output directory. Will contain the finished
  `msi` as well as the intermediate files .`wxs` and `.wixobj`.
* `exe` (string) - The name of the exe.
* `description` (string) - The app's description.
* `version` (string) - The app's version.
* `name` (string) - The app's name.
* `manufacturer` (string) - Name of the manufacturer.

* `appUserModelId` (string, optional) - String to set as `appUserModelId` on the
  shortcut. If none is passed, it'll be set to `com.squirrel.(Name).(exe)`,
  which should match the id given to your app by Squirrel.
* `shortName` (optional, string) - A short name for the app, used wherever
  spaces and special characters are not allowed. Will use the name if left
  undefined.
* `shortcutFolderName` (string, optional) - Name of the shortcut folder in the
  Windows Start Menu. Will use the manufacturer field if left undefined.
* `programFilesFolderName` (string, optional) - Name of the folder your app will
  live in. Will use the app's name if left undefined.
* `upgradeCode` (string, optional) - A unique UUID used by your app to identify
  itself. This module will generate one for you, but it is important to reuse it
  to enable conflict-free upgrades.
* `language` (number, optional) - The
  [Microsoft Windows Language Code identifier](https://msdn.microsoft.com/en-us/library/cc233965.aspx)
  used by the installer. Will use 1033 (English, United-States) if left
  undefined.
* `certificateFile` (string, optional) - The path to an Authenticode Code
  Signing Certificate.
* `certificatePassword` (string, optional) - The password to decrypt the
  certificate given in `certificateFile`.
* `signWithParams` (string, optional) - Paramaters to pass to `signtool.exe`.
  Overrides `certificateFile` and `certificatePassword`.
* `ui` (UIOptions, optional) - Enables configuration of the UI. See below for
  more information.

##### UI Configuration (Optional)

The `ui` property in the options passed to the installer instance allows more
detailed configuration of the UI. It has the following optional properties:

* `enabled` (boolean, optional) - Whether to show a typical user interface.
  Defaults to `true`. If set to `false`, Windows will show a minimal "Windows is
  configuring NAME_OF_APP" interface.
* `template` (string, optional) - Substitute your own XML that will be inserted
  into the final `.wxs` file before compiling the installer to customize the UI
  options.
* `chooseDirectory` (boolean, optional) - If set to `true`, the end user will be
  able to choose the installation directory. Set to `false` by default. Without
  effect if a custom `template` is used.
* `images` (Optional) - Overwrites default installer images with custom files. I
  recommend JPG.
  * `background` - (optional, string) 493 x 312 Background bitmap used on the
    welcome and completion dialogs. Will be used as `WixUIDialogBmp`.
  * `banner` - (optional, string) 493 × 58 Top banner used on most dialogs that
    don't use `background`. Will be used as `WixUIBannerBmp`.
  * `exclamationIcon` - (optional, string) 32 x 32 Exclamation icon on the
    `WaitForCostingDlg` dialog. Will be used as `WixUIExclamationIco`.
  * `infoIcon` - (optional, string) 32 x 32 Information icon on the cancel and
    error dialogs. Will be used as `WixUIInfoIco`.
  * `newIcon` - (optional, string) 16 x 16 "New folder" icon for the "browse"
    dialog. Will be used as `WixUINewIco`.
  * `upIcon` - (optional, string) 16 x 16 "Up" icon for the "browse" dialog.
    Will be used as `WixUIUpIco`.

##### Template Configuration (Optional)

This module uses XML bulding blocks to generate the final `.wxs` file. After
instantiating the class, but before calling `create()`, you can change the
default XML. The available fields on the class are:

* `componentTemplate` (string) - Used for `<Component>` elements. One per file.
* `componentRefTemplate` (string) - Used for `<ComponentRef>` elements. Again,
  one per file.
* `directoryTemplate` (string) - Used for `<Directory>` elements. This module
  does not use `<DirectoryRef>` elements.
* `wixTemplate` (string) - Used as the master template.
* `uiTemplate` (string) - Used as the master UI template.
* `backgroundTemplate` (string) - Used as the background template.

## Should I use this?

Let's start with what's bad about this: Electron is based on Chromium, and as
such, inherintly dependent upon frequent updates. Whenever a new version of
Electron comes out, you should release a new version of your app. The default
installer for Windows is based on
[Squirrel](https://github.com/Squirrel/Squirrel.Windows), which comes with
support for automatic updates. An app that updates itself is fantastic for most
consumers. If you are not sure if you need a traditional MSI, chances are that
you don't.

> "Young man, creating an installer and dying is easy. Updating it and living is
> harder."
>
> -- Windows George Washington, 1776

If you are however developing enterprise software, you might find that IT
departments don't want automatically updating software. They want controlled
rollouts and detailed control over the installation. This is true for
universities, hospitals, the military, and many other organizations that have a
managed IT infrastructure. Their administrators will expect a "classic"
installer - the same way they would install Microsoft Office, Node.js,
Photoshop, or any other software. If you see your app being used in those
environments, you should push the self-updating package, but have a traditional
MSI in your pocket. Bear in mind however that you will need to find a way to get
updates to your users without relying on Electron's auto updater.

## MSI Administration
The `msi` packages created with this module allow for a wide range of command line parameters. The installer is a "Windows Installer", meaning that the actual installer's logic is part of Windows itself. It supports the following command-line parameters:

#### Install Options
`</uninstall | /x>` Uninstalls the product

#### Display Options
- `/quiet` Quiet mode, no user interaction
- `/passive` Unattended mode - progress bar only
- `/q[n|b|r|f]` Sets user interface level
  - n No UI
  - b Basic UI
  - r Reduced UI
  - f Full UI (default)
`/help` Help information

#### Restart Options
- `/norestart` Do not restart after the installation is complete
- `/promptrestart` Prompts the user for restart if necessary
- `/forcerestart` Always restart the computer after installation

#### Logging Options
- `/l[i|w|e|a|r|u|c|m|o|p|v|x|+|!|*] <LogFile>`
  - `i` Status messages
  - `w` Nonfatal warnings
  - `e` All error messages
  - `a` Start up of actions
  - `r` Action-specific records
  - `u` User requests
  - `c` Initial UI parameters
  - `m` Out-of-memory or fatal exit information
  - `o` Out-of-disk-space messages
  - `p` Terminal properties
  - `v` Verbose output
  - `x` Extra debugging information
  - `+` Append to existing log file
  - `!` Flush each line to the log
  - `*` Log all information, except for v and x options
- `/log <LogFile>` Equivalent of /l* <LogFile>

#### Update Options
- `/update <Update1.msp>[;Update2.msp]` Applies update(s)

#### Repair Options
- `/f[p|e|c|m|s|o|d|a|u|v]` Repairs a product
  - `p` only if file is missing
  - `o` if file is missing or an older version is installed (default)
  - `e` if file is missing or an equal or older version is installed
  - `d` if file is missing or a different version is installed
  - `c` if file is missing or checksum does not match the calculated value
  - `a` forces all files to be reinstalled
  - `u` all required user-specific registry entries (default)
  - `m` all required computer-specific registry entries (default)
  - `s` all existing shortcuts (default)
  - `v` runs from source and recaches local package

## License

MIT, please see LICENSE.md for details.
