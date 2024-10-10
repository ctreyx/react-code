import { Action, ReactContext } from 'shared/ReactTypes';

/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-16 17:00:31
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2024-10-09 10:04:32
 * @FilePath: \react\packages\react\src\currentDispatcher.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

export type Dispatch<State> = (action: Action<State>) => void;

export interface Dispatcher {
	// const [number,setNumber]=useState((number)=>number+1)
	useState: <T>(initialState: (() => T) | T) => [T, Dispatch<T>];
	useEffect: (callback: () => void | void, deps: any[] | void) => void;
	useTransition: () => [boolean, (callback: () => void) => void];
	useRef: <T>(initialValue: T) => { current: T };
	useContext: <T>(context: ReactContext<T>) => T;
	useMemo: <T>(nextCreate: () => T, deps: any) => T;
	useCallback: <T>(callback: T, deps: any) => T;
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
