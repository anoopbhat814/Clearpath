#!/usr/bin/env node
'use strict';

/**
 * Scans controller files and emits a lightweight route inventory (openapi.json) used by docs/api.md.
 * The full Swagger document is available at runtime under /api/docs.
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..', 'apps', 'api', 'src');

function controllers(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return controllers(p);
    return e.name.endsWith('.controller.ts') ? [p] : [];
  });
}

const paths = {};
for (const file of controllers(srcDir)) {
  const text = fs.readFileSync(file, 'utf8');
  const base = /@Controller\('([^']*)'\)/.exec(text);
  if (!base) continue;
  const re = /@(Get|Post|Patch|Put|Delete)\(([^)]*)\)/g;
  let m;
  while ((m = re.exec(text))) {
    const sub = m[2].replace(/['"]/g, '').trim();
    const route = '/api/' + [base[1], sub].filter(Boolean).join('/').replace(/:(\w+)/g, '{$1}');
    paths[route] = paths[route] || {};
    paths[route][m[1].toLowerCase()] = { tags: [base[1]], source: path.relative(srcDir, file) };
  }
}

const doc = { openapi: '3.0.3', info: { title: 'Clearpath API route inventory', version: require('../package.json').version }, paths };
fs.writeFileSync(path.join(__dirname, '..', 'openapi.json'), JSON.stringify(doc, null, 2));
console.log(`wrote openapi.json with ${Object.keys(paths).length} paths`);
