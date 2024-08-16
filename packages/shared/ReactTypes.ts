/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-06 14:25:30
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-08-09 09:23:24
 * @FilePath: \react\packages\shared\ReactTypes.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export type Type = any;
export type Key = any;
export type Ref = any;
export type Props = any;
export type ElementType = any;

export interface IReactElement {
	$$typeof: symbol | number;
	type: ElementType;  // div span
	key: Key;
	ref: Ref;
	props: Props;
	_mark: string;
}

export type Action<State> = State | ((prevState: State) => State);
