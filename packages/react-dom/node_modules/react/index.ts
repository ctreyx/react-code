import { jsxDEV, isValidElement as isValidElementFn } from './src/jsx';
import currentDispatcher, {
	Dispatcher,
	resolveDispatcher
} from './src/currentDispatcher';
/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-06 14:07:24
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-08-21 15:26:00
 * @FilePath: \react\packages\react\index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

export const useState: Dispatcher['useState'] = (initialState) => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useState(initialState);
};

// 内部数据共享
export const _SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
	currentDispatcher
};

export const version = '1.0.0';
export const createElement = jsxDEV;

export const isValidElement = isValidElementFn;

export default {
	version: '1.0.0',
	createElement: jsxDEV
};
