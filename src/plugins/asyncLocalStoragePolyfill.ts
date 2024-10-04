import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { OnLoadArgs, OnResolveArgs, Plugin, PluginBuild } from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const asyncLocalStoragePolyfill: () => Plugin = () => {
  return {
    name: 'replace-async-local-storage',
    setup(build: PluginBuild) {
      build.onResolve({ filter: /async_hooks/ }, (args: OnResolveArgs) => {
        if (args.path === 'async_hooks' || args.path === 'node:async_hooks') {
          const filePath = path.resolve(__dirname, 'polyfills', 'async_hooks.js');
          return {
            path: filePath,
            namespace: 'replace-als',
          };
        }
      });

      build.onLoad({ filter: /.*/, namespace: 'replace-als' }, async (args: OnLoadArgs) => {
        const contents = await fs.readFile(args.path, 'utf8');

        return {
          contents,
          loader: 'js',
        };
      });
    },
  };
};
