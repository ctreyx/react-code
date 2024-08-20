# React 源码

react内部包含3个阶段:

1. schedule阶段，调度阶段，也就是执行更新，比如触发setstate
2. render阶段(beginWork,completeWork)
3. commit阶段(commitWork)

current是当前真实的fiberNode树，另一颗workingProgress是触发更新后，正在reconciler计算中的树

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

# 5.react中Reconciler架构(协调器)

jsx通过babel编译后 -> ReactElement -> fiberNode ->dom

# FiberNode是工作单元，通过ReactElement比较后，生成fiberNode,并且打上对应标记，比如placement就是插入新标签。当所有ReactElement比较完后，会生成一颗fiberNode树,一共存在两颗： current是当前真实的fiberNode树，另一颗workingProgress是触发更新后，正在reconciler计算中的树

react是深度优先DFS策略,这个策略存在递和归两个阶段，递对应 beginWork, 归对应 completeWork

1. FiberNode: ReactElement描述有限，无法描述数据之间关系，所以存在一个新的数据结构，介于ReactElement和Dom之间，便是FiberNode

2. packages新建react-reconciler --> pnpm init --> src/fiber.ts

3. 构建 FiberNode 并且定义 workTags文件。 然后pnpm i 下载shared包。

4. 创建 beginWork, completeWork , workLoop 文件

5. workLoop --> renderRoot开始工作单元 (workInProgress是当前fiber指向) --> workLoop函数如果当前 workInProgress 不为null 继续执行 performUnitOfWork

6. performUnitOfWork 函数，先通过 beginWork 向下遍历 ，到达底层 执行 completeUnitOfWork 开始 向上归.

7. completeUnitOfWork 函数向上归，先便利兄弟，然后父级

8. renderRoot 触发更新， 常见的是 1. ReactDOM.createRoot().render 2.setState。

9. 创建链表 updateQueue.ts

10. fiber.ts中创建fiberRootNode,定义 Container , 并且在tsconfig中配置，因为需要全局引用，所以不希望引用路径被定死 --> 定义FiberRootNode 根节点。

11. 创建 fiberReconciler.ts , 这里是根root节点。 createContainer 和 updateContainer 函数。

12. 在workloop中，我们需要调用 renderRoot ,所以需要创建 scheduleUpdateOnFiber 调度功能，获取root 进行 renderRoot。
    注意 scheduleUpdateOnFiber 功能需要在 updateContainer 调用，才可以串联两者。 而prepareFreshStack函数则需要创造 workInProgress
13. createWorkInProgress 函数， 主要是从根root获取双缓存进行更新

# 6.首屏渲染流程 mount beginWork

更新流程的目的：生成wip fiberNode树，标记副作用flags, 进入 递 归 流程

1. pnpm i -D -w @rollup/plugin-replace , 为了增加开发的dev标识，--> 在rollup/utils中新增。 比如某些报错希望是开发环境出现，非生成环境。--> reconciler.d.ts

2. performUnitOfWork --> beginWork 当前阶段是首屏渲染阶段，所以是从根节点开始 --> 所以先定义三个判断 --> 如果是hostRoot跟节点， updateHostRoot会创建链表, beginwork是递作用不断往下，所以是不断返回儿子 --> 如果是 updateHostComponent 不是根节点，直接创造儿子返回 -- > 如果只是文本，直接返回null ,因为文本没有下面子节点

3. reconcileChildren 的作用就是为当前fiber,通过reactElement添加子fiber

4. 创建 childrenFiber文件， ChildReconciler 函数接受是否追踪副作用。 这里的作用是，可能首屏渲染的时候存在大量插入，这里需要优化。

5. 这里分几种情况， 第一种如果是 REACT_ELEMENT_TYPE 元素， 则需要 创建 createFiberFromElement 函数， 创建将element转为一个fibernode 。
   --> 如果是文本，则创建 reconcileSingleTextNode 函数 --> 最后通过 placeSingleChild 函数 打上 Placement 标记

# 总结， beginWork 函数作用就是不断 返回子节点 ,在这协调阶段，通过比较fiberNode和reactElement,创建新的fiber并且给fiber打上标识。

# 7.completework

解决问题，在beginwork中，优化ChildReconciler函数大量的插入，我们这里需要把host类型的fibernode构建离屏节点插入。

1. completeWork 是处理底层后，开始归，先遍历兄弟然后往上遍历
2. completeWork 获取当前状态和 alternate 进行对比。
3. 这里需要优化首屏加载，先构建离屏dom 然后 插入dom树种 -->appendAllChildren 函数
4. appendAllChildren 函数，就是将wip插入parent, 可能存在多个子节点需要插入，所以这里需要while .
5. bubbleProperties函数是收集子的副作用，最后集中到父身上.

# 8.commit

commit阶段，分为beforeMutation,mutation,layout阶段，主要任务是 1. fiber树的切换 2. 执行Placement对应操作。

1. commitRoot 先判断是否存在副作用需要处理。 --> commitMutationEffects

2. commitMutationEffects 循环向下遍历，直到最底层，开始处理副作用 --> commitMutationEffectsOnFiber

3. commitMutationEffectsOnFiber 拿到fiber的flags,判断需要那些操作,比如初始化需要placement --> commitPlacement插入操作

4. commitPlacement--> 分两步，第一步找到父级 hostParent ,第二步开始插入 appendPlacementNodeIntoContainer

5. appendPlacementNodeIntoContainer 判断当前fiber是否hostComponent或hostText类型插入，不然向下找儿子。

# 9. reactDom

1. 我们需要处理hostConfig中的dom元素方法，新创建一个react-dom文件夹，然后复制hostConfig文件过来，删除原文件。

2. root.ts 文件中，会暴露createRoot方法，也就是 ReactDOM.createRoot(root),render(<App />) , 我们接收容器，然后返回一个render方法接收jsx组件进行渲染。

3. 新增react-dom的打包配置， 并且我们需要在ts中更改hostConfig指向，在打包的时候也需要额外配置

pnpm i -D -w @rollup/plugin-alias

安装完后，配置alias，替换文件

4. 需要替换package打包命令，统一入口dev.config.js

5. 打包后，进入dis/node_modules/react和react-dom , 运行 pnpm link --global

6. 进入react项目， 运行 pnpm link react --global 和 pnpm link react-dom --global

# 10.FunctionComponent

基础配置:

1.  beginWork中新增function的判断，updateFunctionComponent --> 就是获得child，但是function的儿子是函数执行返回，所以新创一个函数 renderWithHooks

2.  还需要在completeWork中配置function的判断。

3.  打包后可以渲染函数组件

# 11. 第二种调试，用vite

1. 新创项目 pnpm craete vite

2. 删除内容，只剩下 test-fc 文件作为测试单元，然后创建rollup中vite脚本进行配置 --> 最后配置packages中运行指令

# 12. hooks

问题: 1. hooks怎么知道是mount或update? 2. hooks怎么知道自己是不是嵌套在另一个hooks中? 解决方法:hooks有三套，分别对应mount和update,hooks上下文中。运行到什么阶段执行什么阶段的hooks

hooks数据是内部共享，也就是我们引入hooks是从react包，那么reconcile是如何知道的呢？是通过共享获取

1. react包创建-->currentDispatcher.ts --> 存放dispatcher方法，例如useState等.

2. 我们需要中转hooks在react和reconcile的解耦，所以存放在shared中。

3. react和react-dom打包会存在两个internals，所以需要再react-dom打包中排除react的包。 --> 前往打包中排除 external

4. 我们需要记录当前正在执行的fiberNode，拿到hooks,所以需要再fiberHooks.ts 中定义 currentlyRenderingFiber

5. renderWithHooks 函数中，我们需要通过 wip.alternate 是初次渲染还是update,构建不同的hook链表。

# 13.mountUseState

这部作用就是创建hook链表，然后在更新的时候触发链表更新

1. 会首先更改 currentDispatcher.current 内存共享的current指向mount时期的hook链表.

2. 调用useState的时候 mountState ，会创建hook , 然后获取初始值 , 然后给当前 hook 创建一个更新链表 queue.

3. dispatch方法 就是 dispatchSetState.bind 绑定 fiber 和 更新队列 和 action ，等触发的时候 执行 -- > 然后触发 scheduleUpdateOnFiber 进行视图更新

# 14. react测试用例
