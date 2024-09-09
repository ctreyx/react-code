// 同步调度队列

let syncQueue: ((...args: any) => void)[] | null = [];
let isFlushingSyncQueue = false;

export function scheduleSyncCallback(callback: (...args: any) => void) {
	if (syncQueue === null) {
		syncQueue = [callback];
	} else {
		syncQueue.push(callback);
	}
}

export function flushSyncCallbacks() {
	if (!isFlushingSyncQueue && syncQueue) {
		isFlushingSyncQueue = true;
		try {
			const queue = syncQueue;
			queue.forEach((callback) => callback());

			syncQueue = null;
		} catch (e) {
			if (_DEV_) {
				console.log('Failed to flush');
			}
		} finally {
			isFlushingSyncQueue = false;
		}
	}
}
