export default {
  sourceDir: 'dist',
  artifactsDir: 'web-ext-artifacts',
  build: {
    overwriteDest: true,
  },
  run: {
    startUrl: ['https://www.linkedin.com/'],
    browserConsole: true,
  },
  ignoreFiles: ['**/*.map'],
};
