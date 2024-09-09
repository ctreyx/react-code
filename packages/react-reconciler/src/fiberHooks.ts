/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-16 11:24:55
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-09-09 09:41:38
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
import { Lane, NoLane, requestUpdateLanes } from './fiberLanes';
import { Flags, PassiveEffect } from './fiberFlags';
import { HookHasEffect, Passive } from './hookEffectTags';

// 当前正在操作的fiber
let currentlyRenderingFiber: FiberNode | null = null;
// 当前正在执行的hook
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;
let renderLane: Lane = NoLane;

const { currentDispatcher } = internals;

export interface Hook {
	memoizedState: any;
	updateQueue: unknown;
	next: Hook | null;
}

export interface Effect {
	tag: Flags;
	create: EffectCallback | void;
	destroy: EffectCallback | void;
	deps: EffectDeps;
	next: Effect | null;
}
export interface FCUpdateQueue<State> extends UpdateQueue<State> {
	lastEffect: Effect | null;
}

type EffectCallback = () => void;
type EffectDeps = any[] | null;

export function renderWithHooks(wip: FiberNode, Lane: Lane) {
	// 赋值操作
	currentlyRenderingFiber = wip;
	// 重置hooks链表
	wip.memoizedState = null;
	// 重置effect
	wip.updateQueue = null;
	renderLane = Lane;

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
	renderLane = NoLane;
	return children;
}

// 定义mount的hooks链表

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState,
	useEffect: mountEffect
};

// 定义update的hooks链表
const HooksDispatcherOnUpdate: Dispatcher = {
	useState: updateState,
	useEffect: updateEffect
};

function updateEffect(create: EffectCallback | void, deps: EffectDeps | void) {
	const hook = updateWorkInProgressHook();
	const nextDeps = deps === undefined ? null : deps;
	let destory: EffectCallback | void;

	if (currentHook !== null) {
		const prevEffect = currentHook.memoizedState as Effect;
		destory = prevEffect.destroy;

		if (nextDeps !== null) {
			const prevDeps = prevEffect.deps;

			if (areHookInputsEqual(nextDeps, prevDeps)) {
				// deps没有变化,不需要更新
				hook.memoizedState = pushEffect(Passive, create, destory, nextDeps);
				return;
			}
		}

		// 不相等,需要更新
		(currentlyRenderingFiber as FiberNode).flags |= PassiveEffect; //打标记
		hook.memoizedState = pushEffect(Passive | HookHasEffect, create, destory, nextDeps);
	}
}
function areHookInputsEqual(a: EffectDeps, b: EffectDeps): boolean {
	if (a === null || b === null) {
		return false;
	}

	for (let i = 0; i < a.length && i < b.length; i++) {
		if (Object.is(a[i], b[i])) {
			continue;
		}
		return false;
	}

	return true;
}

function mountEffect(create: EffectCallback | void, deps: EffectDeps | void) {
	const hook = mountWorkInProgressHook();
	const nextDeps = deps === undefined ? null : deps;

	// mount需要执行回调,打上执行回调的标识
	currentlyRenderingFiber!.flags |= PassiveEffect;

	hook.memoizedState = pushEffect(
		Passive | HookHasEffect, //mount需要执行回调，打上标记
		create,
		undefined,
		nextDeps
	);
}

function pushEffect(
	hookFlags: Flags,
	create: EffectCallback | void,
	destroy: EffectCallback | void,
	deps: EffectDeps
): Effect {
	const effect: Effect = {
		tag: hookFlags,
		create,
		destroy,
		deps,
		next: null
	};
	const fiber = currentlyRenderingFiber as FiberNode;
	const updateQueue = fiber.updateQueue as FCUpdateQueue<any>;
	if (updateQueue === null) {
		const updateQueue = createFCUpdateQueue();
		fiber.updateQueue = updateQueue;
		effect.next = effect;
		updateQueue.lastEffect = effect; //形成链表
	} else {
		const lastEffect = updateQueue.lastEffect;
		if (lastEffect === null) {
			effect.next = effect;
			updateQueue.lastEffect = effect; //形成链表
		} else {
			// 插入链表
			const firstEffect = lastEffect.next;
			lastEffect.next = effect;
			effect.next = firstEffect;
			updateQueue.lastEffect = effect; //形成链表
		}
	}

	return effect;
}

function createFCUpdateQueue<State>() {
	const updateQueue = createUpdateQueue<State>() as FCUpdateQueue<State>;
	updateQueue.lastEffect = null;
	return updateQueue;
}

function updateState<State>(): [State, Dispatch<State>] {
	// 1.找到当前useState的hook数据
	const hook = updateWorkInProgressHook();

	// 2.实现updateState中计算新的state
	const queue = hook.updateQueue as UpdateQueue<State>;
	const pending = queue.shared.pending; // 存储的更新动作
	queue.shared.pending = null; //需要置空，不然会一直缓存导致后面更新叠加

	if (pending !== null) {
		// 计算
		const { memoizedState } = processUpdateQueue(
			hook.memoizedState,
			pending,
			renderLane
		);
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
	const lane = requestUpdateLanes();

	/**
	 * 返回 {action: 11} -->更新的值
	 */
	const update = createUpdate(action, lane);

	/**
	 * dispatch: ƒ ()
	 * shared: pending: {action: 11}
	 */
	enqueueUpdate(updateQueue, update); // 将更新动作插入到链表中

	scheduleUpdateOnFiber(fiber, lane); //触发更新
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
