/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-07 14:27:25
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-09-19 14:03:00
 * @FilePath: \react\packages\react-reconciler\src\fiberFlags.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export const NoFlags = /*                      */ 0b0000000;
export const Placement = /*                    */ 0b0000001;
export const Update = /*                       */ 0b0000010;
export const ChildDeletion = /*                */ 0b0000100;
export type Flags = number;

export const PassiveEffect = /*                */ 0b0001000;
export const Ref = /*                          */ 0b0010000;
export const Visibility = /*                   */ 0b0100000;

export const MutationMask =
	Placement | Update | ChildDeletion | Ref | Visibility;
export const LayoutMask = Ref;

export const PassiveMark = PassiveEffect | ChildDeletion; //判断是否需要执行useEffect,儿子卸载的时候也需要执行useEffect销毁
