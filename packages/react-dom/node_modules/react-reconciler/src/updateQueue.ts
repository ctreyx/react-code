import { Dispatch } from 'react/src/currentDispatcher';
import { Action } from 'shared/ReactTypes';

export interface Update<State> {
	action: Action<State>; //动作，可以是直接传入新值，或者接受函数返回新值
}

export interface UpdateQueue<State> {
	shared: {
		pending: Update<State> | null;
	};
	dispatch: Dispatch<State> | null;
}

export const createUpdate = <State>(action: Action<State>): Update<State> => {
	return {
		action
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
	update: Update<State>
) => {
	updateQueue.shared.pending = update;
};

// 消费链表
export const processUpdateQueue = <State>(
	baseState: State,
	pendingUpdate: Update<State> | null
): { memoizedState: State } => {
	const result: ReturnType<typeof processUpdateQueue<State>> = {
		memoizedState: baseState
	};

	if (pendingUpdate != null) {
		// 两种，第一种 base 1 update 2 -> 返回最新值2
		// 第二种函数 base 1 update (x)=>4x ->返回最新值4

		const action = pendingUpdate.action;
		if (action instanceof Function) {
			// 函数,接受老值返回新
			result.memoizedState = action(baseState);
		} else {
			// 就是直接值，直接赋值
			result.memoizedState = action;
		}
	}

	return result;
};
