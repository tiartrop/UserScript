import path from 'path';
import { fileURLToPath } from 'url';
import { definePlugins } from '@gera2ld/plaid-rollup';
import alias from "@rollup/plugin-alias";
import nodePolyfills from 'rollup-plugin-polyfill-node';
import userscript from 'rollup-plugin-userscript';
import pkg from './package.json' with { type: 'json' };

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
// 防止特殊直播间重复执行脚本
if (location.href.match(/live.bilibili.com\\/[0-9]+/) && unsafeWindow.__initialState && unsafeWindow.__initialState.BaseInfo) return;
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
