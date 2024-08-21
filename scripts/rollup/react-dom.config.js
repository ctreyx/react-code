/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-06 15:39:27
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-08-20 14:19:31
 * @FilePath: \react\scripts\rollup\react.config.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

import {
	getPackageJson,
	resolvePkgPath,
	getBaseRollupPlugins
} from './utils.js';

import generatePackageJson from 'rollup-plugin-generate-package-json';

import alias from '@rollup/plugin-alias';

const { name, module, peerDependencies } = getPackageJson('react-dom');
// react包路径
const pkgPath = resolvePkgPath(name, false);
// react产物路径
const pkgDistPath = resolvePkgPath(name, true);
export default [
	// react-dom
	{
		input: `${pkgPath}/${module}`,
		output: [
			{
				file: `${pkgDistPath}/index.js`,
				name: 'ReactDom.js',
				format: 'umd'
			},
			{
				file: `${pkgDistPath}/client.js`, //兼容react18
				name: 'client',
				format: 'umd'
			}
		],
		external: [...Object.keys(peerDependencies)],

		plugins: [
			...getBaseRollupPlugins(),
			alias({
				entries: {
					hostConfig: `${pkgPath}/src/hostConfig.ts`
				}
			}),
			generatePackageJson({
				inputFolder: pkgPath,
				outputFolder: pkgDistPath,
				baseContents: ({ name, description, version }) => {
					return {
						name,
						description,
						version,
						peerDependencies: {
							react: version
						},
						main: 'index.js'
					};
				}
			})
		]
	},

	// react-test-utils
	{
		input: `${pkgPath}/test-utils.ts`,
		output: [
			{
				file: `${pkgDistPath}/test-utils.js`,
				name: 'testUtils.js',
				format: 'umd'
			}
		],
		external: ['react', 'react-dom'],
		plugins: getBaseRollupPlugins()
	}
];
