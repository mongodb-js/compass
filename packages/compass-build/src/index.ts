import { build } from "electron-builder";
import fs from "fs/promises";

import { withTempFile } from "./temp";

async function main() {
  const electronBuilderConfig = {
    appId: "com.mongodb.compass",
    productName: "MongoDB Compass",
    nodeVersion: "12.9.0",
    asar: true,
    asarUnpack: [
      "**/@mongosh/node-runtime-worker-thread/**",
      "**/interruptor/**",
      "**/kerberos/**",
      "**/snappy/**",
      "**/mongodb-client-encryption/index.js",
      "**/mongodb-client-encryption/package.json",
      "**/mongodb-client-encryption/lib/**",
      "**/mongodb-client-encryption/build/**",
      "**/bl/**",
      "**/nan/**",
      "**/node_modules/bindings/**",
      "**/file-uri-to-path/**",
      "**/bson/**",
    ],
    mac: {
      icon: "packages/compass/src/app/images/darwin/mongodb-compass.icns",
      category: "public.app-category.productivity",
      target: ["dmg", "zip", "dir"],
    },
    win: {
      icon: "packages/compass/src/app/images/win32/mongodb-compass.ico",
      target: ["squirrel", "zip"],
    },
    linux: {
      target: ["deb", "rpm", "tar.gz"],
    },
    dmg: {
      background: "packages/compass/src/app/images/darwin/background.png",
    },
    publish: [],
  };

  await withTempFile(async (configFilePath: string) => {
    await fs.writeFile(configFilePath, JSON.stringify(electronBuilderConfig));

    await build({
      config: configFilePath,
    });
  });
}

void main();

// console.log('hi!', process.argv, process.cwd());
