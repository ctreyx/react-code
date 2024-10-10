/*
 * @Author: fumi 330696896@qq.com
 * @Date: 2024-08-16 14:04:45
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2024-10-08 11:27:06
 * @FilePath: \react\react-vite\test-fc\main.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React, {
	useState,
	useEffect,
	useTransition,
	useRef,
	createContext,
	useContext,
	memo
} from 'react';
import ReactDOM from 'react-dom/client';

function App() {
	const [num, setNum] = useState(0);

	console.log('app num', num);

	return (
		<div
			onClick={() => {
				setNum(num + 1);
			}}
		>
			<Cpn num={num} name={'cpn1'} />
			<Cpn num={1} name={'cpn2'} />
		</div>
	);
}
// function Cpn({ num, name }) {
// 	console.log('Cpn render', name);

// 	return (
// 		<div>
// 			{' '}
// 			{name}:{num}{' '}
// 		</div>
// 	);
// }

const Cpn = memo(function ({ num, name }) {
	console.log('Cpn render', name);

	return (
		<div>
			{name}:{num}{' '}
		</div>
	);
});

const root = document.querySelector('#root') as Element;

ReactDOM.createRoot(root).render(<App />);

console.log(React);

console.log(ReactDOM);
