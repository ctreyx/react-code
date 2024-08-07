/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-07 11:40:42
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-08-07 11:44:27
 * @FilePath: \react\packages\react-reconciler\src\workTags.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// 描述fubernode是什么类型的节点

export type WorkTag =
	| typeof FunctionComponent
	| typeof HostRoot
	| typeof HostText
	| typeof HostComponent; 

export const FunctionComponent = 0;
export const HostRoot = 3;
export const HostComponent = 5;
export const HostText = 6;
