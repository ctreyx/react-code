/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-08 17:34:57
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-08-29 15:02:19
 * @FilePath: \react\packages\react-reconciler\src\childFiber.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { IReactElement, Key, Props } from 'shared/ReactTypes';
import {
	createFiberFromElement,
	createFiberFromFragment,
	createWorkInProgress,
	FiberNode
} from './fiber';
import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from 'shared/ReactSymbols';
import { Fragment, HostText } from './workTags';
import { ChildDeletion, Placement } from './fiberFlags';

type ExistingChildren = Map<string | number, FiberNode>;

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

	function updateFragment(
		returnFiber: FiberNode,
		current: FiberNode | null,
		elements: any[],
		key: Key,
		existingChildren: ExistingChildren
	) {
		let fiber;
		if (!current || current.tag !== Fragment) {
			fiber = createFiberFromFragment(elements, key);
		} else {
			// 复用
			existingChildren.delete(key);
			fiber = useFiber(current, elements);
		}

		fiber.return = returnFiber;
		return fiber;
	}

	function deleteRemainingChildren(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null
	) {
		// 不追踪副作用
		if (!showldTrackEffects) return;
		let childToDelete = currentFirstChild;
		while (childToDelete !== null) {
			deleteChild(returnFiber, childToDelete);
			childToDelete = childToDelete.sibling;
		}
	}

	// 处理单元素，创造一个fiber
	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: IReactElement
	) {
		// 更新阶段,判断currentFiber和element, type,key是否相同复用
		const key = element.key;
		while (currentFiber !== null) {
			if (currentFiber.key === key) {
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (currentFiber.type === element.type) {
						// 处理 fragment
						let props = element.props;
						if (element.type === REACT_FRAGMENT_TYPE) {
							props = element.props.children;
						}

						// 复用
						const existing = useFiber(currentFiber, props);
						existing.return = returnFiber;

						// 当前节点复用，删除余下的节点
						deleteRemainingChildren(returnFiber, currentFiber.sibling);

						return existing;
					} else {
						// deleteChild(returnFiber, currentFiber);

						// key相同，type不同  删除所有
						deleteRemainingChildren(returnFiber, currentFiber);
						break;
					}
				} else {
					if (_DEV_) {
						console.log('还未实现的react类型');
						break;
					}
				}
			} else {
				// 1.key 不相同就删除旧的
				deleteChild(returnFiber, currentFiber);
				// 遍历其余节点
				currentFiber = currentFiber.sibling;
			}
		}

		let fiber;

		if (element.type === REACT_FRAGMENT_TYPE) {
			fiber = createFiberFromFragment(element.props.children, key);
		} else {
			fiber = createFiberFromElement(element);
		}

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
		while (currentFiber !== null) {
			if (currentFiber.tag === HostText) {
				const existing = useFiber(currentFiber, { content });
				existing.return = returnFiber;

				deleteRemainingChildren(returnFiber, currentFiber.sibling);
				return existing;
			}
			// 如果tag变了，删掉 , 然后创建新的hostText
			deleteChild(returnFiber, currentFiber);
			// 继续遍历
			currentFiber = currentFiber.sibling;
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

	function reconcileChildrenArray(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		newChild: any[]
	) {
		let lastPlacedIndex: number = 0; //最后一个可服用fiber在current中的index
		let lastNewFiber: FiberNode | null = null; //创建的最后一个fiber , 指向最后一个
		let firstNewFiber: FiberNode | null = null; //创建的第一个fiber，指向第一个

		// 1.将current中同级fiber保存在map中 , current是fiber,通过sibing找兄弟，newChild是reactElement
		const existingChildren: ExistingChildren = new Map();
		let current = currentFirstChild;

		while (current !== null) {
			const keyToUse = current.key ? current.key : current.index;
			existingChildren.set(keyToUse, current);
			current = current.sibling;
		}

		for (let i = 0; i < newChild.length; i++) {
			// 2.遍历newChild,对于每个遍历的element,存在两种情况:
			// a.存在对应current fiber, 且可以服用 b.不存在或者不能服用

			const after = newChild[i];

			const newFiber = updateFromMap(returnFiber, existingChildren, i, after);
			if (newFiber === null) {
				continue;
			}
			// 3.判断是插入还是移动, a1 b2 c3 -> b2 c3 a1 .
			// 通过不断标记lastPlacedIndex, 得到前两个节点index大于last, 后面的a1是小于的，说明有移动

			newFiber.index = i;
			newFiber.return = returnFiber;

			if (lastNewFiber === null) {
				lastNewFiber = newFiber;
				firstNewFiber = newFiber;
			} else {
				lastNewFiber.sibling = newFiber;
				lastNewFiber = lastNewFiber.sibling;
			}

			if (!showldTrackEffects) {
				continue;
			}

			const current = newFiber.alternate;
			if (current !== null) {
				const oldIndex = current.index;
				if (oldIndex < lastPlacedIndex) {
					// 移动
					newFiber.flags |= Placement;
					continue;
				} else {
					// 不移动
					lastPlacedIndex = oldIndex;
				}
			} else {
				// 不存在，mount
				newFiber.flags |= Placement;
			}
		}

		// 4.剩余的删除
		existingChildren.forEach((fiber) => {
			deleteChild(returnFiber, fiber);
		});
		return firstNewFiber;
	}

	function updateFromMap(
		returnFiber: FiberNode,
		existingChildren: ExistingChildren,
		index: number,
		element: any
	): FiberNode | null {
		const keyToUse = element.key !== null ? element.key : index;
		const before = existingChildren.get(keyToUse) || null;

		// 第一种情况，hostText
		if (typeof element === 'string' || typeof element === 'number') {
			if (before) {
				if (before.tag === HostText) {
					// 可以复用
					existingChildren.delete(keyToUse);
					return useFiber(before, { content: element + '' });
				}
				// 不能复用重新创建
				return new FiberNode(HostText, { content: element + '' }, null);
			}
		}

		// 第二种 ReactElement
		if (typeof element === 'object' && element !== null) {
			switch (element.$$typeof) {
				case REACT_ELEMENT_TYPE:
					// fragment
					if (element.type === REACT_FRAGMENT_TYPE) {
						return updateFragment(
							returnFiber,
							before,
							element,
							keyToUse,
							existingChildren
						);
					}

					if (before) {
						if (before.type === element.type) {
							existingChildren.delete(keyToUse);
							return useFiber(before, element.props);
						}
					}
					// 不能服用创建新的
					return createFiberFromElement(element);
			}
		}

		// TODO: 数组类型
		if (Array.isArray(element)) {
			return updateFragment(
				returnFiber,
				before,
				element,
				keyToUse,
				existingChildren
			);
		}

		return null;
	}

	return function reconcileChildrenFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild?: IReactElement
	) {
		// 1.判断是不是fragment
		const isUnkeyedTopLevelFragment =
			typeof newChild === 'object' &&
			newChild !== null &&
			newChild.type === REACT_FRAGMENT_TYPE &&
			newChild.key === null;

		if (isUnkeyedTopLevelFragment) {
			newChild = newChild?.props.children; //如果是fragment，取其children
		}

		if (typeof newChild === 'object' && newChild !== null) {
			// 多节点
			if (Array.isArray(newChild)) {
				return reconcileChildrenArray(returnFiber, currentFiber, newChild);
			}

			
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					const fiber = reconcileSingleElement(
						returnFiber,
						currentFiber,
						newChild
					);
					return placeSingleChild(fiber);
				// default:
				// 	if (_DEV_) {
				// 		console.error(`Unknown node type --- ChildReconciler`, newChild);
				// 	}
				// 	break;
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
			deleteRemainingChildren(returnFiber, currentFiber);
		}

		if (_DEV_) {
			console.error(`Unknown node type --- ChildReconciler`);
		}

		return null;
	};
}

export const reconcileChilFiber = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
