/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-16 14:04:45
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-09-20 11:42:40
 * @FilePath: \react\react-vite\test-fc\main.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React, {
	useState,
	useEffect,
	useTransition,
	useRef,
	createContext,
	useContext
} from 'react';
import ReactDOM from 'react-dom/client';

const ctxA = createContext('deafult A');
const ctxB = createContext('default B');
function App() {
	return (
		<ctxA.Provider value={'A0'}>
			<ctxB.Provider value={'B0'}>
				<ctxA.Provider value={'A1'}>
					<Cpn />
				</ctxA.Provider>
			</ctxB.Provider>
			<Cpn />
		</ctxA.Provider>
	);
}
function Cpn() {
	const a = useContext(ctxA);
	const b = useContext(ctxB);
	return (
		<div>
			A: {a} B: {b}
		</div>
	);
}
const root = document.querySelector('#root') as Element;

ReactDOM.createRoot(root).render(<App />);

console.log(React);

console.log(ReactDOM);
