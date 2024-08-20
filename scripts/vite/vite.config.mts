/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-16 14:04:45
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-08-16 14:38:20
 * @FilePath: \react\scripts\vite\vite.config.mts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import replace from '@rollup/plugin-replace';
import { resolvePkgPath } from '../rollup/utils';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		replace({
			_DEV_: true,
			preventAssignment: true
		})
	],
	resolve: {
		alias: [
			{
				find: 'react',
				replacement: resolvePkgPath('react')
			},
			{
				find: 'react-dom',
				replacement: resolvePkgPath('react-dom')
			},
			{
				find: 'hostConfig',
				replacement: path.resolve(
					resolvePkgPath('react-dom'),
					'./src/hostConfig.ts'
				)
			}
		]
	}
});
