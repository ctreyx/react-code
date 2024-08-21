/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-08 17:34:57
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-08-20 17:44:02
 * @FilePath: \react\packages\react-reconciler\src\childFiber.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { IReactElement, Props } from 'shared/ReactTypes';
import {
	createFiberFromElement,
	createWorkInProgress,
	FiberNode
} from './fiber';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { HostText } from './workTags';
import { ChildDeletion, Placement } from './fiberFlags';

/**
 * ChildReconciler 是为 父fiber 返回一个 子fiber
 * @param showldTrackEffects 是否追踪副作用 ,
 * 只有在mount的时候存在大量插入操作不追踪，
 * 更新的时候不会需要追踪
 * @returns
 */
function ChildReconciler(showldTrackEffects: boolean) {
	function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
		if (!showldTrackEffects) {
			return;
		}
		// 父亲fiber需要删除的子fiber集合
		const deletions = returnFiber.deletions;
		if (deletions === null) {
			returnFiber.deletions = [childToDelete];
			returnFiber.flags |= ChildDeletion;
		} else {
			deletions.push(childToDelete);
		}
	}

	function useFiber(fiber: FiberNode, pendingProps: Props): FiberNode {
		/**
		 * 克隆fiber, createWorkInProgress 会获取wip的alternate缓存fiber
		 */
		const clone = createWorkInProgress(fiber, pendingProps);
		clone.index = 0;
		clone.sibling = null;
		return clone;
	}

	// 处理单元素，创造一个fiber
	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: IReactElement
	) {
		// 更新阶段,判断currentFiber和element, type,key是否相同复用
		const key = element.key;
		work: if (currentFiber !== null) {
			if (currentFiber.key === key) {
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (currentFiber.type === element.type) {
						// 复用

						const existing = useFiber(currentFiber, element.props);
						existing.return = returnFiber;
						return existing;
					} else {
						// key相同，type不同  删除
						deleteChild(returnFiber, currentFiber);
						break work;
					}
				} else {
					if (_DEV_) {
						console.log('还未实现的react类型');
						break work;
					}
				}
			} else {
				// 1.key 不相同就删除旧的
				deleteChild(returnFiber, currentFiber);
			}
		}

		const fiber = createFiberFromElement(element);
		fiber.return = returnFiber; //父节点
		return fiber;
	}

	// 文本节点直接传入content
	function reconcileSingleTextNode(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		content: string | number
	) {
		// 更新阶段 tag相同 更新content
		if (currentFiber !== null) {
			if (currentFiber.tag === HostText) {
				const existing = useFiber(currentFiber, { content });
				existing.return = returnFiber;
				return existing;
			}
			// 如果tag变了，删掉 , 然后创建新的hostText
			deleteChild(returnFiber, currentFiber);
		}

		const fiber = new FiberNode(HostText, { content }, null);
		fiber.return = returnFiber;
		return fiber;
	}

	// 插入节点
	function placeSingleChild(fiber: FiberNode) {
		// 需要追踪副作用并且没有缓存，代表首屏渲染，则需要标记Placement
		if (showldTrackEffects) {
			fiber.flags |= Placement;
		}
		return fiber;
	}

	return function reconcileChildrenFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild?: IReactElement
	) {
		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					const fiber = reconcileSingleElement(
						returnFiber,
						currentFiber,
						newChild
					);
					return placeSingleChild(fiber);
				default:
					if (_DEV_) {
						console.error(`Unknown node type --- ChildReconciler`);
					}
					break;
			}
		}

		// 文本节点
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			const fiber = reconcileSingleTextNode(
				returnFiber,
				currentFiber,
				newChild
			);
			return placeSingleChild(fiber);
		}

		// 兜底情况删除
		if (currentFiber) {
			deleteChild(returnFiber, currentFiber);
		}

		if (_DEV_) {
			console.error(`Unknown node type --- ChildReconciler`);
		}

		return null;
	};
}

export const reconcileChilFiber = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
