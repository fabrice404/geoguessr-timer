#!/bin/bash
rm -rf dist/chrome*
mkdir -p dist/chrome/
cp manifest.chrome.json dist/chrome/manifest.json
cp -r img/ dist/chrome/img/
cp -r src/ dist/chrome/src/
cd dist/
zip chrome.zip chrome/ -r
cd ../
rm -rf dist/chrome/