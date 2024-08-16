/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-07 14:39:13
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-08-16 10:11:27
 * @FilePath: \react\packages\react-reconciler\src\workLoop.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { beginWork } from './beginWork';
import { commitMutationEffects } from './commitWork';
import { completeWork } from './completeWork';
import { createWorkInProgress, FiberNode, FiberRootNode } from './fiber';
import { MutationMask, NoFlags } from './fiberFlags';
import { HostRoot } from './workTags';

let workInProgress: FiberNode | null = null; //当前指向

function prepareFreshStack(root: FiberRootNode) {
	// 当前获取的是root，不能当作workInProgress
	workInProgress = createWorkInProgress(root.current, {});
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
export const scheduleUpdateOnFiber = (fiber: FiberNode) => {

 

	const root = markUpdateFromFiberToRoot(fiber);

 

	renderRoot(root);
};

/**
 * renderRoot 触发更新， 常见的是 1. ReactDOM.createRoot().render  2.setState
 * @param root
 */
function renderRoot(root: FiberRootNode) {
	// 初始化工作单元
	prepareFreshStack(root);

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

	// 重置
	root.finishedWork = null;

	// 判断是否存在3个阶段需要执行
	const subtreeHasEffect =
		(finishedWork.subtreeFlags & MutationMask) !== NoFlags;
	const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;

	//commit阶段功能: 1. fiber树的切换 2. 执行Placement对应操作。
	if (subtreeHasEffect || rootHasEffect) {
		// 1.beforeMutation

		commitMutationEffects(finishedWork);
		// 2.mutation Placement
		root.current = finishedWork; //1. fiber树的切换
		// 3.layout
	} else {
		root.current = finishedWork;
	}
}

function workLoop() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}

function performUnitOfWork(fiberNode: FiberNode) {
	const next = beginWork(fiberNode);

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
