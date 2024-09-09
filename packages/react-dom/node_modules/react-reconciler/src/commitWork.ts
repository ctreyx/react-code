import {
	appendChildToContainer,
	commitUpdate,
	Container,
	insertChildTocontainer,
	Instance,
	removeChild
} from 'hostConfig';
import { FiberNode, FiberRootNode, PendingPassiveEffects } from './fiber';
import {
	ChildDeletion,
	Flags,
	MutationMask,
	NoFlags,
	PassiveEffect,
	PassiveMark,
	Placement,
	Update
} from './fiberFlags';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';
import { Effect, FCUpdateQueue } from './fiberHooks';
import { HookHasEffect } from './hookEffectTags';

let nextEffect: FiberNode | null = null;
export const commitMutationEffects = (
	finishedWork: FiberNode,
	root: FiberRootNode
) => {
	nextEffect = finishedWork;

	while (nextEffect !== null) {
		// 向下遍历
		const child: FiberNode | null = nextEffect.child;

		//如果存在子节点，则继续向下遍历
		if (
			(nextEffect.subtreeFlags & (MutationMask | PassiveMark)) !== NoFlags &&
			child !== null
		) {
			nextEffect = child;
		} else {
			// 可能不存在subtreeFlags或没有子节点,向上遍历

			up: while (nextEffect !== null) {
				commitMutationEffectsOnFiber(nextEffect, root);

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

const commitMutationEffectsOnFiber = (
	finishedWork: FiberNode,
	root: FiberRootNode
) => {
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
				commitDeletion(childToDelete, root);
			});
		}

		finishedWork.flags &= ~ChildDeletion; // 标记位清除
	}

	if ((flags & PassiveEffect) !== NoFlags) {
		// 收集effect回调
		commitPassiveEffect(finishedWork, root, 'update');
		finishedWork.flags &= ~PassiveEffect; // 标记位清除
	}
};

function commitPassiveEffect(
	fiber: FiberNode,
	root: FiberRootNode,
	type: keyof PendingPassiveEffects
) {
	if (
		fiber.tag !== FunctionComponent ||
		(type === 'update' && (fiber.flags & PassiveEffect) === NoFlags)
	) {
		return;
	}

	const updateQueue = fiber.updateQueue as FCUpdateQueue<any>;

	if (updateQueue !== null) {
		if (updateQueue.lastEffect === null) {
			console.log('FC存在passiveEffect，但是没有effect回调');
		} else {
			// 只需要push一次，因为是环状链表
			root.pendingPassiveEffects[type].push(updateQueue.lastEffect);
		}
	}
}

// 执行effect
function commitHookEffectList(
	flags: Flags,
	lastEffect: Effect,
	callback: (effect: Effect) => void
) {
	let effect = lastEffect.next as Effect;

	do {
		if ((effect.tag & flags) === flags) {
			callback(effect);
		}
		effect = effect.next as Effect;
	} while (effect !== lastEffect.next);
}

export function commitHookEffectListUnmount(flags: Flags, lastEffect: Effect) {
	commitHookEffectList(flags, lastEffect, (effect) => {
		const destroy = effect.destroy;
		if (typeof destroy === 'function') {
			destroy();
		}
		effect.tag &= ~HookHasEffect; //因为是卸载，所以需要移除标记
	});
}

export function commitHookEffectListDestroy(flags: Flags, lastEffect: Effect) {
	commitHookEffectList(flags, lastEffect, (effect) => {
		const destroy = effect.destroy;
		if (typeof destroy === 'function') {
			destroy();
		}
	});
}

export function commitHookEffectListCreate(flags: Flags, lastEffect: Effect) {
	commitHookEffectList(flags, lastEffect, (effect) => {
		const create = effect.create;
		if (typeof create === 'function') {
			effect.destroy = create();
		}
	});
}

function recordHostChildrenToDelete(
	childenToDelete: FiberNode[],
	unmountFiber: FiberNode
) {
	let lastOne = childenToDelete[childenToDelete.length - 1];
	if (!lastOne) {
		childenToDelete.push(unmountFiber);
	} else {
		let node = lastOne.sibling;
		while (node !== null) {
			if (unmountFiber === node) {
				childenToDelete.push(unmountFiber);
			}
			node = node.sibling;
		}
	}
}

function commitDeletion(childToDelete: FiberNode, root: FiberRootNode) {
	// 1.获取子树的根hostComponent

	const rootChildenToDelete: FiberNode[] = [];

	//  2.递归子树

	commitNestedComponent(childToDelete, (unmountFiber) => {
		switch (unmountFiber.tag) {
			case HostComponent:
				// TODO 解绑ref
				recordHostChildrenToDelete(rootChildenToDelete, unmountFiber);
				return;
			case HostText:
				// TODO 解绑ref
				recordHostChildrenToDelete(rootChildenToDelete, unmountFiber);
				return;
			case FunctionComponent:
				// TODO  解绑ref
				commitPassiveEffect(unmountFiber, root, 'unmount');
				return;
			default:
				if (_DEV_) {
					console.log('未处理的unmount类型', unmountFiber);
				}
				break;
		}
	});

	// 3.移除rootHostNode的dom
	if (rootChildenToDelete.length > 0) {
		const hostParent = getHostParent(childToDelete);
		if (hostParent) {
			rootChildenToDelete.forEach((node) => {
				removeChild((node as FiberNode).stateNode, hostParent);
			});
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

// 找兄弟节点，先找兄弟，比如是hostText或者hostComponent，如果没有兄弟，就向上找，直到找到兄弟节点
function getHostSibling(fiber: FiberNode) {
	let node: FiberNode = fiber;

	findSibling: while (true) {
		// 如果没有兄弟节点，直接向上找
		while (node.sibling === null) {
			const parent = node.return;
			if (
				parent === null ||
				parent.tag === HostRoot ||
				parent.tag === HostComponent
			) {
				return null;
			}
			node = parent;
		}

		node.sibling.return = node.return;
		node = node.sibling;

		while (node.tag !== HostText && node.tag !== HostComponent) {
			// 向下遍历,如果该节点身上存在移动标记，说明不稳定
			if ((node.flags & Placement) !== NoFlags) {
				continue findSibling;
			}
			// 如果没有儿子，继续
			if (node.child === null) {
				continue findSibling;
			} else {
				// 向下遍历
				node.child.return = node;
				node = node.child;
			}
		}

		if ((node.flags & Placement) !== NoFlags) {
			return node.stateNode;
		}
	}
}

// 插入操作
const commitPlacement = (finishedWork: FiberNode) => {
	if (_DEV_) {
		console.log('commitPlacement', finishedWork);
	}

	// 1.找到父级
	const hostParent = getHostParent(finishedWork);

	// host sibling

	const sibling = getHostSibling(finishedWork);

	// 2.
	if (hostParent !== null) {
		insertOrAppendPlacementNodeIntoContainer(finishedWork, hostParent, sibling);
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

export function insertOrAppendPlacementNodeIntoContainer(
	finishedWork: FiberNode,
	hostParent: Container,
	before?: Instance
) {
	if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
		if (before) {
			insertChildTocontainer(finishedWork.stateNode, hostParent, before);
		} else {
			appendChildToContainer(hostParent, finishedWork.stateNode);
		}
		return;
	}

	const child = finishedWork.child;

	if (child !== null) {
		insertOrAppendPlacementNodeIntoContainer(child, hostParent);
		let sibling = child.sibling;

		while (sibling !== null) {
			insertOrAppendPlacementNodeIntoContainer(sibling, hostParent);
			sibling = sibling.sibling;
		}
	}
}
