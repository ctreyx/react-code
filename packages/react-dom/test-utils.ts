/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-20 14:01:39
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-08-20 16:13:33
 * @FilePath: \react\packages\react-dom\test-utils.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { IReactElement } from 'shared/ReactTypes';
// @ts-ignore
import { createRoot } from 'react-dom';

export function renderIntoDocument(element: IReactElement) {
	const div = document.createElement('div');
	return createRoot(div).render(element);
}
