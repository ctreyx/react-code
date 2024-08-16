/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-06 15:43:38
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-08-15 10:29:15
 * @FilePath: \react\scripts\rollup\utils.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

import path from 'path';
import fs from 'fs';
import ts from 'rollup-plugin-typescript2';
import cjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace'

const pkgPath = path.resolve(__dirname, '../../packages');
const distPath = path.resolve(__dirname, '../../dist/node_modules'); //产物路径

/**
 * @param pkgName
 * @param isDist 是否是产物
 * @returns
 */
export function resolvePkgPath(pkgName, isDist) {
    if (isDist) {
        return `${distPath}/${pkgName}`;
    }
    return `${pkgPath}/${pkgName}`;
}

export function getPackageJson(pkgName) {

    const path = `${resolvePkgPath(pkgName)}/package.json`;
    const str = fs.readFileSync(path, { encoding: 'utf8' });
    return JSON.parse(str);
}

export function getBaseRollupPlugins({
    alias = {
        _DEV_: true,
        preventAssignment: true

    },
    typescript = {}
} = {}) {
    return [replace(alias), cjs(), ts(typescript)]

}