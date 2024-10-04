import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { OnLoadArgs, OnResolveArgs, Plugin, PluginBuild } from 'esbuild';

export const fsPolyfill: () => Plugin = () => {
  return {
    name: 'replace-node-fs',
    setup(build: PluginBuild) {
      build.onResolve({ filter: /fs/ }, (args: OnResolveArgs) => {
        if (args.path === 'fs' || args.path === 'node:fs') {
          return {
            path: path.resolve(__dirname, 'polyfills', 'fs.js'),
            namespace: 'replace-fs',
          };
        }
      });

      build.onLoad({ filter: /.*/, namespace: 'replace-fs' }, async (args: OnLoadArgs) => {
        const contents = await fs.readFile(args.path, 'utf8');

        return {
          contents,
          loader: 'js',
        };
      });
    },
  };
};
