/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-23 10:08:25
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-09-10 10:30:54
 * @FilePath: \react\packages\react-dom\src\SyntheticEvent.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Container } from 'hostConfig';
import {
	unstable_ImmediatePriority,
	unstable_NormalPriority,
	unstable_runWithPriority,
	unstable_UserBlockingPriority
} from 'scheduler';
import { Props } from 'shared/ReactTypes';

export const elementPropsKey = '_props';

export interface DOMElement extends Element {
	[elementPropsKey]: Props;
}
type EventCallback = (event: Event) => void;

export interface Paths {
	capture: EventCallback[];
	bubble: EventCallback[];
}

interface SyntheticEvent extends Event {
	_stopPropagation: boolean;
}

export function updateFiberProps(node: DOMElement, props: Props) {
	node[elementPropsKey] = props;
}

const validEventTypeList = [
	'click',
	'dblclick',
	'contextmenu',
	'drag',
	'dragend',
	'dragenter',
	'dragexit',
	'dragleave',
	'dragover',
	'dragstart',
	'drop',
	'focus',
	'focusin',
	'focusout',
	'input',
	'keydown',
	'keypress',
	'keyup',
	'mousedown',
	'mouseenter',
	'mouseleave',
	'mousemove',
	'mouseout',
	'mouseover',
	'mouseup',
	'scroll'
];

export function initEvent(container: Container, eventType: string) {
	if (!validEventTypeList.includes(eventType)) {
		console.log('当前不支持', eventType, '事件');
		return;
	}
	if (_DEV_) {
		console.log('初始化事件', eventType);
	}

	container.addEventListener(eventType, (listener) => {
		dispatchEvent(container, eventType, listener);
	});
}

function dispatchEvent(
	container: Container,
	eventType: string,
	listener: Event
) {
	const targetElement = listener.target;
	if (targetElement === null) {
		console.log('事件不存在target', listener);
		return;
	}

	// 1.收集事件
	const { capture, bubble } = collectPaths(
		targetElement as DOMElement,
		container,
		eventType
	);
	// 2.构建合成事件
	const syntheticEvent = createSyntheticEvent(listener);

	// 3.遍历capture 捕获阶段
	triggerEventFlow(capture, syntheticEvent);

	// 4.遍历bubble 冒泡阶段
	if (!syntheticEvent._stopPropagation) {
		triggerEventFlow(bubble, syntheticEvent);
	}
}

// 捕获
function triggerEventFlow(
	paths: EventCallback[],
	syntheticEvent: SyntheticEvent
) {
	for (let i = 0; i < paths.length; i++) {
		const callBack = paths[i];

		unstable_runWithPriority(
			eventTypeToSchdulerPriority(syntheticEvent.type),
			() => {
				callBack.call(null, syntheticEvent);
			}
		);

		// 阻止捕获
		if (syntheticEvent._stopPropagation) {
			break;
		}
	}
}

function createSyntheticEvent(e: Event) {
	const syntheticEvent = e as SyntheticEvent;
	syntheticEvent._stopPropagation = false;
	const originStopPropagation = e.stopPropagation; //原始

	syntheticEvent.stopPropagation = () => {
		syntheticEvent._stopPropagation = true;
		if (originStopPropagation) {
			originStopPropagation();
		}
	};

	return syntheticEvent;
}

function collectPaths(
	targetElement: DOMElement,
	container: Container,
	eventType: string
) {
	const paths: Paths = {
		capture: [],
		bubble: []
	};

	while (targetElement && targetElement !== container) {
		const elementProps = targetElement[elementPropsKey];

		const callbackNameList = getEventCallbackNameFromEventType(eventType);
		if (callbackNameList) {
			callbackNameList.forEach((callbackName, i) => {
				const eventCallback = elementProps[callbackName]; //获取dom绑定的onclick
				if (eventCallback) {
					if (i === 0) {
						paths.capture.unshift(eventCallback); //捕获阶段反向插入
					} else {
						paths.bubble.push(eventCallback); //冒泡
					}
				}
			});
		}
		targetElement = targetElement.parentNode as DOMElement;
	}

	return paths;
}

// 映射 click --> onclick onClickCapture
function getEventCallbackNameFromEventType(
	eventType: string
): string[] | undefined {
	return {
		click: ['onClickCapture', 'onClick']
	}[eventType];
}

function eventTypeToSchdulerPriority(eventType: string): number {
	switch (eventType) {
		case 'click':
		case 'keydown':
		case 'keyup':
			return unstable_ImmediatePriority; //   //立刻执行的优先级
		case 'scroll':
			return unstable_UserBlockingPriority; // 用户阻塞的优先级
		default:
			return unstable_NormalPriority; // 正常优先级
	}
}
