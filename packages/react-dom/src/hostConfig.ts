import { FiberNode } from 'react-reconciler/src/fiber';
import { HostText } from 'react-reconciler/src/workTags';
import { Props } from 'shared/ReactTypes';
import { DOMElement, updateFiberProps } from './SyntheticEvent';

/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-14 17:36:02
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-09-04 15:46:36
 * @FilePath: \react\packages\react-dom\src\hostConfig.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export type Container = Element;
export type Instance = Element; //实例
export type TextInstance = Text; //文本实例

// 创建实例
// export const createInstance = (type: string, props: any) => {
export const createInstance = (type: string, props: Props) => {
	// 通过type创建实例
	const element = document.createElement(type) as unknown;

	updateFiberProps(element as DOMElement, props);

	return element as DOMElement;
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

export function removeChild(
	child: Instance | TextInstance,
	container: Container
) {
	container.removeChild(child);
}

export function insertChildTocontainer(
	child: Instance,
	container: Container,
	before: Instance
) {
	container.insertBefore(child, before);
}

/**
 * 微任务调度
 * 判断是否支持微任务，不支持通过promise.then模拟，如果promise也不支持就走settimeout宏任务
 */
export const scheduleMicroTask =
	typeof queueMicrotask === 'function'
		? queueMicrotask
		: typeof Promise === 'function'
			? (callback: (...args: any) => void) =>
					Promise.resolve(null).then(callback)
			: setTimeout;

export function hideInstance(instance: Instance) {
	const style = (instance as HTMLLIElement).style;
	style.setProperty('display', 'none', 'important');
}

export function unhideInstance(instance: Instance) {
	const style = (instance as HTMLLIElement).style;
	style.display = '';
}

export function hideTextInstance(instance: TextInstance) {
	instance.nodeValue = ''; //消除内容即可
}
export function unhideTextInstance(instance: TextInstance, text: string) {
	instance.nodeValue = text;
}
