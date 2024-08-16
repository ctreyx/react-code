/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-08 17:34:57
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-08-15 17:42:50
 * @FilePath: \react\packages\react-reconciler\src\childFiber.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { IReactElement } from 'shared/ReactTypes';
import { createFiberFromElement, FiberNode } from './fiber';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { HostText } from './workTags';
import { Placement } from './fiberFlags';

/**
 * ChildReconciler 是为 父fiber 返回一个 子fiber
 * @param showldTrackEffects 是否追踪副作用 ,
 * 只有在mount的时候存在大量插入操作不追踪，
 * 更新的时候不会需要追踪
 * @returns
 */
function ChildReconciler(showldTrackEffects: boolean) {
	// 处理单元素，创造一个fiber
	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: IReactElement
	) {
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

		if (_DEV_) {
			console.error(`Unknown node type --- ChildReconciler`);
		}

		return null;
	};
}

export const reconcileChilFiber = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
