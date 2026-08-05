const expo = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier/flat');

module.exports = [
  ...expo,
  prettier,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'admin/dist/*'],
  },
  {
    rules: {
      // Tokens are the single source of truth. These guard the rule that nothing
      // outside src/design defines a color, duration, or spacing value.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/design/tokens', '**/design/tokens.ts'],
              importNames: ['palette'],
              message: 'Import the semantic theme via useTheme() instead of the raw palette.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
          message: 'Hardcoded color. Use a token from src/design/tokens.ts.',
        },
      ],
    },
  },
  {
    // The design system itself is where these values are allowed to live.
    files: ['src/design/**'],
    rules: {
      'no-restricted-imports': 'off',
      'no-restricted-syntax': 'off',
    },
  },
];
