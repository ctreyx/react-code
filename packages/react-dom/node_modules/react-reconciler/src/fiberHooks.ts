/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-16 11:24:55
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2024-10-09 15:58:08
 * @FilePath: \react\packages\react-reconciler\src\fiberHooks.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import internals from 'shared/internals';
import { FiberNode } from './fiber';
import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
import {
	basicStateReducer,
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	processUpdateQueue,
	Update,
	UpdateQueue
} from './updateQueue';
import { Action, ReactContext, Thenable, Usable } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';
import {
	Lane,
	mergeLanes,
	NoLane,
	NoLanes,
	removeLanes,
	requestUpdateLanes
} from './fiberLanes';
import { Flags, PassiveEffect } from './fiberFlags';
import { HookHasEffect, Passive } from './hookEffectTags';
import ReactCurrentBatchConfig from 'react/src/currentBatchConfig';
import { REACT_CONTEXT_TYPE } from 'shared/ReactSymbols';
import { markWipReceivedUpdate } from './beginWork';

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
	baseState: any;
	baseQueue: Update<any> | null;
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
	lastRenderState: State;
}

type EffectCallback = () => void;
type EffectDeps = any[] | null;

export function renderWithHooks(
	wip: FiberNode,
	Component: FiberNode['type'],
	Lane: Lane
) {
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

	// const Component = wip.type; //函数组件保存在type
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
	useEffect: mountEffect,
	useTransition: mountTransition,
	useRef: mountRef,
	useContext: readContext,
	useMemo: mountMemo,
	useCallback: mountCallback
};

// 定义update的hooks链表
const HooksDispatcherOnUpdate: Dispatcher = {
	useState: updateState,
	useEffect: updateEffect,
	useTransition: updateTransition,
	useRef: updateRef,
	useContext: readContext,
	useMemo: updateMemo,
	useCallback: updateCallback
};

function use<T>(usable: Usable<T>): T {
	if (usable !== null && typeof usable === 'object') {
		if (typeof (usable as Thenable<T>).then === 'function') {
			// Thenable 异步
		} else if ((usable as ReactContext<T>).$$typeof === REACT_CONTEXT_TYPE) {
			// context
			const context = usable as ReactContext<T>;

			return readContext(context);
		}
	}

	throw new Error('不支持的use参数');
}

function readContext<T>(context: ReactContext<T>): T {
	const consumer = currentlyRenderingFiber;
	if (consumer === null) {
		throw new Error('只能在函数组件中调用useContext');
	}
	const value = context._currentValue;
	return value;
}

function mountRef<T>(initialValue: T): { current: T } {
	const hook = mountWorkInProgressHook();
	const ref = { current: initialValue };
	hook.memoizedState = ref;
	return ref;
}
function updateRef<T>(initialValue: T): { current: T } {
	const hook = updateWorkInProgressHook();
	return hook.memoizedState;
}

//  [ispending,startTransition]=useTransition()  第一个是是否再过度中，第二个是开始过度的函数
function mountTransition(): [boolean, (callback: () => void) => void] {
	// .transition内部会设置useState
	const [isPending, setPending] = mountState(false);
	// 2.创建hook链表
	const hook = mountWorkInProgressHook();

	const start = startTransition.bind(null, setPending);

	hook.memoizedState = start;

	return [isPending, start];
}

function updateTransition(): [boolean, (callback: () => void) => void] {
	const [isPending] = updateState();
	const hook = updateWorkInProgressHook();
	const start = hook.memoizedState;
	return [isPending as boolean, start];
}

function startTransition(setPending: Dispatch<boolean>, callback: () => void) {
	// 1.触发高优先级更新，用useState
	setPending(true);

	const prevTransition = ReactCurrentBatchConfig.transition;
	ReactCurrentBatchConfig.transition = 1;

	// 2.执行过度函数，改变优先级

	callback();
	setPending(false);

	// 3.还原优先级
	ReactCurrentBatchConfig.transition = prevTransition;
}

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
		hook.memoizedState = pushEffect(
			Passive | HookHasEffect,
			create,
			destory,
			nextDeps
		);
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
	const queue = hook.updateQueue as FCUpdateQueue<State>;
	const baseState = hook.baseState;
	const pending = queue.shared.pending; // 存储的更新动作

	const current = currentHook as Hook;
	let baseQueue = current.baseQueue;

	// queue.shared.pending = null; //需要置空，不然会一直缓存导致后面更新叠加

	if (pending !== null) {
		if (baseQueue !== null) {
			// baseQueue b2->b0->b1->b2
			// pending p2->p0->p1->p2

			// first=b0
			const baseFirst = baseQueue.next;
			// first=p0
			const pendingFirst = pending.next;

			// b2->p0
			baseQueue.next = pendingFirst;
			// p2->b0
			pending.next = baseFirst;
			// p2->b0->b1->b2->p0->p1->p2
		}

		baseQueue = pending;
		// 保存再current中
		current.baseQueue = pending;
		queue.shared.pending = null; //需要置空，不然会一直缓存导致后面更新叠加

		// // 计算
		// const { memoizedState } = processUpdateQueue(
		// 	hook.memoizedState,
		// 	pending,
		// 	renderLane
		// );
		// hook.memoizedState = memoizedState;
	}

	if (baseQueue !== null) {
		// bailout
		const prevState = hook.memoizedState;

		// 计算
		const {
			memoizedState,
			baseQueue: newBaseQueue,
			baseState: newBaseState
		} = processUpdateQueue(baseState, baseQueue, renderLane, (update) => {
			const skippedLane = update.lane;
			const fiber = currentlyRenderingFiber as FiberNode;

			fiber.lanes = mergeLanes(fiber.lanes, skippedLane);
		});

		if (!Object.is(prevState, memoizedState)) {
			// 不一致表示没有命中
			markWipReceivedUpdate();
		}

		hook.memoizedState = memoizedState;
		hook.baseQueue = newBaseQueue;
		hook.baseState = newBaseState;
		// eager
		queue.lastRenderState = memoizedState;
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
	// const queue = createUpdateQueue<State>();
	const queue = createFCUpdateQueue<State>();
	hook.updateQueue = queue;

	// 给当前hook赋值memoizedState
	hook.memoizedState = memoizedState;
	hook.baseState = memoizedState;

	//@ts-ignore
	const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);

	queue.dispatch = dispatch;
	// eager
	queue.lastRenderState = memoizedState;

	return [memoizedState, dispatch];
}

function dispatchSetState<State>(
	fiber: FiberNode,
	updateQueue: FCUpdateQueue<State>,
	action: Action<State>
) {
	const lane = requestUpdateLanes();

	/**
	 * 返回 {action: 11} -->更新的值
	 */
	const update = createUpdate(action, lane);

	// eagerState
	const current = fiber.alternate;
	if (
		fiber.lanes === NoLanes &&
		(current === null || current.lanes === NoLanes)
	) {
		// 当前产生得update是这个fiber第一个update
		// 1.上次更新状态
		const currentState = updateQueue.lastRenderState;
		const eagerState = basicStateReducer(currentState, action);

		update.hasEagerState = true;
		update.eagerState = eagerState;

		if (Object.is(currentState, eagerState)) {
			enqueueUpdate(updateQueue, update, fiber, NoLane); // 将更新动作插入到链表中

			// 命中
			if (_DEV_) {
				console.log('命中eager');
			}

			return;
		}
	}

	/**
	 * dispatch: ƒ ()
	 * shared: pending: {action: 11}
	 */
	enqueueUpdate(updateQueue, update, fiber, lane); // 将更新动作插入到链表中

	scheduleUpdateOnFiber(fiber, lane); //触发更新
}

function updateWorkInProgressHook(): Hook {
	let nextCurrentHook: Hook | null;

	if (currentHook === null) {
		// 这是FC updat第一个hook,需要获取hook状态

		const current = currentlyRenderingFiber?.alternate;

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
		next: null,
		baseQueue: currentHook.baseQueue,
		baseState: currentHook.baseState
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
		next: null,
		baseQueue: null,
		baseState: null
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

export function bailoutHook(wip: FiberNode, renderLane: Lane) {
	const current = wip.alternate as FiberNode;
	wip.updateQueue = current.updateQueue;
	wip.flags &= ~PassiveEffect;

	// 命中bailout后，这个fiber还存在lane需要执行，所以需要移除
	current.lanes = removeLanes(current.lanes, renderLane);
}

function mountCallback<T>(callback: T, deps?: any) {
	const hook = mountWorkInProgressHook();
	const nextDeps = deps === undefined ? null : deps;
	hook.memoizedState = [callback, nextDeps];
	return callback;
}

function updateCallback<T>(callback: T, deps?: any) {
	const hook = updateWorkInProgressHook();
	const nextDeps = deps === undefined ? null : deps;
	const preState = hook.memoizedState;

	if (nextDeps !== null) {
		const [preCallback, preDeps] = preState;
		if (areHookInputsEqual(preDeps, nextDeps)) {
			return preCallback;
		}
	}

	hook.memoizedState = [callback, nextDeps];
	return callback;
}

function mountMemo<T>(nextCreate: () => T, deps?: any) {
	const hook = mountWorkInProgressHook();
	const nextDeps = deps === undefined ? null : deps;
	const nextValue = nextCreate();
	hook.memoizedState = [nextValue, nextDeps];
	return nextValue;
}
function updateMemo<T>(nextCreate: () => T, deps?: any) {
	const hook = updateWorkInProgressHook();
	const nextDeps = deps === undefined ? null : deps;
	const preState = hook.memoizedState;

	if (nextDeps !== null) {
		const [preMemo, preDeps] = preState;
		if (areHookInputsEqual(preDeps, nextDeps)) {
			return preMemo;
		}
	}

	const nextValue = nextCreate();
	hook.memoizedState = [nextValue, nextDeps];
	return nextValue;
}
