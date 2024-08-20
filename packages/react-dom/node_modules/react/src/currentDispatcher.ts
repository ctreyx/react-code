import { Action } from 'shared/ReactTypes';

/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-16 17:00:31
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-08-16 17:17:05
 * @FilePath: \react\packages\react\src\currentDispatcher.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

export type Dispatch<State> = (action: Action<State>) => void;

export interface Dispatcher {
	// const [number,setNumber]=useState((number)=>number+1)
	useState: <T>(initialState: (() => T) | T) => [T, Dispatch<T>];
}

const currentDispatcher: { current: Dispatcher | null } = {
	current: null
};

export const resolveDispatcher = (): Dispatcher => {
	const dispatcher = currentDispatcher.current;

	if (dispatcher === null) {
		throw new Error('hook只能在函数组件使用');
	}

	return dispatcher;
};

export default currentDispatcher;
