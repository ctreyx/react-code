/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-16 14:04:45
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-09-18 15:17:08
 * @FilePath: \react\react-vite\test-fc\main.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React, { useState, useEffect, useTransition } from 'react';
import ReactDOM from 'react-dom/client';

function TabButton({ children }) {
	if (children === 'contact') {
		const now = performance.now();
		while (performance.now() - now < 1000) {}
	}

	return <div>{children}</div>;
}

function App() {
	const [tab, setTab] = useState('first');
	const [isPending, startTransition] = useTransition();

	function selectTab(nextTab: string) {
		startTransition(() => {
			setTab(nextTab);
		});
	}

	return (
		<>
			<div>
				<button onClick={() => selectTab('first')}>首页</button>
				<button onClick={() => selectTab('contact')}>堵塞</button>
				<button onClick={() => selectTab('post')}>post</button>
			</div>

			<div>
				<TabButton>{tab}</TabButton>
			</div>
		</>
	);
}

const root = document.querySelector('#root') as Element;

ReactDOM.createRoot(root).render(<App />);

console.log(React);

console.log(ReactDOM);
