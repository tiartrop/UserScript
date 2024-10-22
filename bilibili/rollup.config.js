import path from 'path';
import { fileURLToPath } from 'url';
import { definePlugins } from '@gera2ld/plaid-rollup';
import alias from "@rollup/plugin-alias";
import nodePolyfills from 'rollup-plugin-polyfill-node';
import userscript from 'rollup-plugin-userscript';
import pkg from './package.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const parentDirectory = path.basename(__dirname);

const pathResolve = (dir) => {
  return path.resolve(__dirname, ".", dir);
};

export default function bilibiliConfig(name = parentDirectory, entry = `${parentDirectory}/src/index`) {
  return {
    input: entry,
    plugins: [
      ...definePlugins({
        esm: true,
        minimize: false,
        postcss: {
          inject: false,
          minimize: true
        },
        extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx']
      }),
      alias({
        entries: [
          {
            find: '@',
            replacement: pathResolve("src"),
          }
        ]
      }),
      nodePolyfills(),
      userscript(meta => meta.replace('process.env.AUTHOR', pkg.author).replace('process.env.VERSION', pkg.version))
    ],
    output: {
      format: 'iife',
      file: `${parentDirectory}/dist/${name}.user.js`,
      banner: `
//-- Don't run on frames or iframes
if (window.top !== window.self) return;
      `,
      footer: '',
      globals: {
        '@violentmonkey/dom': 'VM',
        '@violentmonkey/ui': 'VM',
      },
      indent: false
    }
  }
}
