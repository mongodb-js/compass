![electron-wix-msi](.github/logo.png)

[![Build status](https://ci.appveyor.com/api/projects/status/s54pty8rve3yemb9?svg=true)](https://ci.appveyor.com/project/felixrieseberg/electron-wix-msi) [![Build Status](https://travis-ci.org/felixrieseberg/electron-wix-msi.svg?branch=master)](https://travis-ci.org/felixrieseberg/electron-wix-msi) [![Coverage Status](https://coveralls.io/repos/github/felixrieseberg/electron-wix-msi/badge.svg?branch=master)](https://coveralls.io/github/felixrieseberg/electron-wix-msi?branch=master) ![TypeScript](https://img.shields.io/badge/typings-included-brightgreen.svg)

## Traditional MSI Installers
Most Electron developers use the official [windows-installer](https://github.com/electron/windows-installer) to create Windows installers. It creates a Squirrel-based installer, which does not require Administrator priviledges to install and comes bundled with an automatic updater. In most cases, that is the installer you will want to use.

However, if you need to create a traditional MSI the way Microsoft intended for software to be installed, you can use this module. It creates a standalone installer that installs your application to `Program Files`. It handles updates.

## Look & Feel

<p align="center"><img src="https://github.com/felixrieseberg/electron-wix-msi/raw/master/.github/installer.gif" alt="Installer GIF"></p>

## Prerequisites
Before using this module, make sure to [install the Wix toolkit v3](http://wixtoolset.org/releases/). Only the command line tools are required.

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
 - `appDirectory` (string) - The source directory for the installer, usually the output of [electron-packager](https://github.com/electron-userland/electron-packager).
 - `outputDirectory` (string) - The output directory. Will contain the finished `msi` as well as the intermediate files .`wxs` and `.wixobj`.
 - `exe` (string) - The name of the exe.
 - `description` (string) - The app's description.
 - `version` (string) - The app's version.
 - `name` (string) - The app's name.
 - `manufacturer` (string) - Name of the manufacturer.
 - `shortName` (optional, string) - A short name for the app, used wherever spaces and special characters are not allowed. Will use the name if left undefined.
 - `programFilesFolderName` (string, optional) - Name of the folder your app will live in. Will use the app's name if left undefined.
 - `shortcutFolderName` (string, optional) - Name of the shortcut folder in the Windows Start Menu. Will use the manufacturer field if left undefined.
 - `upgradeCode` (string, optional) - A unique UUID used by your app to identify itself. This module will generate one for you, but it is important to reuse it to enable conflict-free upgrades.
 - `language` (number, optional) - The [Microsoft Windows Language Code identifier](https://msdn.microsoft.com/en-us/library/cc233965.aspx) used by the installer. Will use 1033 (English, United-States) if left undefined.
 - `ui` (UIOptions, optional) - Enables configuration of the UI. See below for more information.


##### UI Configuration (Optional)
The `ui` property in the options passed to the installer instance allows more detailed configuration of the UI. It has the following optional properties:
 - `enabled` (boolean, optional) - Whether to show a typical user interface. Defaults to `true`. If set to `false`, Windows will show a minimal "Windows is configuring NAME_OF_APP" interface.
 - `template` (string, optional) - Substitute your own XML that will be inserted into the final `.wxs` file before compiling the installer to customize the UI options.
 - `chooseDirectory` (boolean, optional) - If set to `true`, the end user will be able to choose the installation directory. Set to `false` by default. Without effect if a custom `template` is used.
 - `images` (Optional) - Overwrites default installer images with custom files. I recommend JPG.
    - `background` - (optional, string) 493 x 312 Background bitmap used on the welcome and completion dialogs. Will be used as `WixUIDialogBmp`.
    - `banner` - (optional, string) 493 × 58 Top banner used on most dialogs that don't use `background`. Will be used as `WixUIBannerBmp`.
    - `exclamationIcon` - (optional, string) 32 x 32 Exclamation icon on the `WaitForCostingDlg` dialog. Will be used as `WixUIExclamationIco`.
    - `infoIcon` - (optional, string) 32 x 32 Information icon on the cancel and error dialogs. Will be used as `WixUIInfoIco`.
    - `newIcon` - (optional, string) 16 x 16 "New folder" icon for the "browse" dialog. Will be used as `WixUINewIco`.
    - `upIcon` - (optional, string) 16 x 16 "Up" icon for the "browse" dialog. Will be used as `WixUIUpIco`.


##### Template Configuration (Optional)
This module uses XML bulding blocks to generate the final `.wxs` file. After instantiating the class, but before calling `create()`, you can change the default XML to one of your choosing. The publically available fields on the class are:

 - `componentTemplate` (string) - Used for `<Component>` elements. One per file.
 - `componentRefTemplate` (string) - Used for `<ComponentRef>` elements. Again, one per file.
 - `directoryTemplate` (string) - Used for `<Directory>` elements. This module does not use `<DirectoryRef>` elements.
 - `wixTemplate` (string) - Used as the master template.
 - `uiTemplate` (string) - Used as the master UI template.
 - `backgroundTemplate` (string) - Used as the background template.

## License
MIT, please see LICENSE.md for details.
