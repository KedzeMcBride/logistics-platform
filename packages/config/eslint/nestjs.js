/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: false,
  extends: ['./base.js'],
  env: {
    node: true,
    browser: false,
    jest: true,
  },
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
