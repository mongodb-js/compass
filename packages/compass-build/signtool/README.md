# signtool.exe emulator

This tool emulates the signtool.exe tool from Microsoft for signing windows
binaries: https://msdn.microsoft.com/en-us/library/windows/desktop/aa387764(v=vs.85).aspx

It only uses the last argument on the command-line, which is the path to the file to sign.
If signing is successful, it will replace the file with the newly-signed file from the
notary service.

## Install

This "fake" signtool is meant to replace the `signtool.exe` shipped with electron-winstaller (`node_modules/electron-winstaller/vendor/signtool.exe`).

`install.js` copies `signtool.exe` in the path where `winstaller` will use it to sign the windows setup files.

## Usage

```
signtool.exe [...any_argument_except_the_last_is_ignored] filepath.exe
```

Parameters for the notary service are passed in as environment variables.
- `NOTARY_SIGNING_KEY` - The name of the key to use for signing
- `NOTARY_SIGNING_COMMENT` - The comment to enter into the notary log for this signing operation
- `NOTARY_AUTH_TOKEN` - The password for using the selected signing key
- `NOTARY_URL` - The URL of the notary service

## Build

To rebuild `signtool.exe` from source:

```
cd signtool
bash build.sh
```

`go` 1.15 or later is is required.
