/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-09-20 14:43:28
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-09-20 14:46:58
 * @FilePath: \react\packages\react\context.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { REACT_CONTEXT_TYPE, REACT_PROVIDER_TYPE } from 'shared/ReactSymbols';
import { ReactContext } from 'shared/ReactTypes';

export function createContext<T>(defaultValue: T): ReactContext<T> {
	const context: ReactContext<T> = {
		$$typeof: REACT_CONTEXT_TYPE,
		Provider: null,
		_currentValue: defaultValue
	};

	context.Provider = {
		$$typeof: REACT_PROVIDER_TYPE,
		_context: context
	};

	return context;
}
