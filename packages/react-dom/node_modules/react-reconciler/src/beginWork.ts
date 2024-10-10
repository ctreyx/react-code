/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-07 14:37:57
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2024-10-08 11:04:54
 * @FilePath: \react\packages\react-reconciler\src\beginWork.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { IReactElement } from 'shared/ReactTypes';
import {
	createFiberFromFragment,
	createFiberFromOffscreen,
	createWorkInProgress,
	FiberNode,
	OffscreenProps
} from './fiber';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText,
	Fragment,
	ContextProvider,
	SuspenseComponent,
	OffscreenComponent,
	MemoComponent
} from './workTags';
import {
	cloneChildFibers,
	mountChildFibers,
	reconcileChilFiber
} from './childFiber';
import { bailoutHook, renderWithHooks } from './fiberHooks';
import { includeSomeLanes, Lane, NoLanes } from './fiberLanes';
import { ChildDeletion, Placement, Ref } from './fiberFlags';
import { pushProvider } from './fiberContext';
import { shallowEqual } from 'shared/shallowEquals';

// 是否命中bailout策略，false代表命中
let didReceiveUpdate = false;

export function markWipReceivedUpdate() {
	didReceiveUpdate = true;
}

/**
 * 递归中，递阶段 ， 不断返回子节点
 */

export const beginWork = (fiberNode: FiberNode, renderLane: Lane) => {
	// bailout 策略
	didReceiveUpdate = false;
	const current = fiberNode.alternate;
	if (current !== null) {
		const oldProps = current.memoizedProps;
		const newProps = fiberNode.pendingProps;

		//  四要素 props和type
		if (oldProps !== newProps || fiberNode.type !== current.type) {
			didReceiveUpdate = true;
		} else {
			// props没有变化，type也没有变化，检查state context
			const hasScheduledStateOrContext = checkScheduledUpdateOrContext(
				current,
				renderLane
			);

			if (!hasScheduledStateOrContext) {
				// 命中bailout
				didReceiveUpdate = false;

				switch (fiberNode.tag) {
					case ContextProvider:
						const newValue = fiberNode.memoizedProps.value;
						const context = fiberNode.type._context;
						pushProvider(context, newValue);
						break;
				}

				return bailouOnAlreadyFinishedWork(fiberNode, renderLane);
			}
		}
	}

	fiberNode.lanes = NoLanes;

	// 比较，返回子fiber

	switch (fiberNode.tag) {
		case HostRoot:
			return updateHostRoot(fiberNode, renderLane);

		case HostComponent:
			return updateHostComponent(fiberNode, renderLane);

		case FunctionComponent:
			return updateFunctionComponent(fiberNode, fiberNode.type, renderLane);

		case Fragment:
			return updateFragment(fiberNode);

		case ContextProvider:
			return updateContextProvider(fiberNode);

		case SuspenseComponent:
			return updateSuspenseComponent(fiberNode);

		case OffscreenComponent:
			return updateOffscreentComponent(fiberNode);
		case MemoComponent:
			return updateMemotComponent(fiberNode, renderLane);

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

function updateMemotComponent(wip: FiberNode, renderLane: Lane) {
	// bailout四要素
	// props浅比较
	const current = wip.alternate;
	const nextProps = wip.pendingProps;
	const Component = wip.type.type;
	if (current !== null) {
		const prevProps = current.memoizedProps;
		// 浅比较props
		if (shallowEqual(prevProps, nextProps) && current.ref === wip.ref) {
			didReceiveUpdate = false; //命中bailout
			wip.pendingProps = prevProps;

			// state context 命中
			if (!checkScheduledUpdateOrContext(current, renderLane)) {
				wip.lanes = current.lanes;
				return bailouOnAlreadyFinishedWork(wip, renderLane);
			}
		}
	}

	return updateFunctionComponent(wip, Component, renderLane);
}

function bailouOnAlreadyFinishedWork(wip: FiberNode, renderLane: Lane) {
	if (!includeSomeLanes(wip.childLanes, renderLane)) {
		// 检查子树是否满足四要素，子树不需要render
		if (_DEV_) {
			console.log('bailout整个子树命中', wip);
		}
		return null; //返回null,beginwork会以为命中叶子节点，向上遍历
	}

	if (_DEV_) {
		console.log('bailout fiber', wip);
	}
	cloneChildFibers(wip);
	return wip.child; //命中bailout复用child
}

// 判断本次是否需要更新，如果需要，则说明没有命中bailout策略
function checkScheduledUpdateOrContext(
	current: FiberNode,
	renderLane: Lane
): boolean {
	const updateLanes = current.lanes;

	if (includeSomeLanes(updateLanes, renderLane)) {
		return true;
	}
	return false;
}

function updateSuspenseComponent(wip: FiberNode) {
	const current = wip.alternate;
	const nextProps = wip.pendingProps;

	let showFallback = false; //是不是应该展示fallback
	const didSuspend = true; //当前是否是挂起状态

	if (didSuspend) {
		//展示fallback
		showFallback = true;
	}

	// 分别拿到children和fallback
	const nextPrimaryChildren = nextProps.children;
	const nextFallbackChildren = nextProps.fallback; //fallback是suspense的一个属性

	if (current === null) {
		// mount
		if (showFallback) {
			// 挂起
			return mountSuspenseFallbackChildren(
				wip,
				nextPrimaryChildren,
				nextFallbackChildren
			);
		} else {
			// 展示内容
			return mountSuspensePrimaryChildren(wip, nextPrimaryChildren);
		}
	} else {
		// update

		if (showFallback) {
			// 挂起
			return updateSuspenseFallbackChildren(
				wip,
				nextPrimaryChildren,
				nextFallbackChildren
			);
		} else {
			// 展示内容
			return updateSuspensePrimaryChildren(wip, nextPrimaryChildren);
		}
	}
}

function updateSuspensePrimaryChildren(wip: FiberNode, primaryChildren: any) {
	const current = wip.alternate as FiberNode;
	const currentPrimaryChildFragment = current.child as FiberNode;
	const currentFallbackChildFragment: FiberNode | null =
		currentPrimaryChildFragment.sibling;

	const primaryChildProps: OffscreenProps = {
		mode: 'visible',
		children: primaryChildren
	};

	const primaryChildFragment = createWorkInProgress(
		currentPrimaryChildFragment,
		primaryChildProps
	);

	primaryChildFragment.return = wip;
	primaryChildFragment.sibling = null;
	wip.child = primaryChildFragment;

	if (currentFallbackChildFragment !== null) {
		const deletions = wip.deletions;
		if (deletions === null) {
			wip.deletions = [currentFallbackChildFragment];
			wip.flags |= ChildDeletion;
		} else {
			deletions.push(currentFallbackChildFragment);
		}
	}

	return primaryChildFragment;
}

function updateSuspenseFallbackChildren(
	wip: FiberNode,
	primaryChildren: any,
	fallbackChildren: any
) {
	const current = wip.alternate as FiberNode;
	const currentPrimaryChildFragment = current.child as FiberNode;
	const currentFallbackChildFragment: FiberNode | null =
		currentPrimaryChildFragment.sibling;

	const primaryChildProps: OffscreenProps = {
		mode: 'hidden',
		children: primaryChildren
	};

	// /复用
	const primaryChildFragment = createWorkInProgress(
		currentPrimaryChildFragment,
		primaryChildProps
	);
	let fallbackChildFragment;

	if (currentFallbackChildFragment !== null) {
		fallbackChildFragment = createWorkInProgress(
			currentFallbackChildFragment,
			fallbackChildren
		);
	} else {
		fallbackChildFragment = createFiberFromFragment(fallbackChildren, null); //创建fragment放fallback
		fallbackChildFragment.flags |= Placement;
	}

	fallbackChildFragment.return = wip;
	primaryChildFragment.return = wip;
	primaryChildFragment.sibling = fallbackChildFragment;
	wip.child = primaryChildFragment;

	return fallbackChildFragment;
}

// 正常挂起流程
function mountSuspensePrimaryChildren(wip: FiberNode, primaryChildren: any) {
	const primaryChildProps: OffscreenProps = {
		mode: 'visible',
		children: primaryChildren
	};

	const primaryChildFragment = createFiberFromOffscreen(primaryChildProps);
	primaryChildFragment.return = wip;
	wip.child = primaryChildFragment;
	return primaryChildFragment;
}
// 挂起fallback流程
function mountSuspenseFallbackChildren(
	wip: FiberNode,
	primaryChildren: any,
	fallbackChildren: any
) {
	const primaryChildProps: OffscreenProps = {
		mode: 'hidden',
		children: primaryChildren
	};

	const primaryChildFragment = createFiberFromOffscreen(primaryChildProps);
	const fallbackChildFragment = createFiberFromFragment(fallbackChildren, null); //创建fragment放fallback

	fallbackChildFragment.flags |= Placement;

	primaryChildFragment.return = wip;
	fallbackChildren.return = wip;
	primaryChildFragment.sibling = fallbackChildFragment;
	wip.child = primaryChildFragment;

	return fallbackChildFragment;
}

function updateOffscreentComponent(wip: FiberNode) {
	const nextProps = wip.pendingProps;
	const nextChildren = nextProps.children;
	reconcileChilFiber(wip, nextChildren);
	return wip.child;
}

function updateContextProvider(wip: FiberNode) {
	const providerType = wip.type;
	const context = providerType._context;
	const newProps = wip.pendingProps;
	pushProvider(context, newProps.value);
	const nextChildren = newProps.children;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function updateFragment(wip: FiberNode) {
	const nextChildren = wip.pendingProps; //fragment的children

	reconcileChildren(wip, nextChildren);

	return wip.child;
}

// 函数组件的child，是执行后的结果
function updateFunctionComponent(
	wip: FiberNode,
	Component: FiberNode['type'],
	renderLane: Lane
) {
	const nextChildren = renderWithHooks(wip, Component, renderLane);

	// 这里需要在fiberhooks中判断state是否更改
	const current = wip.alternate;
	if (current !== null && !didReceiveUpdate) {
		bailoutHook(wip, renderLane);
		return bailouOnAlreadyFinishedWork(wip, renderLane);
	}

	reconcileChildren(wip, nextChildren);

	return wip.child;
}

function updateHostRoot(wip: FiberNode, renderLane: Lane) {
	const baseState = wip.memoizedState;
	const updateQueue = wip.updateQueue as UpdateQueue<Element>;
	const pengding = updateQueue.shared.pending;

	updateQueue.shared.pending = null;

	// bailout策略
	const prevChildren = wip.memoizedState;

	// 最新状态
	const { memoizedState } = processUpdateQueue(baseState, pengding, renderLane);

	wip.memoizedState = memoizedState;

	const nextChildren = wip.memoizedState;

	// 命中bailout
	if (prevChildren === memoizedState) {
		return bailouOnAlreadyFinishedWork(wip, renderLane);
	}

	reconcileChildren(wip, nextChildren);

	return wip.child;
}

function updateHostComponent(wip: FiberNode, renderLane: Lane) {
	const nextProps = wip.pendingProps;
	const nextChildren = nextProps.children;

	markRef(wip.alternate, wip);

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

function markRef(current: FiberNode | null, workInProgressHook: FiberNode) {
	// 标记ref,存在两种情况,1是mount阶段存在ref,2是update阶段存在ref

	const ref = workInProgressHook.ref;

	if (
		(current === null && ref !== null) ||
		(current !== null && current.ref !== ref)
	) {
		// 打上Ref标记
		workInProgressHook.flags |= Ref;
	}
}
