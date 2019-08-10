#!/bin/bash
rm -rf dist/firefox*
mkdir -p dist/firefox/
cp manifest.firefox.json dist/firefox/manifest.json
cp -r img/ dist/firefox/img/
cp -r src/ dist/firefox/src/
cd dist/firefox/
zip firefox.zip manifest.json img/ src/ -r
mv firefox.zip ../
cd ../../
rm -rf dist/firefox/