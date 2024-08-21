import {
	appendChildToContainer,
	commitUpdate,
	Container,
	removeChild
} from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import {
	ChildDeletion,
	MutationMask,
	NoFlags,
	Placement,
	Update
} from './fiberFlags';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';

let nextEffect: FiberNode | null = null;
export const commitMutationEffects = (finishedWork: FiberNode) => {
	nextEffect = finishedWork;

	while (nextEffect !== null) {
		// 向下遍历
		const child: FiberNode | null = nextEffect.child;

		//如果存在子节点，则继续向下遍历
		if (
			(nextEffect.subtreeFlags & MutationMask) !== NoFlags &&
			child !== null
		) {
			nextEffect = child;
		} else {
			// 可能不存在subtreeFlags或没有子节点,向上遍历

			up: while (nextEffect !== null) {
				commitMutationEffectsOnFiber(nextEffect);

				const sibling: FiberNode | null = nextEffect.sibling;

				if (sibling !== null) {
					nextEffect = sibling;
					break up;
				}

				nextEffect = nextEffect.return;
			}
		}
	}
};

const commitMutationEffectsOnFiber = (finishedWork: FiberNode) => {
	const flags = finishedWork.flags;

	if (_DEV_) {
		console.log('commitMutationEffectsOnFiber', finishedWork);
	}

	if ((flags & Placement) !== NoFlags) {
		commitPlacement(finishedWork);
		finishedWork.flags &= ~Placement; // 标记位清除
	}

	// flags update

	if ((flags & Update) !== NoFlags) {
		commitUpdate(finishedWork);
		finishedWork.flags &= ~Update; // 标记位清除
	}

	// flags ChildDeletion

	if ((flags & ChildDeletion) !== NoFlags) {
		const deletions = finishedWork.deletions;
		if (deletions !== null) {
			deletions.forEach((childToDelete) => {
				commitDeletion(childToDelete);
			});
		}

		finishedWork.flags &= ~ChildDeletion; // 标记位清除
	}
};

function commitDeletion(childToDelete: FiberNode) {
	// 1.获取子树的根hostComponent

	let rootHostNode: FiberNode | null = null;

	//  2.递归子树

	commitNestedComponent(childToDelete, (unmountFiber) => {
		switch (unmountFiber.tag) {
			case HostComponent:
				// TODO 解绑ref
				if (rootHostNode === null) {
					rootHostNode = unmountFiber;
				}
				return;
			case HostText:
				// TODO 解绑ref
				if (rootHostNode === null) {
					rootHostNode = unmountFiber;
				}
				return;
			case FunctionComponent:
				// TODO useEffect 解绑ref

				return;
			default:
				if (_DEV_) {
					console.log('未处理的unmount类型', unmountFiber);
				}
				break;
		}
	});

	// 3.移除rootHostNode的dom
	if (rootHostNode !== null) {
		const hostParent = getHostParent(childToDelete);
		if (hostParent) {
			removeChild(rootHostNode.stateNode, hostParent);
		}
	}

	// 重置标记
	childToDelete.return = null;
	childToDelete.child = null;
}

/**
 * 递归删除子树
 * @param root 需要递归的子树的根节点
 * @param onCommitUnmount  回调函数
 */

function commitNestedComponent(
	root: FiberNode,
	onCommitUnmount: (fiber: FiberNode) => void
) {
	let node = root;

	while (true) {
		onCommitUnmount(node);

		if (node.child !== null) {
			// 向下
			node.child.return = node;
			node = node.child;
			continue;
		}

		if (node === root) {
			// 终止
			return;
		}

		while (node.sibling === null) {
			// 终止
			if (node.return === null || node.return === root) {
				return;
			}
			// 向上
			node = node.return;
		}

		node.sibling.return = node.return;
		node = node.sibling;
	}
}

// 插入操作
const commitPlacement = (finishedWork: FiberNode) => {
	if (_DEV_) {
		console.log('commitPlacement', finishedWork);
	}

	// 1.找到父级
	const hostParent = getHostParent(finishedWork);

	// 2.
	if (hostParent !== null) {
		appendPlacementNodeIntoContainer(finishedWork, hostParent);
	}
};

export const getHostParent = (fiber: FiberNode): Container | null => {
	let parent = fiber.return;

	while (parent) {
		const parentTag = parent.tag;

		// 只有hostComponent HostRoot才行
		if (parentTag === HostComponent) {
			return parent.stateNode as Container;
		}

		if (parentTag === HostRoot) {
			return (parent.stateNode as FiberRootNode).container;
		}

		parent = parent.return;
	}

	if (_DEV_) {
		console.log('未找到hostParent');
	}

	return null;
};

export function appendPlacementNodeIntoContainer(
	finishedWork: FiberNode,
	hostParent: Container
) {
	if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
		appendChildToContainer(hostParent, finishedWork.stateNode);
		return;
	}

	const child = finishedWork.child;

	if (child !== null) {
		appendPlacementNodeIntoContainer(child, hostParent);
		let sibling = child.sibling;

		while (sibling !== null) {
			appendPlacementNodeIntoContainer(sibling, hostParent);
			sibling = sibling.sibling;
		}
	}
}
