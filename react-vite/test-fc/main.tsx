/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-16 14:04:45
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-08-19 17:24:45
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

	window.setNum = setNum;

	return <div >{number}</div>;
}

const root = document.querySelector('#root');

ReactDOM.createRoot(root).render(<App />);

console.log(React);

console.log(ReactDOM);
