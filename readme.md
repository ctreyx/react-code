<!--
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-06 11:23:37
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-08-06 13:52:34
 * @FilePath: \react\readme.md
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->

# React 源码

通过 mono-repo 管理

# 1.初始化

1. pnpm init
2. pnpm-workspace.yaml -- 定义工作空间的根目录
3. 代码规范检查 pnpm i eslint -D -w (-w 是指依赖安装在根目录下)
4. 新建.gitignore
5. npx eslint --init
6. pnpm i -D -w @typescript-eslint/eslint-plugin @typescript-eslint/parser typescript
7. pnpm i prettier -D -w 新建 .prettierrc.json 配置文件，添加配置：
8. pnpm i eslint-config-prettier eslint-plugin-prettier -D -w 在package.json新增命令 "lint": "eslint --ext .ts,.jsx,.tsx --fix --quiet ./packages"

9. pnpm i husky -D -w  ,拦截git命令 
10.  npx husky install 初始化,需要初始化 git init
