/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-08 14:24:31
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-09-29 10:35:46
 * @FilePath: \react\packages\react-reconciler\src\updateQueue.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Dispatch } from 'react/src/currentDispatcher';
import { Action } from 'shared/ReactTypes';
import { isSubsetOfLanes, Lane, mergeLanes, NoLane } from './fiberLanes';
import { FiberNode } from './fiber';

export interface Update<State> {
	action: Action<State>; //动作，可以是直接传入新值，或者接受函数返回新值
	lane: Lane; //优先级
	next: Action<any> | null;
}

export interface UpdateQueue<State> {
	shared: {
		pending: Update<State> | null;
	};
	dispatch: Dispatch<State> | null;
}

export const createUpdate = <State>(
	action: Action<State>,
	lane: Lane
): Update<State> => {
	return {
		action,
		lane,
		next: null
	};
};

export const createUpdateQueue = <State>() => {
	return {
		shared: {
			pending: null
		},
		dispatch: null
	} as UpdateQueue<State>;
};

//往链表插入
export const enqueueUpdate = <State>(
	updateQueue: UpdateQueue<State>,
	update: Update<State>,
	fiber: FiberNode,
	lane: Lane
) => {
	const pending = updateQueue.shared.pending;

	if (pending === null) {
		// 第一次插入 a.next->a  a->a  自己指向自己
		update.next = update;
	} else {
		// 不是第一次插入 b.next->a   b->a->b
		// 第三次插入 c->a->b->c
		update.next = pending.next;
		pending.next = update;
	}

	fiber.lanes = mergeLanes(fiber.lanes, lane);
	const alternate = fiber.alternate;
	if (alternate !== null) {
		alternate.lanes = mergeLanes(alternate.lanes, lane);
	}

	updateQueue.shared.pending = update;
};

// 消费链表
export const processUpdateQueue = <State>(
	baseState: State,
	pendingUpdate: Update<State> | null,
	renderLane: Lane,
	onSkipUpdate?: <State>(update: Update<State>) => void
): {
	memoizedState: State;
	baseState: State;
	baseQueue: Update<State> | null;
} => {
	const result: ReturnType<typeof processUpdateQueue<State>> = {
		memoizedState: baseState,
		baseState,
		baseQueue: null
	};

	if (pendingUpdate != null) {
		// 取出第一个update
		const first = pendingUpdate.next;
		let pending = pendingUpdate.next;

		let newBaseQueueFirst: Update<State> | null = null; //头
		let newBaseQueueLast: Update<State> | null = null; //尾

		let newBaseState = baseState;
		let newState = baseState; //每次都会更新

		let num = 0;

		do {
			const updateLane = pending.lane;
			// 只有update和当前renderlane一直才可以渲染
			// if (updateLane === renderLane) {

			if (!isSubsetOfLanes(updateLane, renderLane)) {
				// 优先级不够，代表跳过
				const clone = createUpdate(pending.action, pending.lane);

				onSkipUpdate?.(clone);

				// 第一个被跳过的
				if (newBaseQueueFirst === null) {
					newBaseQueueFirst = clone;
					newBaseQueueLast = clone;
					newBaseState = newState;
				} else {
					// 后续跳过
					newBaseQueueLast!.next = clone;
					newBaseQueueLast = clone;
				}
			} else {
				// 优先级足够，继续执行

				// 判断之前有没有跳过的？
				if (newBaseQueueLast !== null) {
					const clone = createUpdate(pending.action, NoLane);
					newBaseQueueLast!.next = clone;
					newBaseQueueLast = clone;
				}

				const action = pendingUpdate.action;
				if (action instanceof Function) {
					// 函数,接受老值返回新
					newState = action(baseState);
				} else {
					// 就是直接值，直接赋值
					newState = action;
				}
				pending = pending.next;
			}
		} while (pending !== first && num++ < 10);

		if (newBaseQueueLast === null) {
			// 没有被跳过的
			newBaseState = newState;
		} else {
			// 有跳过，构成链表
			newBaseQueueLast.next = newBaseQueueFirst;
		}

		// 改造
		result.memoizedState = newState;
		result.baseState = newBaseState;
		result.baseQueue = newBaseQueueLast; //环状链表
	}
	// while重复修改值，所以这里需要不断修改baseState
	// result.memoizedState = baseState;

	// 改造前
	// if (pendingUpdate != null) {
	// 	// 两种，第一种 base 1 update 2 -> 返回最新值2
	// 	// 第二种函数 base 1 update (x)=>4x ->返回最新值4

	// 	const action = pendingUpdate.action;
	// 	if (action instanceof Function) {
	// 		// 函数,接受老值返回新
	// 		result.memoizedState = action(baseState);
	// 	} else {
	// 		// 就是直接值，直接赋值
	// 		result.memoizedState = action;
	// 	}
	// }

	return result;
};
