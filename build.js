/* eslint no-console: ["off"] */

const archiver = require('archiver');
const copydir = require('copy-dir');
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

// delete dist/ folder
rimraf.sync(`${__dirname}/dist/`);
fs.mkdirSync(`${__dirname}/dist/`);

// create chrome
console.log(`
┌───────────────────────┐
│ Chrome extension      │
└───────────────────────┘`);
fs.mkdirSync(`${__dirname}/dist/chrome/`);
console.log('created: dist/chrome/');
copyDir('img/', 'dist/chrome/img/');
copyDir('src/', 'dist/chrome/src/');
copyFile('manifest.chrome.json', 'dist/chrome/manifest.json');

let archive = archiver('zip', { zlib: { level: 9 } });
let stream = fs.createWriteStream(`${__dirname}/dist/chrome.zip`);
archive.pipe(stream);
archive.directory(`${__dirname}/dist/chrome/img/`, 'img');
archive.directory(`${__dirname}/dist/chrome/src/`, 'src');
archive.file(`${__dirname}/dist/chrome/manifest.json`, { name: 'manifest.json' });
archive.finalize();
console.log('created: dist/chrome.zip');

// create firefox
console.log(`
┌───────────────────────┐
│ Firefox add-on        │
└───────────────────────┘`);
fs.mkdirSync(`${__dirname}/dist/firefox/`);
console.log('created: dist/firefox/');
copyDir('img/', 'dist/firefox/img/');
copyDir('src/', 'dist/firefox/src/');
copyFile('manifest.firefox.json', 'dist/firefox/manifest.json');

archive = archiver('zip', { zlib: { level: 9 } });
stream = fs.createWriteStream(`${__dirname}/dist/firefox.zip`);
archive.pipe(stream);
archive.directory(`${__dirname}/dist/firefox/img/`, 'img');
archive.directory(`${__dirname}/dist/firefox/src/`, 'src');
archive.file(`${__dirname}/dist/firefox/manifest.json`, { name: 'manifest.json' });
archive.finalize();
console.log('created: dist/firefox.zip');
