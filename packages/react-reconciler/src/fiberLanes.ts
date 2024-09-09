/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-09-02 10:43:33
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-09-05 15:40:24
 * @FilePath: \react\packages\react-reconciler\src\fiberLanes.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { FiberRootNode } from './fiber';

export type Lane = number;
export type Lanes = number;

export const SyncLane = 0b0001;
export const NoLanes = 0b0000;
export const NoLane = 0b0000;

export function mergeLanes(laneA: Lane, LaneB: Lane): Lane {
	return laneA | LaneB;
}

export function requestUpdateLanes() {
	return SyncLane;
}

export function getHightestPriorityLane(lanes: Lanes): Lane {
	// 0b0011 返回 0b0001 , 值越小优先级越高
	return lanes & -lanes;
}

export function markRootFinished(root: FiberRootNode, lane: Lane) {
	root.pendingLanes &= ~lane;
}
