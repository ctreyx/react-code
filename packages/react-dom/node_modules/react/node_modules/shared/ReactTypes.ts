/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-06 14:25:30
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-09-25 15:02:11
 * @FilePath: \react\packages\shared\ReactTypes.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export type Type = any;
export type Key = any;
export type Ref = { current: any } | ((instance: any) => void);
export type Props = any;
export type ElementType = any;

export interface IReactElement {
	$$typeof: symbol | number;
	type: ElementType; // div span
	key: Key;
	ref: Ref;
	props: Props;
	_mark: string;
}

export type Action<State> = State | ((prevState: State) => State);

export type ReactContext<T> = {
	$$typeof: symbol | number;
	Provider: ReactProviderType<T> | null;
	_currentValue: T;
};

export type ReactProviderType<T> = {
	$$typeof: symbol | number;
	_context: ReactContext<T> | null;
};

export type Usable<T> = Thenable<T> | ReactContext<T>;

// untracked 未追踪
// pending
// fulfilled _> resolve
// rejected _> reject

export type ThenableImpl<T, Result, Err> = {
	then(
		onFulfilled: (value: T) => Result,
		onRejcted: (err: Err) => Result
	): void | Wakeabled<Result>;
};

export type Wakeabled<Result> = {
	then(onFulfilled: () => Result): void | Wakeabled<Result>;
};

interface UntrackedTheanable<T, Result, Err>
	extends ThenableImpl<T, Result, Err> {
	status?: void;
}

interface PendingTheanable<T, Result, Err>
	extends ThenableImpl<T, Result, Err> {
	status: 'pending';
}

interface FulfilledTheanable<T, Result, Err>
	extends ThenableImpl<T, Result, Err> {
	status: 'fulfilled';
	value: T;
}

interface RejectedTheanable<T, Result, Err>
	extends ThenableImpl<T, Result, Err> {
	status: 'rejected';
	reason: Err;
}

export type Thenable<T, Result = void, Err = any> =
	| UntrackedTheanable<T, Result, Err>
	| PendingTheanable<T, Result, Err>
	| FulfilledTheanable<T, Result, Err>
	| RejectedTheanable<T, Result, Err>;
