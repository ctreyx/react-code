/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-16 14:04:45
 * @LastEditors: fumi 330696896@qq.com
 * @LastEditTime: 2024-09-30 11:32:57
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

function App() {
	const [num, setNum] = useState(0);
	const [num1, setNum1] = useState(0);

	console.log('app num', num);
	console.log('app num1', num1);

	return (
		<div
			onClick={() => {
				setNum(1);
			setNum1(1);
			}}
		>
			<Cpn />
		</div>
	);
}
function Cpn() {
	console.log('Cpn render');

	return <div>Cpn</div>;
}
const root = document.querySelector('#root') as Element;

ReactDOM.createRoot(root).render(<App />);

console.log(React);

console.log(ReactDOM);
