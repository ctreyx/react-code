/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-16 14:04:45
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-09-18 14:20:10
 * @FilePath: \react\react-vite\test-fc\main.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';


// 并发更新的切片功能

function Child({ children }) {
	const now = performance.now();
	while (performance.now() - now < 4) {}

	return <div>{children}</div>;
}

function App() {
	const [number, setNum] = useState(100);

	return (
		<ul
			onClick={() => {
				setNum((n) => n + 1);
			}}
		>
			{new Array(number).fill(0).map((_, index) => {
				return <Child key={index}>{index}</Child>;
			})}
		</ul>
	);
}

const root = document.querySelector('#root') as Element;

ReactDOM.createRoot(root).render(<App />);

console.log(React);

console.log(ReactDOM);
