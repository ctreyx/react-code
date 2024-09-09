/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-07 14:37:57
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-09-05 15:17:25
 * @FilePath: \react\packages\react-reconciler\src\beginWork.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { IReactElement } from 'shared/ReactTypes';
import { FiberNode } from './fiber';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText,
	Fragment
} from './workTags';
import { mountChildFibers, reconcileChilFiber } from './childFiber';
import { renderWithHooks } from './fiberHooks';
import { Lane } from './fiberLanes';

/**
 * 递归中，递阶段 ， 不断返回子节点
 */

export const beginWork = (fiberNode: FiberNode, renderLane: Lane) => {
	// 比较，返回子fiber

	switch (fiberNode.tag) {
		case HostRoot:
			return updateHostRoot(fiberNode, renderLane);

		case HostComponent:
			return updateHostComponent(fiberNode);

		case FunctionComponent:
			return updateFunctionComponent(fiberNode, renderLane);

		case Fragment:
			return updateFragment(fiberNode);

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

function updateFragment(wip: FiberNode) {
	const nextChildren = wip.pendingProps; //fragment的children
	reconcileChildren(wip, nextChildren);

	return wip.child;
}

// 函数组件的child，是执行后的结果
function updateFunctionComponent(wip: FiberNode, renderLane: Lane) {
	const nextChildren = renderWithHooks(wip, renderLane);
	reconcileChildren(wip, nextChildren);

	return wip.child;
}

function updateHostRoot(wip: FiberNode, renderLane: Lane) {
	const baseState = wip.memoizedState;
	const updateQueue = wip.updateQueue as UpdateQueue<Element>;
	const pengding = updateQueue.shared.pending;

	updateQueue.shared.pending = null;

	// 最新状态
	const { memoizedState } = processUpdateQueue(baseState, pengding, renderLane);

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
