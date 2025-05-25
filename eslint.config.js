import { defineConfig } from 'eslint/config';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

export default defineConfig([
	{
		extends: compat.extends(
			'eslint:recommended',
			'plugin:@typescript-eslint/eslint-recommended',
			'plugin:@typescript-eslint/recommended',
			'plugin:prettier/recommended',
		),

		plugins: {
			'@typescript-eslint': typescriptEslint,
		},

		languageOptions: {
			parser: tsParser,
		},

		rules: {
			'no-empty-function': 'off',
			'no-trailing-spaces': 'off',
			'@typescript-eslint/ban-types': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
			'@typescript-eslint/explicit-function-return-type': ['warn'],
			'prettier/prettier': [
				'error',
				{
					singleQuote: true,
					trailingComma: 'all',
					useTabs: true,
					semi: true,
					bracketSpacing: true,
					printWidth: 100,
					endOfLine: 'auto',
					trailingSpaces: false,
				},
			],
		},
	},
]);
