/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-09-02 10:43:33
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-09-18 15:16:46
 * @FilePath: \react\packages\react-reconciler\src\fiberLanes.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import {
	unstable_getCurrentPriorityLevel,
	unstable_IdlePriority,
	unstable_ImmediatePriority,
	unstable_NormalPriority,
	unstable_UserBlockingPriority
} from 'scheduler';
import { FiberRootNode } from './fiber';
import ReactCurrentBatchConfig from 'react/src/currentBatchConfig';

export type Lane = number;
export type Lanes = number;

export const SyncLane = 0b00001;
export const InputContinuesLane = 0b00010; //连续输入优先级
export const DefaultLane = 0b00100; //默认优先级
export const TransitionLane = 0b01000;
export const IdleLane = 0b10000; //空闲优先级

export const NoLanes = 0b00000;
export const NoLane = 0b00000;

export function mergeLanes(laneA: Lane, LaneB: Lane): Lane {
	return laneA | LaneB;
}

export function requestUpdateLanes() {
	// transitionLanes,当前再执行transition的优先级
	const isTransition = ReactCurrentBatchConfig.transition !== null;
	if (isTransition) {
		return TransitionLane;
	}
	// 从上下文获取scheduler优先级
	const currentSchedulerPriority = unstable_getCurrentPriorityLevel();
	// 将调度器转为lane
	const lane = schedulerPriorityToLanes(currentSchedulerPriority);

	return lane;
}

export function getHightestPriorityLane(lanes: Lanes): Lane {
	// 0b0011 返回 0b0001 , 值越小优先级越高
	return lanes & -lanes;
}

// 通过按位余 判断有没有交际。 有交集优先级才足够，而不是1《2这种简单的对比。
export function isSubsetOfLanes(set: Lanes, subset: Lanes): boolean {
	return (set & subset) === set;
}

export function markRootFinished(root: FiberRootNode, lane: Lane) {
	root.pendingLanes &= ~lane;
}

export function lanesToSchedulerPriority(lanes: Lanes): number {
	const lane = getHightestPriorityLane(lanes);

	if (lane === SyncLane) {
		return unstable_ImmediatePriority; //同步lane 对应 立即执行
	}

	if (lane === InputContinuesLane) {
		return unstable_UserBlockingPriority; //连续输入 用户阻塞的优先级
	}

	if (lane === DefaultLane) {
		return unstable_NormalPriority; //默认优先级
	}

	return unstable_IdlePriority; //空闲优先级
}

export function schedulerPriorityToLanes(schedulerPriority: number): Lane {
	if (schedulerPriority === unstable_ImmediatePriority) {
		return SyncLane;
	}

	if (schedulerPriority === unstable_UserBlockingPriority) {
		return InputContinuesLane;
	}

	if (schedulerPriority === unstable_NormalPriority) {
		return DefaultLane;
	}

	return NoLane;
}
