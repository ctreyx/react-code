/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-20 14:29:14
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-08-20 16:07:34
 * @FilePath: \react\scripts\jest\jest.config.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const { defaults } = require('jest-config');
module.exports = {
    ...defaults,
    rootDir: process.cwd(),
    modulePathIgnorePatterns: ['<rootDir>/.history'],
    moduleDirectories: [
        // 对于 React ReactDOM
        'dist/node_modules',
        // 对于第三方依赖

        ...defaults.moduleDirectories
    ],
    testEnvironment: 'jsdom'
};