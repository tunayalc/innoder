const fs = require('node:fs');
const path = require('node:path');

// Metro 0.83 passes a filename to image-size v1. Keep its API while using patched v2.
const version = require('metro/package.json').version;
const filename = require.resolve('metro/private/Assets');
const source = fs.readFileSync(filename, 'utf8');
const before = `  const isImageInput = assetInfo.files[0].includes(".zip/")
    ? _fs.default.readFileSync(assetInfo.files[0])
    : assetInfo.files[0];`;
const after = `  const isImageInput = isImage ? _fs.default.readFileSync(assetInfo.files[0]) : null;`;
if (source.includes(after)) process.exit(0);
if (version !== '0.83.3' || !source.includes(before)) {
  throw new Error(
    `Review Metro ${version} image-size compatibility before building.`,
  );
}
fs.writeFileSync(filename, source.replace(before, after));
process.stdout.write(
  `Applied image-size v2 compatibility to ${path.relative(
    process.cwd(),
    filename,
  )}\n`,
);
