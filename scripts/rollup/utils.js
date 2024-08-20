
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
export function resolvePkgPath(pkgName, isDist=false) {
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