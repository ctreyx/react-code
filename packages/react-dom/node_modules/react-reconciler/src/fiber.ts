/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-07 11:38:52
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-09-29 09:24:16
 * @FilePath: \react\packages\react-reconciler\src\fiber.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { IReactElement, Key, Props, Ref } from 'shared/ReactTypes';
import {
	ContextProvider,
	Fragment,
	FunctionComponent,
	HostComponent,
	OffscreenComponent,
	SuspenseComponent,
	WorkTag
} from './workTags';
import { Flags, NoFlags } from './fiberFlags';
import { Container } from 'hostConfig';
import { Lane, Lanes, NoLane, NoLanes } from './fiberLanes';
import { Effect } from './fiberHooks';
import { CallbackNode } from 'scheduler';
import { REACT_PROVIDER_TYPE, REACT_SUSPENSE_TYPE } from 'shared/ReactSymbols';

export interface OffscreenProps {
	mode: 'visible' | 'hidden';
	children: any;
}

export class FiberNode {
	tag: WorkTag;
	key: Key;
	stateNode: any;
	type: any;
	ref: Ref | null;
	pendingProps: Props;
	memoizedProps: Props;
	memoizedState: any;
	alternate: FiberNode | null;
	flags: Flags;
	subtreeFlags: Flags; //存储子树flags
	updateQueue: unknown;

	return: FiberNode | null;
	sibling: FiberNode | null;
	child: FiberNode | null;
	index: number;

	lanes: Lanes;
	childLanes: Lanes;

	deletions: FiberNode[] | null;
	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		this.tag = tag; //实例
		this.key = key || null;
		this.stateNode = null; // 实例化后的实例对象,<div></div>
		this.type = null; // 组件类型,如Function

		// 构成树状结构
		this.return = null; //指向父fiber, 为什么是return而不是parent，因为工作单元下一个就是父级
		this.sibling = null; //指向兄弟fiber
		this.child = null;
		this.index = 0;
		this.ref = null;

		// 作为工作单元
		this.pendingProps = pendingProps; //当前状态
		this.memoizedProps = null; //完成后的确定状态
		this.memoizedState = null;
		this.alternate = null; //双缓存
		this.updateQueue = null;

		//副作用
		this.flags = NoFlags;
		this.subtreeFlags = NoFlags;
		this.lanes = NoFlags;
		this.childLanes = NoFlags;

		this.deletions = null;
	}
}

export interface PendingPassiveEffects {
	unmount: Effect[];
	update: Effect[];
}
export class FiberRootNode {
	container: Container;
	current: FiberNode;
	finishedWork: FiberNode | null;

	// lanes
	pendingLanes: Lanes;
	finishedLane: Lane;

	// effect
	pendingPassiveEffects: PendingPassiveEffects;

	callbackNode: CallbackNode | null;
	callbackPriority: Lane;

	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container;
		this.current = hostRootFiber;
		hostRootFiber.stateNode = this;
		this.finishedWork = null;
		// lanes
		this.pendingLanes = NoLanes;
		this.finishedLane = NoLane;

		this.callbackNode = null;
		this.callbackPriority = NoLane;

		this.pendingPassiveEffects = {
			unmount: [],
			update: []
		};
	}
}

export const createWorkInProgress = (
	current: FiberNode,
	pendingProps: Props
): FiberNode => {
	// 双缓存机制，获取alternate
	let wip = current.alternate;

	if (wip === null) {
		// 首屏
		wip = new FiberNode(current.tag, pendingProps, current.key);
		// wip.type = current.type;
		wip.stateNode = current.stateNode;

		wip.alternate = current;
		current.alternate = wip;
	} else {
		// 更新阶段
		wip.pendingProps = pendingProps;
		wip.flags = NoFlags; // 清空副作用
		wip.subtreeFlags = NoFlags;

		wip.deletions = null;
	}

	wip.type = current.type; // 组件类型,如Function
	wip.updateQueue = current.updateQueue;
	wip.child = current.child;
	wip.memoizedProps = current.memoizedProps;
	wip.memoizedState = current.memoizedState;
	wip.ref = current.ref;

	wip.lanes = current.lanes;
	wip.childLanes = current.childLanes;


	return wip;
};

export function createFiberFromElement(element: IReactElement) {
	const { type, key, props, ref } = element;

	// 根据不同type返回不同fiber
	let fiberTag: WorkTag = FunctionComponent;

	if (typeof type === 'string') {
		// <div></div>
		fiberTag = HostComponent;
	} else if (
		typeof type === 'object' &&
		type.$$typeof === REACT_PROVIDER_TYPE
	) {
		fiberTag = ContextProvider;
	} else if (type.$$typeof === REACT_SUSPENSE_TYPE) {
		fiberTag = SuspenseComponent;
	} else if (typeof type !== 'function' && _DEV_) {
		console.log('未定义的类型', element);
	}

	const fiber = new FiberNode(fiberTag, props, key);
	fiber.type = type;
	fiber.ref = ref;

	return fiber;
}

export function createFiberFromFragment(elements: any, key: Key): FiberNode {
	const fiber = new FiberNode(Fragment, elements, key);
	return fiber;
}

export function createFiberFromOffscreen(
	pendingProps: OffscreenProps
): FiberNode {
	const fiber = new FiberNode(OffscreenComponent, pendingProps, null);
	return fiber;
}
