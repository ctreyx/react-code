/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-07 14:39:13
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-09-07 15:24:01
 * @FilePath: \react\packages\react-reconciler\src\workLoop.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { scheduleMicroTask } from 'hostConfig';
import { beginWork } from './beginWork';
import {
	commitHookEffectListCreate,
	commitHookEffectListDestroy,
	commitHookEffectListUnmount,
	commitMutationEffects
} from './commitWork';
import { completeWork } from './completeWork';
import {
	createWorkInProgress,
	FiberNode,
	FiberRootNode,
	PendingPassiveEffects
} from './fiber';
import { MutationMask, NoFlags, PassiveMark } from './fiberFlags';
import {
	getHightestPriorityLane,
	Lane,
	markRootFinished,
	mergeLanes,
	NoLane,
	SyncLane
} from './fiberLanes';
import { flushSyncCallbacks, scheduleSyncCallback } from './syncTaskQueue';
import { HostRoot } from './workTags';
import {
	unstable_scheduleCallback as scheduleCallback,
	unstable_NormalPriority as NormalPriority
} from 'scheduler';
import { HookHasEffect, Passive } from './hookEffectTags';

let workInProgress: FiberNode | null = null; //当前指向
let wipRootRenderLane: Lane = NoLane; //本次更新的lane
let rootDoesHasPassiveEffects: Boolean = false; //是否需要调用副作用

function prepareFreshStack(root: FiberRootNode, lane: Lane) {
	// 当前获取的是root，不能当作workInProgress
	workInProgress = createWorkInProgress(root.current, {});

	wipRootRenderLane = lane;
}

//拿到fiber，找到根
function markUpdateFromFiberToRoot(fiber: FiberNode) {
	let node = fiber;
	let parent = node.return;
	//如果是普通fiber，会有return  如果是hostFiber，没有return
	while (parent !== null) {
		node = parent;
		parent = node.return;
	}

	//如果是hostfiber,则返回
	if (node.tag === HostRoot) {
		return node.stateNode;
	}

	return null;
}

// 调度功能
export const scheduleUpdateOnFiber = (fiber: FiberNode, lane: Lane) => {
	const root = markUpdateFromFiberToRoot(fiber);

	markRootUpdate(root, lane);

	// renderRoot(root);
	ensureRootIsScheduled(root);
};

// 保证root被调度
function ensureRootIsScheduled(root: FiberRootNode) {
	const updateLane = getHightestPriorityLane(root.pendingLanes);

	if (updateLane === NoLane) {
		return;
	}

	if (updateLane === SyncLane) {
		// 同步优先级 微任务调度
		if (_DEV_) {
			console.log('微任务中调度 ' + updateLane);
		}

		// 比如setstate调用3次，这里会保存3次的回调，然后一起执行
		scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root, updateLane));
		// 同步任务调度,会通过微任务调用
		scheduleMicroTask(flushSyncCallbacks);
	} else {
		// 其他优先级 红任务
	}
}

function markRootUpdate(root: FiberRootNode, lane: Lane) {
	root.pendingLanes = mergeLanes(root.pendingLanes, lane);
}

/**
 * renderRoot 触发更新， 常见的是 1. ReactDOM.createRoot().render  2.setState
 * @param root  performSyncWorkOnRoot 同步更新的入口
 */
function performSyncWorkOnRoot(root: FiberRootNode, lane: Lane) {
	const nextLane = getHightestPriorityLane(root.pendingLanes);

	// 避免连续调用，这里判断,比如其他比syncLane低的优先级，或者nolane，则不执行同步更新
	if (nextLane !== SyncLane) {
		ensureRootIsScheduled(root);
		return;
	}

	if (_DEV_) {
		console.warn('render阶段开始');
	}

	// 初始化工作单元
	prepareFreshStack(root, lane);

	do {
		try {
			workLoop();
			break;
		} catch (e) {
			if (_DEV_) {
				console.warn('workLoop error', e);
			}

			workInProgress = null;
		}
	} while (true);

	const finishedWork = root.current.alternate;
	root.finishedWork = finishedWork;

	root.finishedLane = lane; //保存本次消费的lane
	wipRootRenderLane = NoLane;
	// commit阶段
	commitRoot(root);
}

function commitRoot(root: FiberRootNode) {
	const finishedWork = root.finishedWork;

	if (!finishedWork) {
		return;
	}
	if (_DEV_) {
		console.log('commitRoot阶段', finishedWork);
	}

	const lane = root.finishedLane;

	if (lane === NoLane && _DEV_) {
		console.log('commit阶段finishedLane不应该是nolane');
	}

	// 重置
	root.finishedWork = null;
	root.finishedLane = NoLane;
	markRootFinished(root, lane);

	if (
		(finishedWork.flags & PassiveMark) !== NoFlags ||
		(finishedWork.subtreeFlags & PassiveMark) !== NoFlags
	) {
		if (!rootDoesHasPassiveEffects) {
			rootDoesHasPassiveEffects = true;

			// 调度副作用
			scheduleCallback(NormalPriority, () => {
				// 执行副作用
				flushPassiveEffects(root.pendingPassiveEffects);
				return;
			});
		}
	}
	// 判断是否存在3个阶段需要执行
	const subtreeHasEffect =
		(finishedWork.subtreeFlags & MutationMask) !== NoFlags;
	const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;

	//commit阶段功能: 1. fiber树的切换 2. 执行Placement对应操作。
	if (subtreeHasEffect || rootHasEffect) {
		// 1.beforeMutation

		commitMutationEffects(finishedWork, root);
		// 2.mutation Placement
		root.current = finishedWork; //1. fiber树的切换
		// 3.layout
	} else {
		root.current = finishedWork;
	}

	rootDoesHasPassiveEffects = false;
	ensureRootIsScheduled(root);
}

function flushPassiveEffects(pendingPassiveEffects: PendingPassiveEffects) {
	pendingPassiveEffects.unmount.forEach((effect) => {
		commitHookEffectListUnmount(Passive, effect); // Passive = useEffect
	});
	pendingPassiveEffects.unmount = [];

	// 先遍历上次存储的destory
	pendingPassiveEffects.update.forEach((effect) => {
		commitHookEffectListDestroy(Passive | HookHasEffect, effect);
	});

	// 在便利本次更新的
	pendingPassiveEffects.update.forEach((effect) => {
		commitHookEffectListCreate(Passive | HookHasEffect, effect);
	});

	pendingPassiveEffects.update = [];

	// useEffect中可能也存在setState ,这里调用下
	flushSyncCallbacks();
}

function workLoop() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}

function performUnitOfWork(fiberNode: FiberNode) {
	const next = beginWork(fiberNode, wipRootRenderLane);

	fiberNode.memoizedProps = fiberNode.pendingProps;

	if (next === null) {
		// 处理到达底层，开始归
		completeUnitOfWork(fiberNode);
	} else {
		// 处理子fiber
		workInProgress = next;
	}
}

// 遍历兄弟，然后往上
function completeUnitOfWork(fiberNode: FiberNode) {
	let node: FiberNode | null = fiberNode;

	do {
		completeWork(node);
		const sibling = node.sibling;
		if (sibling !== null) {
			workInProgress = sibling;
			return;
		}
		node = node.return;
		workInProgress = node;
	} while (node !== null);
}
