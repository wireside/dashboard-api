import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
	verbose: true,
	silent: false,
	detectOpenHandles: true,
	displayName: 'e2e',
	preset: 'ts-jest',
	testRegex: '.e2e-spec.ts$',
};

export default config;
