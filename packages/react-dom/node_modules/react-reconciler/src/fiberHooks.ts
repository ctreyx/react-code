/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-16 11:24:55
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-08-19 17:40:02
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
	UpdateQueue
} from './updateQueue';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';

// 当前正在操作的fiber
let currentlyRenderingFiber: FiberNode | null = null;
// 当前正在执行的hook
let workInProgressHook: Hook | null = null;

const { currentDispatcher } = internals;

export interface Hook {
	memoizedState: any;
	updateQueue: unknown;
	next: Hook | null;
}

export function renderWithHooks(wip: FiberNode) {
	// 赋值操作
	currentlyRenderingFiber = wip;

	wip.memoizedState = null;

	// 判断hook是mount还是update
	const current = wip.alternate;

	if (current !== null) {
		// update
	} else {
		// 初始化,获取hook共享
		currentDispatcher.current = HooksDispatcherOnMount;
	}

	const Component = wip.type; //函数组件保存在type
	const props = wip.pendingProps;
	const children = Component(props);

	// 重置
	currentlyRenderingFiber = null;

	return children;
}

// 定义mount的hooks链表

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState
};

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
