import React from 'react';
import ReactDOM from 'react-dom';

const jsx = (<div>
    <span>jsx</span>
</div>)

function Child() {
    return (<div>
        function child
    </div>)
}

function App() {
    return <div>
        <Child />
    </div>
}

const root = document.querySelector('#root');

ReactDOM.createRoot(root).render(<App />);

console.log(React);

console.log(jsx);

console.log(ReactDOM);
