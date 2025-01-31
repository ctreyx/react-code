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

跳过

1. 到react-dom创建test-utils文件进行测试，然后因为是测试包，我们希望单独引入react和react-dom包

2. 配置scripts，在react-dom下打包配置react-test-utils,并且排除react和reactDom包

3. 安装测试环境包 pnpm i -D -w jest jest-config jest-environment-jsdom

4. 然后在script/jest/jest.config.js 测试配置

5. 在react/src 创建 **test** 测试用例 ,并且复制用力

6. pnpm test会报错，因为不支持jsx,所以需要转移
   pnpm i -D -w @babel/core @babel/preset-env @babel/plugin-transform-react-jsx

# 15. setState update 更新阶段

beginWork需要处理: 1.childDeletion 2.节点移动

compeleWork ## 标记阶段 ##: 1.处理hostText内容更新 2.处理hostComponent属性变化

commitWork:1. 对于childDeletion，遍历删除的子树

useState: 1. 实现update阶段的链表

beginWork流程:

1. 现阶段处理单一节点，需要处理 singleElement , singeTextNode. 比较流程需要判断是否可以复用current fiber

2. ChildReconciler 方法中， reconcileSingleElement 和 reconcileSingleTextNode 函数通过判断type key 决定是否复用fiber,不然进行删除标记 --> 创建 deleteChild函数进行删除标记 --> 并且给 reconcileChildrenFibers 添加删除的兜底情况

3. completeWork 函数中，判断HostText的新旧content是否相同，然后进行标记更新. HostComponent的原理一样，只不过HostComponent属性较多这么不写

commitWork流程:

1. commitMutationEffectsOnFiber 中 进行update操作。

2. 在hostConfig中新增 commitUpdate

3. 通过获取fiber身上的content,更新在实例上。

4. ChildDeletion 删除，创建 commitDeletion

commitDeletion : 比较复杂，需要根据子树判断:

1. 对于fc组件，需要解绑useEffect unmount执行，解绑ref
2. 对于hostComponent,解绑ref
3. 对于子树的根hostComponent,移除dom

所以是一个递归 , 比如 div下面很多子，需要删除，或者是App，不能删除App，需要往下找根节点

4. commitNestedComponent根据不同tag进行处理。

updateState流程:

1. 新建 HooksDispatcherOnUpdate , updateState 中 updateWorkInProgressHook 实现计算最新数据，那么问题:1.hook数据哪里来 2.交互阶段触发的更新

#对比 mountWorkInProgressHook， mountWorkInProgressHook只需要新建链表即可#

2. updateWorkInProgressHook返回当前的hook --> 通过定义 currentHook 判断，第一次进入没有currentHook ， 所以需要获取状态,通过 currentlyRenderingFiber.alternate 获取上次的hook链表 memoizedState --> 然后 newHook保存上次的状态

然后通过计算，可以获取最新的值，更新在hook上。

# 总结hooks

在mount绑定链表的时候， workInProgressHook 绑定第一个hook,并且通过 currentlyRenderingFiber 给当前的fiber memoizedState绑定第一个hook. 在后续的hook调用中，通过 ## workInProgressHook.next绑定下一个hook ，构成链表结构 ##. 例如 useState,给当前hook绑定初始值，然后创建queue更新链表，赋值 memoizedState 保存状态。

在update得时候，dispatchSetState --> 获取action构成更新动作，插入到 updateQueue 中。 -- > updateWorkInProgressHook 获取fiber.alternate老的状态身上 memoizedState , 在第二个hook调用，获取上次hook.next拿到第二个hook .

# 16. react 事件系统

1. react事件在completeWork创建dom的时候，绑定 --> 在react-dom下创建 SyntheticEvent.ts --> updateFiberProps 函数为dom绑定props

2. 然后再 createInstance 的时候调用。

3. completeWork update阶段更新props

4. 创建 initEvent 函数，初始化事件，在container进行事件监听 --> dispatchEvent 获得事件源进行事件捕获和冒泡收集事件，然后创建合成事件

5. createSyntheticEvent 合成事件就是将原始事件 stopPropagation 替换 成我们的事件，最后进行处理 triggerEventFlow

6. 最后在 createRoot 注册事件

# 17.多节点diff

当前仅支持单一节点，比如type变化或者key变化

1. 改造之前的单一节点方法, 在childFiber 改动 reconcileSingleElement ,reconcileSingleTextNode 。

2. 多节点流程: 1.将current中同级fiber保存在map中2.遍历newChild,对于每个遍历的element,存在两种情况:a.存在对应current fiber,且可以服用 b.不存在或者不能服用3.判断是插入还是移动4.最后map中剩下的标记删除

3. reconcileChildrenArray --> 1.将current中同级fiber保存在map中 , current是fiber,通过sibing找兄弟，newChild是reactElement ，定义 existingChildren ,将currentChild遍历存储

--> 2. 遍历newChild , a.存在对应current fiber, 且可以服用 b.不存在或者不能服用 .

--> updateFromMap 函数，对比新老child,判断 type和key是否一致，一致复用，删除map中，不一致的创建新的fiber，然后不删除map,最好将map中剩余的全部删除。

--> 最后定义 lastPlacedIndex ,lastNewFiber,firstNewFiber, 通过判断 lastPlacedIndex ，判断新节点是否需要移动. 通过不断标记lastPlacedIndex, 得到前两个节点index大于last, 后面的a1是小于的，说明有移动

4. commit 插入操作
   --> commitPlacement 函数进行插入
   --> getHostSibling 找到位移节点, 先向下查找，先找兄弟，比如是hostText或者hostComponent，如果没有兄弟，就向上找，直到找到兄弟节点
   --> insertOrAppendPlacementNodeIntoContainer 传入before相对位置，进行插入。

总结: reconcileChildrenFibers 中 判断是不是多节点, reconcileChildrenArray 函数中通过 map映射表判断新老节点是否有位移，然后打上flags. 最后commitPlacement找到位移节点，进行位移。

将兜底删除 改为 deleteRemainingChildren

# 18. fragment

1. reconcileChildrenFibers --> 判断是不是fragement,然后直接取其儿子（这是第一种情况，fragment包裹子

2. reconcileSingleElement 判断 REACT_FRAGMENT_TYPE -->在下面创建fiber的时候判断type

3. updateFromMap 中也需要判断fragment , 最后数组改为直接当fragment

4. beginWork中新增fragment判断

5. completework 中 新增判断

6. 删除情况也需要优化 commitDeletion

7. jsx 导出 Fragment ， jsx-dev-runtime 导出

总结 : fragment就是没有节点，需要返回他的children进行渲染。

# 19.批处理

我们当前实现的流程都是同步，且多次操作会多次更新，所以需要进行批处理优化。

vue react都是在微任务前进行批量更新，但是包裹 startTransition 后，react是微任务后红任务前更新。

1. 批处理就是同时触发多个setstate,比如点击事件连续触发setstate，但是以前的 enqueueUpdate 是直接覆盖，我们需要构造链表.

# pending 永远是最后一个，pending.next又永远是第一个 顺序是固定

# 20.lane模型

<!-- 1.实现lane,每个更新都要优先级  -->

# 为什么lane可以实现不同事件级别的优先级？因为 processUpdateQueue 是链表更新，每个update都绑定了lane,每次render会执行最高等级的lane,在processUpdateQueue的时候会判断lane是否是当前执行的lane，这样就可以执行优先级更高的lane

1. 新创建fiberLanes.ts, lane作为update的优先级,lanes作为lane的集合. lane的产生对于不同情况触发的更新，会产生lane,为后续不同事件产生的优先级做准备.

2. dispatchSetState 中创建 lane，传入 craeteUpdate中. 需要在update中放入优先级. --> updateContainer 也需要更新

3. 我们需要知道那些lane被消费，还剩那些lane --> 在 fiberRootNode 新增字段。

<!-- 2.能够合并一个红任务/微任务触发的更新 -->
<!-- 3.需要一套算法，用于决定那个优先级进入render阶段 -->

总结： 在 scheduleUpdateOnFiber 中，之前都是 renderRoot 进行同步吊度，现在新增lane,走 ensureRootIsScheduled . 然后 ensureRootIsScheduled 中判断lane是不是同步，创建 scheduleSyncCallback执行同步队列方法，将触发更新放入 syncQueue 队列中，最后通过 scheduleMicroTask 微任务方法进行调用。 所以常规是微任务执行更新。

1. 我们现在更新都是在 scheduleUpdateOnFiber 触发，所以需要传入lane

2. scheduleUpdateOnFiber函数中，需要给root标记 pendingLanes ,记录在fiberRoot中。

3. 之前是直接进入 renderRoot ， 现在进入 ensureRootIsScheduled ，通过lane决定优先级。
   这也是之前为什么普通是微任务， startTransition 是宏任务调度，就在于此。

4. syncTaskQueue.ts 文件编写同步任务调度方法

5. hostConfig中写 微任务调度 ,判断是否支持微任务，不支持通过promise.then模拟，如果promise也不支持就走settimeout宏任务

6. ensureRootIsScheduled 中将 performSyncWorkOnRoot push到同步队列中，然后将 执行同步方法放在微任务中。 --> performSyncWorkOnRoot 需要获取最新的lane判断是不是同步，避免出错。

# 21.render阶段针对lane的改造 (lane为什么可以根据不同优先级更新)

processUpdateQueue 方法消费update的时候需要考虑:1.lane 2.update现在是链表，需要遍历

7. prepareFreshStack 传入当前更新的lane,定义 wipRootRenderLane 保存起来，并且将本次消费的lane绑定在root身上，然后进入workloop阶段. --> beginWork传入 wipRootRenderLane

8. updateFunctionComponent 和 updateHostRoot 传入lane --> processUpdateQueue 传入lane , 需要改造，现在是链表，所以需要do while进行更新值，然后还需要比较 updatelane 与 当前更新的 lane是否一致才更新，这就是为什么lane可以根据不同优先级进行更新的关键。

9. renderWithHooks 需要在文件内定义一个中介 renderLane 保存 renderWithHooks传入的lane,放进 processUpdateQueue

10. commit阶段移除lane , 通过定义 markRootFinished 将root身上的pendinglane移除

11. updateState 中，需要把 queue.shared.pending 清空重置，不然后面更新会缓存上次更新的内容，导致叠加

# 22 useEffect

1. 不同effect副作用可以共用同一个机制，useEffect useLayoutEffect useInsertionEffect. 那么如何区分呢? --> 新增 hookEffectTags.ts 文件，保存不同effect的tag,也是二进制 --> fiberFlags 文件也需要新增一个tag PassiveEffect

2. effect 通过tag Passive,Layout 判断是那个effect . HookHasEffect 标识回调需要执行，所以会给fiberNode 打上 PassiveEffect 的标记。 一般是在执行effect和销毁阶段，打上PassiveEffect标识

3. effect 本身也有next执行下一个effect,所以需要创建 pushEffect 构建effect自身的环状链表.

4. mountEffect 需要将 effect 自身的环状链表存储在 hook.memoizedState 上。

5. 在react/index.ts --> 定义 Dispatcher 和 useEffect

# 23 useEffect的render阶段

commit 阶段需要调用副作用和收集回调，然后commit阶段后执行副作用

1. 安装react的调度器
   pnpm i -w scheduler
   pnpm i -D -w @types/scheduler

2. 收集回调，是放在 rootNodeFiber 身上 pendingPassiveEffects.

commitMutationEffectsOnFiber 收集update回调
commitDeletion 收集unmount回调

3. commit阶段判断有没有effect副作用 --> commitRoot 执行回调
   --> flushPassiveEffects 执行effect ， 需要先执行unmount,然后执行上次effect执行后收集的destory,最后执行update

4. renderWithHooks重置effect链表

上面都是mountEffect的流程

1. updateEffect --> 通过获取之前状态的effect deps 进行对比，如果相等 则不打上 HookHasEffect 的标记，避免后面更新.

2. commitMutationEffects 这个函数需要 新增 PassiveMark 的判断条件，不然无法遍历.

(nextEffect.subtreeFlags & (MutationMask | PassiveMark)) !== NoFlags

# 24 测试用例 跳过

1. react-reconciler 创建test . 然后复制一遍 react-dom ,改名 react-noop-renderer, 只保留 src index package ,然后改名package 和index --> 合成事件删除

# 25. 并发更新

问题: 同步更新，渲染组件过多或者单个组件渲染复杂，造成卡顿.
解决: 以前是同步，现在改成优先级 ， 1.优先级，越小优先级越高 2.饥饿问题，一直没有执行优先级会越来越高 3.时间切片 。 react有5种优先级 同步优先，低优先级，空闲优先级,立即执行优先级

工作过程仅有一个work.

<!-- 交互部份产生优先级 -->

//空闲优先级
unstable_IdlePriority as IdlePriority,
//低优先级
unstable_LowPriority as LowPriority,
//用户阻塞优先级
unstable_UserBlockingPriority as UserBlockingPriority,
//普通优先级
unstable_NormalPriority as NormalPriority,
//立刻执行的优先级
unstable_ImmediatePriority as ImmediatePrity,
// 当某一个preform正在被调度，但是还没被执行时，可以使用该函数进行取消
unstable_cancelCallback as cancelCallback,
// 用于调度preform方法
unstable_scheduleCallback as scheduleCallback,
// 当前帧是否用尽了, 用尽了为true，此时需要中断任务
unstable_shouldYield as shouldYield,
// 返回当前正在调度的任务
unstable_getFirstCallbackNode as getFirstCallbackNode,

1. 不同事件附有不同的优先级,需要更新合成事件 --> eventTypeToSchdulerPriority 赋予每个事件优先级 --> triggerEventFlow 赋予优先级 会产生全局上下文优先级，所以在更新的时候 --> requestUpdateLanes 拿到优先级

2. 调度器的优先级和lane的优先级不同，需要转换。 requestUpdateLanes --> 需要获取调度器优先级转为lane

<!-- 扩展调度阶段 -->

将render阶段变为可以中断。

1. ensureRootIsScheduled 宏任务将lane转为schedulerPriority --> 同步任务是通过 performSyncWorkOnRoot 触发更新，宏任务需要创建 performConcurrentWorkOnRoot 并发更新.

2. 新创建 renderRoot 函数，可以判断是否是同步或切片可中断，将之前的workloop改为 workLoopSync 和 workLoopConcurrent . 这样根据同步和切片不同render.

3. performSyncWorkOnRoot 是同步， performConcurrentWorkOnRoot 是可以中断. fiberrootnode新增两个参数 callbackNode callbackPriority.

4. ensureRootIsScheduled 会获取当前的lane和root存在的之前调度 --> 如果当前root不需要更新lane,则取消之前存在的调度. --> 如果现在和之前的lane一致，则不管 --> 不相同有更高级的任务，先取消之前existingCallback 然后创建新的 newCallbackNode --> 最后存储在root身上.

5. performConcurrentWorkOnRoot 需要执行完 所有的 effect,可能effect存在更改优先级，那就终止当前

6. prepareFreshStack 初始化root.finishedLane = NoLane; root.finishedWork = null;

# 26 并发更新的状态计算

我们需要对比 1.优先级是否足够 ,lane数值大小对比不灵活 2.如何兼顾update的连续性和优先级?

1. processUpdateQueue 过去只有简单的同步更新，现在需要新增优先级对比.

2. update的连续性和优先级是指可能中间有个优先级高的，导致最后的结果不一致。
   所以新增 baseQueue, baseState是本次更新参与计算的初始state 和 memoizedState 字段是上次更新计算的最终state.

就是 u1 u2 u3 ,u2优先级低没有参与，导致结果有误。 过程 u2被跳过，会将u2放进 baseQueue 中，然后将跳过的后面所有都放进 baseQueue ，但是依然计算他们结果，只不过将u3等级将为 nolane.

processUpdateQueue 函数改造.

3. updateState 现在改造成可以打断，之前写法造成每次消费pengding后会被清空，我们需要将他存在current中，只要不进入commit阶段，curent和wip不会互换。

# 27. useTransaction

useTransaction的原理很简单，他内部会将transition包裹的callback执行的时候，更改全局 ReactCurrentBatchConfig.transition 状态，在 requestUpdateLanes 获取lane的时候，以前是从 unstable_getCurrentPriorityLevel 上下文获取，现在判断是不是开启transition，从而返回transitionLane

react18默认是同步，我们现在是默认并发更新，需要改为默认同步 --> updateContainer 函数，传入同步更新schduler,requestUpdateLanes 会返回同步更新的lane

1. mountTransition 内部isPending是定义了state，用高优先级更新,返回一个start方法.

2. startTransition ，然后更改 ReactCurrentBatchConfig.transition --> 执行过度函数，改变优先级 ,再还原优先级.

transition会执行两次， 先执行 setPending(true) --> 更改优先级执行callback -->还原优先级

这里 updateState 和 processUpdateQueue 之前写的有问题，要修改

# 28. useRef

useRef原理就是将原生元素hostcomponent div 之类的实例丢入ref.current

1. fiberFlags定义Ref和LayoutMask --> ReactTypes 定义Ref

2. fiberHooks 中定义 mountRef ,很简单就是将initialValue保存到hook.memoizedState即可

# 需要标记ref,mount时存在ref和update时ref发生变化,分别在beginWork和completeWork中。

3. 在 beginwork 文件中创建 markRef 函数标记Ref , updateHostComponent 中调用。

4. completework中也创建markRef,在 HostComponent 中，mount和update都判断标记

# 执行ref绑定操作

分别在mutation和layout阶段,所以在 commitWork封装commitEffects 函数，定义mutation和layout阶段。

5. layout阶段是绑定新ref,mutation是解绑。 commitLayoutEffectsOnFiber 和 commitMutationEffectsOnFiber

6. 组件卸载解绑ref --> commitNestedComponent

7. commitRoot 之前只有mutation阶段，现在新增layout阶段

8. 补充细节,fiber.ts中，createFiberFromElement新增ref

# 29.useContext

1. 创建context --> react/context.ts新增 createContext 函数

# 30.suspense

通过包裹子孙组件，如果祖孙组件在加载状态，渲染fallback状态。 实现流程：如果是通过移除child或fallback，会导致状态无法保存的问题且消耗性能，所以react是采取display:none，通过offscreen显隐child，如果是loading状态，则渲染child的sibling fallback.所以fallback是child的兄弟。 这样susbpense就只有一颗子树，。

原理:实际上，每次都会渲染 child和fallback,只不过会根据 hideOrUnhideAllChildren 传入的hide标识，判断给不给child display:none

1. reactsymbols和worktags新增类型 --> fiber新增createFiberFromElement --> suspense类型。 --> react/index.ts导出 REACT_SUSPENSE_TYPE as Suspense

2. beginWork 判断 SuspenseComponent 组件 --> 需要判断当前是不是suspend挂起状态，如果是，则渲染fallback. --> 这里存在mount时期渲染child和fallback , update时期渲染child和fallback的4种状态。

3. 我们需要构建wip.child指向 offscreen 指向child,然后 offscreen sibling 指向fragment ,fragment儿子是fallback .我们需要构建这样的树

4. 工作流程: completework时需要处理4种状态，需要对比offscreen的mode状态进行切换。 --> 这里进行判断 offscreen.mode状态，然后打上flags标记。 --> commitwork处理flags, commitMutationEffectsOnFiber --> hideOrUnhideAllChildren 会根据当前mode状态，渲染实例

5. 触发流程: 存在初次渲染会渲染两次，首先进入正常child --> 遇到 use挂起状态-->渲染fallback --> 渲染正常child ,所以我们需要除了beginwork和completework外，新增一个unwind(往上遍历祖辈)流程.

todo: use

# 31.use

use可以接受thenable和reactcontext

# 32.性能优化

bailout策略:

1. 将 变化和不变化分离，比如state props context是变化的，命中性能优化的组件可以不通过reconcile生成wip.child，而是直接服用上次更新生成的wip.child ! 注意，是命中性能优化组件的子组件（而不是他本身）不需要render

比如，没有优化前，父组件包含state和setstate的<button /> ,然后还有另一个不需要更改的组件，这样每次更新都会导致不需要更改的组件render一次。 那我们就可以提取需要更改state的组件，再放在父组件，这样每次更新父组件和不需要更改的组件都不会render,只有state更改的组件才会render.

第二种，如果不需要更改的组件包裹在需要更改的组件，比如 <div>{{num}}
<Component /> </div> ,无法像第一种抽离，那么我们将他整个抽离成组件，通过插槽方式渲染 <Component /> ,这样也不会重复render

2. react 内部优化

bailout策略:原理，命中的组件可以不通过reconcile生成wip.child,而是直接复用上次更新的wip.child

a. props不变
b.state不变，不存在update 或 update计算出state没有变化 （比如每次setstate值都一样，那么就不会render）
c.context不变
d.type不变

eagerState策略:不必要更新，没有必要开启后续调度,比如setstate值都一样

1. 在beginWork中，我们每次会通过reconcile生成组件的child,然后在这里需要命中bailout策略。

--> 我们首先判断组件有没有state,没有状态表示不需要更新或者state没有变，所以我通过lanes判断有没有更新。

1. 到fiber中新增lanes和childLanes字段。 --> dispatchSetState 函数中 ，产生lanes， enqueueUpdate 修改传入fiber和lane --> beginwork中将fiber.lanes=nolanes

2. processUpdateQueue 跳过的话，需要新增一个 onSkipUpdate 回调 --> updateState的时候需要调用

3. childLanes 和 subtreeflags类似，一样在bubbleProrerties中冒泡。

4. markUpdateFromFiberToRoot 中每次触发更新，都要冒泡到parent.childLanes

具体实现:

1. 创建 didReceiveUpdate 是否命中bailout策略，false代表命中. beginWork 中会对比四要素，判断是否命中 。 checkScheduledUpdateOrContext 函数是判断本次更新的lane和wip.lanes是否一样，如果一样说明和上次更新一样就命中。

2. 如果命中， bailouOnAlreadyFinishedWork 会 clone wip,复用不需要进入reconcile. 还会判断他的子树需要更新不，如果也命中，直接return null ,向上遍历跳过向下循环。

3. 如果四要素没有命中，还有机会检验，就是 updateHostRoot 会检验两次的state是否一致，如果一致直接 bailouOnAlreadyFinishedWork

4. updateFunctionComponent 中，会在fiberhooks中判断state是否更改更改 didReceiveUpdate , 如果一致，进入 bailouOnAlreadyFinishedWork 跳过render. 并且执行bailoutHook重置他身上的updateQueue,flags,lanes

总结： fibernode身上新增lanes和childLanes , 收集他需要更新的动作。然后等到下次更新的实话，拿到当前展示的alternate,对比现在展示的动作和本次更新的动作是否一致，如果一致则跳过。 --> 如果4要素没有命中，在 updateHostRoot 和 updateFunctionComponent 中对比state是否更新，判断命中与否。

# 33.eagerState

正常流程: 交互-->触发更新-->调度-->render->计算状态 ， eagerState会通过优先计算状态，判断是否走后面调度流程: 交互-->计算状态 -->没有更新不触发调度. 有更新-->触发更新-->调度-->render->计算状态

eagerState需要满足当前fiber没有其他更新，lanes为0得实话才能进入。

1. 在 dispatchSetState 中，判断是否命中eager , 我们需要在 FCUpdateQueue 中新增一个lastRenderState保存上次更新得状态。--> mountState和updateState 中需要保存上次更新得状态。 queue.lastRenderState=memoizedState

2. dispatchSetState通过计算新老状态，如果命中则直接return 不走下面调度 scheduleUpdateOnFiber

# 34.memo

问题：为什么react内部有优化，还是需要优化api？ 比如props，即使每次传入得值是固定不变得，但是还是会更新？ 是因为父组件有更新，无法触发bailout复用，所以每次都会reconciler新的组件出来，导致子组件props都是新的，react内部是通过全等 === 判断新旧props，所以每次都会更新。

1. react/src/memo 创建memo.ts文件，实际上memo就是将函数组件，重新定义为memoComponent,所以这里包裹一下type为REACT_MEMO_TYPE

2. fiber.ts 中 ，createFiberFromElement 创建元素得时候，把包裹得 memocomponent 这里判断，加上fiberTag = MemoComponent

3. beginWork 判断 MemoComponent ,这里进行bailout比较，判断新老props是否一致. 如果不一致，再走updateFunctionComponent重新生成即可。 只不过这里需要改造 updateFunctionComponent ，以前是内部获得component,只不过memo得component在type.type上，需要外部传入。

4. completeWork 这里需要判断 MemoComponent

# 35 useMemo useCallback

useCallback缓存函数，在我们父级定义一个函数变量addOne,传给子级使用，每次子都会更新，是因为每次函数都是render出来浅比较会失败。

很简单，hook定义usememo和usecallback,每次比较deps即可。

useMemo还可以手动bailout，类似于memo,只不过是在父级useMemo(()=><app />,[]),这样缓存函数组件
