/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-07 11:38:52
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-08-16 09:36:07
 * @FilePath: \react\packages\react-reconciler\src\fiber.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { IReactElement, Key, Props, Ref } from 'shared/ReactTypes';
import { FunctionComponent, HostComponent, WorkTag } from './workTags';
import { Flags, NoFlags } from './fiberFlags';
import { Container } from 'hostConfig';

export class FiberNode {
	tag: WorkTag;
	key: Key;
	stateNode: any;
	type: any;
	ref: Ref;
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
	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		this.tag = tag; //实例
		this.key = key;
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
	}
}

export class FiberRootNode {
	container: Container;
	current: FiberNode;
	finishedWork: FiberNode | null;
	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container;
		this.current = hostRootFiber;
		hostRootFiber.stateNode = this;
		this.finishedWork = null;
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
	}

	wip.type = current.type; // 组件类型,如Function
	wip.updateQueue = current.updateQueue;
	wip.child = current.child;
	wip.memoizedProps = current.memoizedProps;
	wip.memoizedState = current.memoizedState;

	return wip;
};

export function createFiberFromElement(element: IReactElement) {
	const { type, key, props } = element;

	// 根据不同type返回不同fiber
	let fiberTag: WorkTag = FunctionComponent;

	if (typeof type === 'string') {
		// <div></div>
		fiberTag = HostComponent;
	} else if (typeof type !== 'function' && _DEV_) {
		console.log('未定义的类型', element);
	}

	const fiber = new FiberNode(fiberTag, props, key);
	fiber.type = type;

	return fiber;
}
