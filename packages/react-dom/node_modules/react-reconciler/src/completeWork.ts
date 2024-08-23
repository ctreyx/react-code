/**
 * 递归中，归阶段
 */

import {
	appendInitialChild,
	appendTextInstance,
	Container,
	createInstance
} from 'hostConfig';
import { FiberNode } from './fiber';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';

import { NoFlags, Update } from './fiberFlags';
import { updateFiberProps } from 'react-dom/src/SyntheticEvent';

function markUpdate(fiber: FiberNode) {
	fiber.flags |= Update;
}

export const completeWork = (wip: FiberNode) => {
	const newProps = wip.pendingProps; //当前状态
	const current = wip.alternate;

	switch (wip.tag) {
		// dom原生的这些节点, 如: div, span, p 标签这种
		case HostComponent:
			if (current !== null && wip.stateNode) {
				// update 更新阶段，可以判断props className等变化，打上update flag,这里简单处理
				updateFiberProps(wip.stateNode, newProps);
			} else {
				// 1.构建离屏dom
				// const instance = createInstance(wip.type, newProps);
				const instance = createInstance(wip.type, newProps);

				// 2.插入dom树
				appendAllChildren(instance, wip);
				wip.stateNode = instance;
			}
			bubbleProperties(wip);
			return null;
		// 单纯的文本节点
		case HostText:
			if (current !== null && wip.stateNode) {
				// update阶段，如果内容不同进行标记
				const oldText = current.memoizedProps.content;
				const newText = newProps.content;
				if (oldText !== newText) {
					markUpdate(wip);
				}
			} else {
				// 1.构建离屏dom
				const instance = appendTextInstance(newProps.content);
				wip.stateNode = instance;
			}
			bubbleProperties(wip);

			return null;
		case HostRoot:
			bubbleProperties(wip);

			return null;

		case FunctionComponent:
			bubbleProperties(wip);

			return null;

		default:
			if (_DEV_) {
				console.log('completeWork未定义的类型', wip);
			}
			break;
	}

	return null;
};

// parent节点插入wip
function appendAllChildren(parent: Container, wip: FiberNode): void {
	let node = wip.child;

	// 2.可能有兄弟，所以需要遍历
	while (node !== null) {
		// 1.往下找child
		if (node.tag === HostComponent || node.tag === HostText) {
			// 1. <div><span>子</span></div> 这种只有一个子
			appendInitialChild(parent, node.stateNode);
		} else if (node.child !== null) {
			node.child.return = node;
			node = node.child;
			continue;
		}

		// 因为是递归，所以如果等于传进来的wip,就结束
		if (node === wip) {
			return;
		}

		//  2.网上找父
		while (node.sibling === null) {
			// 没有兄弟并且没有父级，归结束
			if (node.return === null || node.return === wip) {
				return;
			}
			// 往上
			node = node.return;
		}

		node.sibling.return = node.return;
		node = node.sibling;
	}
}

//父节点收集往下子节点的副作用
function bubbleProperties(wip: FiberNode) {
	let subtreeFlags = NoFlags;
	let child = wip.child;

	while (child !== null) {
		subtreeFlags |= child.subtreeFlags; //收集儿子子节点的副作用
		subtreeFlags |= child.flags; //收集儿子的状态

		child.return = wip;
		child = child.sibling;
	}

	wip.subtreeFlags |= subtreeFlags;
}
