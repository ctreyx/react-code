/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-16 11:24:55
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-08-22 09:48:01
 * @FilePath: \react\packages\react-reconciler\src\fiberHooks.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import internals from 'shared/internals';
import { FiberNode } from './fiber';
import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	processUpdateQueue,
	UpdateQueue
} from './updateQueue';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';

// 当前正在操作的fiber
let currentlyRenderingFiber: FiberNode | null = null;
// 当前正在执行的hook
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;

const { currentDispatcher } = internals;

export interface Hook {
	memoizedState: any;
	updateQueue: unknown;
	next: Hook | null;
}

export function renderWithHooks(wip: FiberNode) {
	// 赋值操作
	currentlyRenderingFiber = wip;
	// 重置hooks链表
	wip.memoizedState = null;

	// 判断hook是mount还是update
	const current = wip.alternate;

	if (current !== null) {
		// update
		currentDispatcher.current = HooksDispatcherOnUpdate;
	} else {
		// 初始化,获取hook共享
		currentDispatcher.current = HooksDispatcherOnMount;
	}

	const Component = wip.type; //函数组件保存在type
	const props = wip.pendingProps;
	const children = Component(props);

	// 重置
	currentlyRenderingFiber = null;
	workInProgressHook = null;
	currentHook = null;

	return children;
}

// 定义mount的hooks链表

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState
};

// 定义update的hooks链表
const HooksDispatcherOnUpdate: Dispatcher = {
	useState: updateState
};

function updateState<State>(): [State, Dispatch<State>] {
	// 1.找到当前useState的hook数据
	const hook = updateWorkInProgressHook();

	console.log('hook', hook);

	// 2.实现updateState中计算新的state
	const queue = hook.updateQueue as UpdateQueue<State>;
	const pending = queue.shared.pending; // 存储的更新动作

	if (pending !== null) {
		// 计算
		const { memoizedState } = processUpdateQueue(hook.memoizedState, pending);
		hook.memoizedState = memoizedState;
	}

	return [hook.memoizedState, queue.dispatch as Dispatch<State>];
}

function mountState<State>(
	initialState: (() => State) | State
): [State, Dispatch<State>] {
	const hook = mountWorkInProgressHook();

	let memoizedState;

	if (initialState instanceof Function) {
		memoizedState = initialState();
	} else {
		memoizedState = initialState;
	}

	/**
	 * 	shared: {
			pending: null
		},
		dispatch: null
	 */
	const queue = createUpdateQueue<State>();
	hook.updateQueue = queue;

	// 给当前hook赋值memoizedState
	hook.memoizedState = memoizedState;

	//@ts-ignore
	const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);

	queue.dispatch = dispatch;

	return [memoizedState, dispatch];
}

function dispatchSetState<State>(
	fiber: FiberNode,
	updateQueue: UpdateQueue<State>,
	action: Action<State>
) {
	/**
	 * 返回 {action: 11} -->更新的值
	 */
	const update = createUpdate(action);

	/**
	 * dispatch: ƒ ()
	 * shared: pending: {action: 11}
	 */
	enqueueUpdate(updateQueue, update); // 将更新动作插入到链表中

	scheduleUpdateOnFiber(fiber); //触发更新
}

function updateWorkInProgressHook(): Hook {
	let nextCurrentHook: Hook | null;

	if (currentHook === null) {
		// 这是FC updat第一个hook,需要获取hook状态

		const current = currentlyRenderingFiber?.alternate;
		console.log('current', current);

		if (current !== null) {
			nextCurrentHook = current!.memoizedState;
		} else {
			// mount 阶段不应该进入这里,没有值
			nextCurrentHook = null;
		}
	} else {
		// 这个FC update后续的hook
		nextCurrentHook = currentHook.next;
	}

	// 链表错误,实际上mount阶段没有u4
	if (nextCurrentHook === null) {
		// mount u1 u2 u3
		// update u1 u2 u3 u4 说明链表错误
		throw new Error('Invalid hook call 链表错误');
	}

	currentHook = nextCurrentHook as Hook;

	const newHook: Hook = {
		memoizedState: currentHook?.memoizedState,
		updateQueue: currentHook.updateQueue,
		next: null
	};

	if (workInProgressHook === null) {
		// mount的时候第一个hook
		if (currentlyRenderingFiber === null) {
			// 没有再函数组件调用导致没有 currentlyRenderingFiber
			throw new Error(
				'Cannot render hooks outside of a function component,请在函数组件调用'
			);
		} else {
			workInProgressHook = newHook;
			currentlyRenderingFiber.memoizedState = workInProgressHook;
		}
	} else {
		// 后续的hook
		workInProgressHook.next = newHook;
		workInProgressHook = newHook;
	}

	return workInProgressHook;
}

function mountWorkInProgressHook(): Hook {
	const hook: Hook = {
		memoizedState: null,
		updateQueue: null,
		next: null
	};

	if (workInProgressHook === null) {
		// mount的时候第一个hook
		if (currentlyRenderingFiber === null) {
			// 没有再函数组件调用导致没有 currentlyRenderingFiber
			throw new Error(
				'Cannot render hooks outside of a function component,请在函数组件调用'
			);
		} else {
			workInProgressHook = hook;
			currentlyRenderingFiber.memoizedState = workInProgressHook;
		}
	} else {
		// mount时后续的hook
		workInProgressHook.next = hook;
		workInProgressHook = hook;
	}

	return workInProgressHook;
}
