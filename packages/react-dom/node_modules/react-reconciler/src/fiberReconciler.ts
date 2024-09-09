/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-08 15:24:28
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-09-02 11:16:29
 * @FilePath: \react\packages\react-reconciler\src\fiberReconciler.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Container } from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import { HostRoot } from './workTags';
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	UpdateQueue
} from './updateQueue';
import { IReactElement } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';
import { requestUpdateLanes } from './fiberLanes';

export function createContainer(container: Container) {
	// 创建根root
	const hostRootFiber = new FiberNode(HostRoot, {}, null);
	const root = new FiberRootNode(container, hostRootFiber);

	hostRootFiber.updateQueue = createUpdateQueue();

	return root;
}

export function updateContainer(
	element: IReactElement | null,
	root: FiberRootNode
) {
	const hostRootFiber = root.current;
	// 从根root遍历
	const lane = requestUpdateLanes();
	const update = createUpdate<IReactElement | null>(element, lane);

	enqueueUpdate(
		hostRootFiber.updateQueue as UpdateQueue<IReactElement | null>,
		update
	);

	scheduleUpdateOnFiber(hostRootFiber, lane);

	return element;
}
