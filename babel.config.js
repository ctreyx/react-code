/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-20 15:13:28
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-08-20 15:13:50
 * @FilePath: \react\babel.config.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
module.exports = {
    presets: ['@babel/preset-env'],
    plugins: [
        [
            '@babel/plugin-transform-react-jsx',
            { throwIfNamespace: false }
        ]
    ]
}