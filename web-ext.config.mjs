import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEV_PROFILE = resolve(HERE, '.firefox-profile');

export default {
  sourceDir: 'dist',
  artifactsDir: 'web-ext-artifacts',
  build: {
    overwriteDest: true,
  },
  run: {
    startUrl: ['https://www.linkedin.com/'],
    browserConsole: true,
    firefoxProfile: DEV_PROFILE,
    profileCreateIfMissing: true,
    keepProfileChanges: true,
  },
  ignoreFiles: ['**/*.map'],
};
