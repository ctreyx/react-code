/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-07 14:37:57
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-08-16 11:15:56
 * @FilePath: \react\packages\react-reconciler\src\beginWork.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { IReactElement } from 'shared/ReactTypes';
import { FiberNode } from './fiber';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import { HostComponent, HostRoot, HostText } from './workTags';
import { mountChildFibers, reconcileChilFiber } from './childFiber';

/**
 * 递归中，递阶段 ， 不断返回子节点
 */

export const beginWork = (fiberNode: FiberNode) => {
	// 比较，返回子fiber

	switch (fiberNode.tag) {
		case HostRoot:
			return updateHostRoot(fiberNode);

		case HostComponent:
			return updateHostComponent(fiberNode);

		case HostText: //<div>xx</div>   div下面没有子节点
			return null;
		default:
			if (_DEV_) {
				console.error(`Unknown node type: ${fiberNode.tag}`);
			}
			break;
	}

	return fiberNode;
};

function updateHostRoot(wip: FiberNode) {
	const baseState = wip.memoizedState;
	const updateQueue = wip.updateQueue as UpdateQueue<Element>;
	const pengding = updateQueue.shared.pending;

	updateQueue.shared.pending = null;

	// 最新状态
	const { memoizedState } = processUpdateQueue(baseState, pengding);

	wip.memoizedState = memoizedState;

	const nextChildren = wip.memoizedState;

	reconcileChildren(wip, nextChildren);

	return wip.child;
}

function updateHostComponent(wip: FiberNode) {
	const nextProps = wip.pendingProps;
	const nextChildren = nextProps.children;
	reconcileChildren(wip, nextChildren);

	return wip.child;
}
function reconcileChildren(wip: FiberNode, children?: IReactElement) {
	const current = wip.alternate;

	if (current !== null) {
		// 更新，追踪副作用
		wip.child = reconcileChilFiber(wip, current?.child, children);
	} else {
		// 挂载的时候第一次渲染存在大量插入，不追踪副作用
		wip.child = mountChildFibers(wip, null, children);
	}
}
