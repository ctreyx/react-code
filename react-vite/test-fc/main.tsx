/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-16 14:04:45
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-09-09 09:51:33
 * @FilePath: \react\react-vite\test-fc\main.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

function Child() {
	const [number1, setNum1] = useState(10);

	useEffect(() => {
		console.log('child mount');

		return () => {
			console.log('child unmount');
		};
	}, []);

	console.log('number1', number1);

	return <div onClick={() => setNum1(number1 + 100)}>function child</div>;
}

// function App() {
// 	const [number, setNum] = useState(100);

// 	return number === 3 ? (
// 		<Child />
// 	) : (
// 		<div onClick={() => setNum(3)}>{number}</div>
// 	);
// }

function App() {
	const [number, setNum] = useState(0);
	const arr =
		number % 2 === 0
			? [<li key="1">1</li>, <li key="2">2</li>, <li key="3">3</li>]
			: [<li key="3">3</li>, <li key="2">2</li>, <li key="1">1</li>];

	useEffect(() => {
		console.log('App mount', number);
	}, []);

	useEffect(() => {
		console.log('number create', number);

		return () => {
			console.log('number destroy', number);
		};
	}, [number]);

	return (
		<ul
			onClick={() => {
				setNum((n) => n + 1);
				// setNum((n) => n + 1);
				// setNum((n) => n + 1);
			}}
		>
			{number}
			{number === 0 ? <Child /> : 'none'}

			{/* <>
				<li>1</li>
				<li>2</li>
			</>
			<li>3</li>
			<li>4</li>

			{arr} */}
		</ul>
	);

	return <ul onClick={() => setNum(number + 1)}>{arr}</ul>;
}

const root = document.querySelector('#root') as Element;

ReactDOM.createRoot(root).render(<App />);

console.log(React);

console.log(ReactDOM);
