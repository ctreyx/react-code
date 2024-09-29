/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-07 11:40:42
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2024-09-23 17:36:44
 * @FilePath: \react\packages\react-reconciler\src\workTags.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// 描述fubernode是什么类型的节点

export type WorkTag =
	| typeof FunctionComponent
	| typeof HostRoot
	| typeof HostText
	| typeof HostComponent
	| typeof Fragment
	| typeof ContextProvider
	| typeof SuspenseComponent
	| typeof OffscreenComponent;

export const FunctionComponent = 0;
export const HostRoot = 3;
export const HostComponent = 5;
export const HostText = 6;
export const Fragment = 7;
export const ContextProvider = 8;

export const SuspenseComponent = 13;
export const OffscreenComponent = 14;
