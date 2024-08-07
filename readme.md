<!--
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-06 11:23:37
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-08-07 15:43:51
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

//不安装husky，跳过9. pnpm i husky -D -w ,拦截git命令10. npx husky install 初始化,需要初始化 git init

11. 配置 tsconfig.json
12. pnpm i -D -w rollup --> 新建 scripts / rollup 文件

# 2.jsx

1. packages新建react文件夹，并且pnpm init ,创建 src/jsx.ts
2. 构建jsx 函数，并且新创建一个shared包，共享方法和type
3. 在react包package.json中，添加 "dependencies": {
   "shared": "workspace:\*"
   }, 因为依赖了shared的内容。

# 3.打包

1. scripts/rollup/react.config 配置打包

# 4.创建react项目

1. 进入dist/node_modules/react 执行pnpm link --global
2. 回到根目录， npx create-create-app react-demo
3. cd react-demo中,pnpm start 开始项目
4. 删掉index.js中内容，避免报错
5. pnpm link react--global 将react包指向我们自己的包

# react中Reconciler架构(协调器)

jsx通过babel编译后 -> ReactElement -> fiberNode ->dom

# FiberNode是工作单元，通过ReactElement比较后，生成fiberNode,并且打上对应标记，比如placement就是插入新标签。当所有ReactElement比较完后，会生成一颗fiberNode树,一共存在两颗： current是当前真实的fiberNode树，另一颗workingProgress是触发更新后，正在reconciler计算中的树

react是深度优先DFS策略,这个策略存在递和归两个阶段，递对应 beginWork, 归对应 completeWork

1. FiberNode: ReactElement描述有限，无法描述数据之间关系，所以存在一个新的数据结构，介于ReactElement和Dom之间，便是FiberNode

2. packages新建react-reconciler --> pnpm init --> src/fiber.ts

3. 构建 FiberNode 并且定义 workTags文件。 然后pnpm i 下载shared包。

4. 创建 beginWork, completeWork , workLoop 文件

5. workLoop -->  renderRoot开始工作单元 (workInProgress是当前fiber指向) -->  workLoop函数如果当前 workInProgress 不为null 继续执行 performUnitOfWork 

6. performUnitOfWork 函数，先通过 beginWork 向下遍历 ，到达底层 执行 completeUnitOfWork 开始 向上归.

7.  completeUnitOfWork 函数向上归，先便利兄弟，然后父级
