/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-16 14:04:45
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-08-21 16:07:34
 * @FilePath: \react\react-vite\test-fc\main.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

function Child() {
	return <div>function child </div>;
}

function App() {
	const [number, setNum] = useState(100);
	const [number1, setNum1] = useState(10);

	window.setNum = setNum;
	window.setNum1 = setNum1;

	console.log('number1', number1);

	return number1 === 3 ? <Child /> : <div>{number}</div>;
}

const root = document.querySelector('#root') as Element;

ReactDOM.createRoot(root).render(<App />);

console.log(React);

console.log(ReactDOM);
