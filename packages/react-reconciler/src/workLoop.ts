import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { FiberNode } from './fiber';

let workInProgress: FiberNode | null = null; //当前指向

function prepareFreshStack(node: FiberNode) {
	workInProgress = node;
}

function renderRoot(root: FiberNode) {
	// 初始化工作单元
	prepareFreshStack(root);

	do {
		try {
			workLoop();
			break;
		} catch (e) {
			console.warn('workLoop error', e);
			workInProgress = null;
		}
	} while (true);
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
