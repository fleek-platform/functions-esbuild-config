import { BuildOptions, Plugin } from 'esbuild';
import path from 'node:path';
import { moduleChecker } from './plugins/moduleChecker.js';
import { nodeProtocolImportSpecifier } from './plugins/nodeProtocolImportSpecifier.js';

export interface FleekBuildOptions {
  filePath: string;
  bundle: boolean;
  env: Record<string, string>;
  outFile?: string;
  tempDir?: string;
  onError?: (message: string) => void;
}

export const defaultOptions: Omit<BuildOptions, 'entryPoints' | 'outfile' | 'plugins'> = {
  bundle: true,
  logLevel: 'silent',
  platform: 'browser',
  format: 'esm',
  target: 'esnext',
  treeShaking: true,
  mainFields: ['browser', 'module', 'main'],
  minify: true,
};

export const createFleekBuildConfig = (options: FleekBuildOptions): BuildOptions => {
  const { filePath, bundle, env, outFile = 'function.js', tempDir = '.fleek', onError = console.error } = options;

  const unsupportedModulesUsed = new Set<string>();
  const filePathWorkDir = path.dirname(filePath);
  const nodeModulesPath = path.join(filePathWorkDir, 'node_modules');

  const plugins: Plugin[] = [moduleChecker({ unsupportedModulesUsed })];

  if (bundle) {
    plugins.push(nodeProtocolImportSpecifier({ onError }));
  }

  // Translate envs so we can use them in the define options
  const envs = Object.entries(env).reduce(
    (acc, [key, value]) => ({ ...acc, [`process.env.${key}`]: `"${value}"` }),
    {},
  );

  const buildOptions: BuildOptions = {
    ...defaultOptions,
    entryPoints: [filePath],
    bundle,
    outfile: path.join(tempDir, outFile),
    plugins,
    nodePaths: [nodeModulesPath],
    define: {
      ...envs,
    },
  };

  buildOptions.banner = {
    js: `
import { Buffer } from "node:buffer";
import { AsyncLocalStorage } from "node:async_hooks";
import { PerformanceObserver, performance } from 'node:perf_hooks';
globalThis.AsyncLocalStorage = AsyncLocalStorage;
globalThis.process = {
  ...globalThis.process,
  env: {
    ...globalThis.process.env,
    ${Object.entries(env)
      .map(([key, value]) => `${key}: "${value}"`)
      .join(',')}
    }
};
globalThis.fleek = {
  env: {
    ${Object.entries(env)
      .map(([key, value]) => `${key}: "${value}"`)
      .join(',')}
    }
};
`,
  };

  return buildOptions;
};
