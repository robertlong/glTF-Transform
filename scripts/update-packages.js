#!/usr/bin/env node

const load = require('load-json-file');
const write = require('write-json-file');
const path = require('path');
const glob = require('glob');

const packages = {};
load.sync('../packages.json').forEach((pkg) => {
  packages[pkg.module] = pkg;
});

const tplPkg = load.sync('./tpl-package.json');

// Update package.json
glob.sync(path.join(__dirname, '..', 'packages', 'gltf-transform-*', 'package.json')).forEach(packagePath => {
  const pckg = load.sync(packagePath);
  // pckg.dependencies = updateDependencies(pckg);
  pckg.devDependencies = updateDevDependencies(pckg);
  write.sync(packagePath, pckg, { indent: 2 });
});

function entries(obj) {
  return Object.keys(obj || {}).map(key => [key, obj[key]]);
}

function updateDependencies(pckg) {
  const dependencies = {};
  new Map(entries(pckg.dependencies))
    .forEach((version, name) => {
      // Update dependencies to Major releases
      switch (name) {
        case 'geojson-rbush':
          dependencies[name] = '2.x';
          break;
        case 'topojson-client':
        case 'topojson-server':
          dependencies[name] = '3.x';
          break;
        case 'jsts':
        case 'jsts-es':
        case '@turf/point-on-surface':
        case '@turf/line-distance':
        case '@turf/inside':
        case '@turf/point-on-line':
        case '@turf/nearest':
          throw new Error(`${pckg.name} module has invalid dependency ${name}`);
        default:
          dependencies[name] = version;
      }
    });
  // All modules will have helpers to handle the internal TypeScript definitions
  if (pckg.name !== '@turf/helpers') dependencies['@turf/helpers'] = '^5.0.4';
  return dependencies;
}

function updateDevDependencies(pckg) {
  const devDependencies = {};
  const dev = new Map(entries(pckg.devDependencies));
  dev.delete('foo-bar');
  dev
    .set('microbundle', '*').forEach((version, name) => {
      devDependencies[name] = '*';
    });
  return devDependencies;
}