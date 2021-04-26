# Building

Building the package requires [WiX](https://wixtoolset.org) to be installed on the build machine.
Build by executing commands:
~~~~~
"%WIX%\bin\candle.exe" -out obj\Release\ -arch x64 -ext "%WIX%\bin\WixUIExtension.dll" MongoshUI.wxs Product.wxs
"%WIX%\bin\Light.exe" -out bin\Release\windows.msi -cultures:en-US -ext "%WIX%\bin\WixUIExtension.dll" -loc MongoshUI.en-US.wxl obj\Release\MongoshUI.wixobj obj\Release\Product.wixobj
~~~~~

# Customizations

- Candle command line supports building x86 or x64 via the "-arch" flag.
- The following preprocessor variables allow customizing the MSI. Preprocessor variables are passed to candle command line in the form: /dKEY=VALUE
  - Version: Version number in the for Major.Minor.Build, with max value 255.255.65536. Defaults to 0.0.0
  - Manufacturer: Manufacturer name, defaults to "MongoDB Inc."
  - BuildFolder: Folder containing the binaries and license notices. Defaults to "..\\..\mongosh-_Version_-dev.0-win32"

# Open Issues
1. mongosh.exe and mongocryptd-mongosh.exe should have a version numbers