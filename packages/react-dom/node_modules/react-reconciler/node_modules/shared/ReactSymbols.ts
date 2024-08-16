//判断是否支持Symbol
const supportSysbol = typeof Symbol === 'function' && Symbol.for;

export const REACT_ELEMENT_TYPE = supportSysbol
	? Symbol.for('react.element')
	: 0xeac7;
