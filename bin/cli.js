#!/usr/bin/env node

const { generateProject } = require('../lib/generator');

generateProject().catch(err => {
  console.error('Une erreur est survenue:', err);
  process.exit(1);
});
