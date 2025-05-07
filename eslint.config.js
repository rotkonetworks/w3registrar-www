import { FlatCompat } from '@eslint/eslintrc';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import path from 'path';
import { fileURLToPath } from 'url';

// Needed for converting old configs
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: eslint.configs.recommended,
});

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    ...compat.extends(
        'plugin:react/recommended',
        'plugin:react-hooks/recommended'
    ),
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            parser: tseslint.parser,
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
                project: './tsconfig.json',
            },
            globals: {
                React: 'readable',
                JSX: 'readable',
            },
        },
        plugins: {
            import: importPlugin,
            react: reactPlugin,
            'react-hooks': reactHooksPlugin,
        },
        settings: {
            react: {
                version: 'detect',
            },
            'import/resolver': {
                typescript: {},
            },
        },
        rules: {
            'react/jsx-uses-react': 'off',
            'react/react-in-jsx-scope': 'off',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_'
            }],
            'import/order': [
                'error',
                {
                    groups: [
                        'builtin',
                        'external',
                        'internal',
                        'parent',
                        'sibling',
                        'index',
                    ],
                    'newlines-between': 'always',
                    alphabetize: { order: 'asc' },
                },
            ],
            'no-console': 'off',    // Logs are expected in dev, and aren't minified away
            'prefer-const': 'warn',
        },
    },
    {
        files: ['**/*.{ts,tsx}'],
        rules: {
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/strict-boolean-expressions': 'off',
        },
    },
    {
        ignores: ['node_modules/**', 'dist/**', 'build/**'],
    }
);