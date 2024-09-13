import { BuildOptions, Plugin } from 'esbuild';
import path from 'node:path';
import { moduleChecker } from './plugins/moduleChecker';
import { asyncLocalStoragePolyfill } from './plugins/asyncLocalStoragePolyfill';
import { nodeProtocolImportSpecifier } from './plugins/nodeProtocolImportSpecifier';

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
  const {
    filePath,
    bundle,
    env,
    outFile = 'function.js',
    tempDir = process.env.TEMP || '.fleek',
    onError = console.error,
  } = options;

  const unsupportedModulesUsed = new Set<string>();
  const filePathWorkDir = path.dirname(filePath);
  const nodeModulesPath = path.join(filePathWorkDir, 'node_modules');

  const plugins: Plugin[] = [moduleChecker({ unsupportedModulesUsed })];

  if (bundle) {
    plugins.push(asyncLocalStoragePolyfill(), nodeProtocolImportSpecifier({ onError }));
  }

  const buildOptions: BuildOptions = {
    ...defaultOptions,
    entryPoints: [filePath],
    bundle,
    outfile: path.join(tempDir, outFile),
    plugins,
    nodePaths: [nodeModulesPath],
  };

  buildOptions.banner = {
    js: `import { Buffer } from "node:buffer";
globalThis.fleek={env:{${Object.entries(env)
      .map(([key, value]) => `${key}: "${value}"`)
      .join(',')}}};`,
  };

  return buildOptions;
};
