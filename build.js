/* eslint no-console: ["off"] */

const addonsLinter = require('addons-linter');
const archiver = require('archiver');
const copydir = require('copy-dir');
const { ESLint } = require('eslint');
const fs = require('fs');
const rimraf = require('rimraf');

const copyDir = (src, dest) => {
  console.log(`created: ${dest}`);
  copydir.sync(`${__dirname}/${src}`, `${__dirname}/${dest}`, {
    utimes: true,
    mode: true,
    cover: true,
  });
};

const copyFile = (src, dest) => {
  console.log(`created: ${dest}`);
  fs.copyFileSync(`${__dirname}/${src}`, `${__dirname}/${dest}`);
};

const cleanupDistributionFolder = () => {
  // delete dist/ folder
  rimraf.sync(`${__dirname}/dist/`);
  fs.mkdirSync(`${__dirname}/dist/`);
};

const eslint = async () => {
  console.log(`
┌───────────────────────┐
│ ESLint                │
└───────────────────────┘`);
  const linter = new ESLint({ fix: true });
  const results = await linter.lintFiles(['src/']);
  await ESLint.outputFixes(results);
  const formatter = await linter.loadFormatter('stylish');
  const resultText = formatter.format(results);

  console.log(resultText);
  if (ESLint.getErrorResults(results).length > 0) {
    process.exit(1);
  }
  console.log(`ESLint: ${results.length} files checked`);
};

const makeChromeVersion = () => {
  console.log(`
┌───────────────────────┐
│ Chrome extension      │
└───────────────────────┘`);
  fs.mkdirSync(`${__dirname}/dist/chrome/`);
  console.log('created: dist/chrome/');
  copyDir('img/', 'dist/chrome/img/');
  copyDir('src/', 'dist/chrome/src/');
  copyFile('manifest.chrome.json', 'dist/chrome/manifest.json');

  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = fs.createWriteStream(`${__dirname}/dist/chrome.zip`);
  archive.pipe(stream);
  archive.directory(`${__dirname}/dist/chrome/img/`, 'img');
  archive.directory(`${__dirname}/dist/chrome/src/`, 'src');
  archive.file(`${__dirname}/dist/chrome/manifest.json`, { name: 'manifest.json' });
  archive.finalize();
  console.log('created: dist/chrome.zip');
};

const makeFirefoxVersion = () => {
  console.log(`
┌───────────────────────┐
│ Firefox add-on        │
└───────────────────────┘`);
  fs.mkdirSync(`${__dirname}/dist/firefox/`);
  console.log('created: dist/firefox/');
  copyDir('img/', 'dist/firefox/img/');
  copyDir('src/', 'dist/firefox/src/');
  copyFile('manifest.firefox.json', 'dist/firefox/manifest.json');

  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = fs.createWriteStream(`${__dirname}/dist/firefox.zip`);
  archive.pipe(stream);
  archive.directory(`${__dirname}/dist/firefox/img/`, 'img');
  archive.directory(`${__dirname}/dist/firefox/src/`, 'src');
  archive.file(`${__dirname}/dist/firefox/manifest.json`, { name: 'manifest.json' });
  archive.finalize();
  console.log('created: dist/firefox.zip');
};

const addonLint = async () => {
  console.log(`
┌───────────────────────┐
│ Add-ons lint          │
└───────────────────────┘`);
  const linter = addonsLinter.createInstance({
    config: {
      _: [`${process.cwd()}/dist/firefox`],
      logLevel: 'fatal',
      stack: Boolean(process.env.VERBOSE),
    },
  });
  await linter.run();
};

const main = async () => {
  cleanupDistributionFolder();
  await eslint();
  makeChromeVersion();
  makeFirefoxVersion();
  await addonLint();
};

main();
