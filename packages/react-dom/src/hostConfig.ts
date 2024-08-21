import { FiberNode } from 'react-reconciler/src/fiber';
import { HostText } from 'react-reconciler/src/workTags';

/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-14 17:36:02
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-08-21 10:30:06
 * @FilePath: \react\packages\react-dom\src\hostConfig.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export type Container = Element;
export type Instance = Element; //实例
export type TextInstance = Text; //文本实例

// 创建实例
// export const createInstance = (type: string, props: any) => {
export const createInstance = (type: string) => {
	// 通过type创建实例
	const element = document.createElement(type);
	return element;
};

export const appendInitialChild = (
	parent: Container | Instance,
	child: Instance
) => {
	parent.appendChild(child);
};

// 创建文本节点
export const appendTextInstance = (content: string) => {
	return document.createTextNode(content);
};

export const appendChildToContainer = (
	parent: Container | Instance,
	child: Instance
) => {
	console.log('插入', parent, child);

	parent.appendChild(child);
};

export function commitUpdate(fiber: FiberNode) {
	switch (fiber.tag) {
		case HostText:
			const text = fiber.memoizedProps.content;
			return commitTextUpdate(fiber.stateNode, text);

		default:
			if (_DEV_) {
				console.log('未处理的update类型', fiber.tag);
			}
			break;
	}
}

export function commitTextUpdate(textInstance: TextInstance, content: string) {
	textInstance.textContent = content;
}


export function removeChild(child: Instance | TextInstance, container: Container) {
	container.removeChild(child);
	
}