import { defineConfig } from 'rollup';
import bilibiliConfig from './bilibili/rollup.config.js';

export default defineConfig(
  [bilibiliConfig()]
)