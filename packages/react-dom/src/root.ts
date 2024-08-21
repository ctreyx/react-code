/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-14 17:36:10
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-08-20 16:14:13
 * @FilePath: \react\packages\react-dom\src\root.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// ReactDOM.createRoot(root),render(<App />)

import {
	createContainer,
	updateContainer
} from 'react-reconciler/src/fiberReconciler';
import { Container } from './hostConfig';
import { IReactElement } from 'shared/ReactTypes';

export function createRoot(container: Container) {
	const root = createContainer(container);

	return {
		// render方法接受一个jsx ReactElement
		render(element: IReactElement) {
			return updateContainer(element, root);
		}
	};
}
