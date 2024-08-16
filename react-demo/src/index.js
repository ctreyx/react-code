import React from 'react';
import ReactDOM from 'react-dom';

const jsx = (<div>
    <span>jsx</span>
</div>)

const root = document.querySelector('#root');

ReactDOM.createRoot(root).render(jsx);

console.log(React);

console.log(jsx);

console.log(ReactDOM);
