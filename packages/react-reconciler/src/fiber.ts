/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-07 11:38:52
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-08-07 14:32:17
 * @FilePath: \react\packages\react-reconciler\src\fiber.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Key, Props, Ref } from 'shared/ReactTypes';
import { WorkTag } from './workTags';
import { Flags, NoFlags } from './fiberFlags';

export class FiberNode {
	tag: WorkTag;
	key: Key;
	stateNode: any;
	type: any;
	ref: Ref;
	pendingProps: Props;
	memoizedProps: Props;
	alternate: FiberNode | null;
	flags: Flags;

	return: FiberNode | null;
	sibling: FiberNode | null;
	child: FiberNode | null;
	index: number;
	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		this.tag = tag; //实例
		this.key = key;
		this.stateNode = null; // 实例化后的实例对象,<div></div>
		this.type = null; // 组件类型,如Function

		// 构成树状结构
		this.return = null; //指向父fiber, 为什么是return而不是parent，因为工作单元下一个就是父级
		this.sibling = null; //指向兄弟fiber
		this.child = null;
		this.index = 0;
		this.ref = null;

		// 作为工作单元
		this.pendingProps = pendingProps; //当前状态
		this.memoizedProps = null; //完成后的确定状态
		this.alternate = null; //双缓存
		this.flags = NoFlags; //副作用
	}
}
