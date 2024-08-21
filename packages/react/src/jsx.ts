/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-06 14:20:09
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-08-20 16:11:08
 * @FilePath: \react\packages\react\src\jsx.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import {
	Key,
	Props,
	Ref,
	Type,
	IReactElement,
	ElementType
} from 'shared/ReactTypes';

export const ReactElement = function (
	type: Type,
	key: Key,
	ref: Ref,
	props: Props
): IReactElement {
	const element = {
		$$typeof: REACT_ELEMENT_TYPE,
		type,
		key,
		ref,
		props,
		_mark: 'tx'
	};

	return element;
};

/**
 *
 * @param type div span element type
 * @param config  props key
 * @param maybeChildren  optional children
 */
export const jsx = (type: ElementType, config: any, ...maybeChildren: any) => {
	let key: Key = null;
	const props: Props = {};
	let ref: Ref = null;

	for (const prop in config) {
		const val = config[prop];

		if (val === 'key') {
			key = config.key ? val + '' : undefined;
			continue;
		}

		if (val === 'ref') {
			ref = config.ref ? config.ref : undefined;
			continue;
		}
		// 判断是不是自己身上的props而非原型上
		if ({}.hasOwnProperty.call(config, prop)) {
			props[prop] = val;
		}
	}

	// 处理children
	const maybeChildrenLenth = maybeChildren.lenth;

	if (maybeChildrenLenth) {
		if (maybeChildrenLenth === 1) {
			props.children = maybeChildren[0];
		} else {
			props.children = maybeChildren;
		}
	}
	return ReactElement(type, key, ref, props);
};

/**
 * jsxDEV就是不要maybeChildren
 */
export const jsxDEV = (type: ElementType, config: any) => {
	let key: Key = null;
	const props: Props = {};
	let ref: Ref = null;

	for (const prop in config) {
		const val = config[prop];

		if (val === 'key') {
			key = config.key ? val + '' : undefined;
			continue;
		}

		if (val === 'ref') {
			ref = config.ref ? config.ref : undefined;
			continue;
		}
		// 判断是不是自己身上的props而非原型上
		if ({}.hasOwnProperty.call(config, prop)) {
			props[prop] = val;
		}
	}

	return ReactElement(type, key, ref, props);
};

export function isValidElement(object: any): boolean {
	return (
		typeof object === 'object' &&
		object !== null &&
		object.$$typeof === REACT_ELEMENT_TYPE
	);
}
