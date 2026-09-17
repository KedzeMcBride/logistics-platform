/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: false,
  extends: ['./base.js', 'next/core-web-vitals'],
  env: {
    browser: true,
    node: false,
  },
  rules: {
    // Add Next-specific overrides here as needed
  },
};
