module.exports = [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        console: true,
        process: true,
        module: true,
        require: true
      }
    },
    rules: {
      'no-unused-vars': ['warn', { args: 'none' }],
      eqeqeq: 'error'
    }
  }
];
