/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-06 15:39:27
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-08-20 14:07:43
 * @FilePath: \react\scripts\rollup\react.config.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

import {
	getPackageJson,
	resolvePkgPath,
	getBaseRollupPlugins
} from './utils.js';

import generatePackageJson from 'rollup-plugin-generate-package-json';

const { name, module } = getPackageJson('react');
// react包路径
const pkgPath = resolvePkgPath(name, false);
// react产物路径
const pkgDistPath = resolvePkgPath(name, true);
export default [
	// react
	{
		input: `${pkgPath}/${module}`,
		output: {
			file: `${pkgDistPath}/index.js`,
			name: 'React.js',
			format: 'umd'
		},
		plugins: [
			...getBaseRollupPlugins(),
			generatePackageJson({
				inputFolder: pkgPath,
				outputFolder: pkgDistPath,
				baseContents: ({ name, description, version }) => {
					return {
						name,
						description,
						version,
						main: 'index.js'
					};
				}
			})
		]
	},
	// jsx-runtime
	{
		input: `${pkgPath}/src/jsx.ts`,
		output: [
			// jsx-runtime
			{
				file: `${pkgDistPath}/jsx-runtime.js`,
				name: 'jsx-runtime',
				format: 'umd'
			},
			// jsx-dev-runtime
			{
				file: `${pkgDistPath}/jsx-dev-runtime.js`,
				name: 'jsx-dev-runtime',
				format: 'umd'
			}
		],
		plugins: getBaseRollupPlugins()
	}
];
