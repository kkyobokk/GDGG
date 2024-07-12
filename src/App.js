import { useState, useEffect, useRef } from 'react';
import './App.css';
import Expression from './ExpressionTree.js';

function App() {
  const ref = useRef(null);
  const [func, setFunc] = useState([]);
  const [funcCount, setFuncCount] = useState(1);
  const [changed, setChanged] = useState(0);
  const [exp, setExp] = useState('');
  
  useEffect(() => {
    console.log(func);
    console.log(1);
  }, [func]);

  return (
    <div className="App">
      <div className="Functions">
        {Array(funcCount).fill(0).map((e,i) => {
          return <label key ={i}> {String.fromCharCode(102 + i)+"(x)"} <input key={i} className="functionField" 
          onChange={e => {setChanged(i); setFunc(()=>{const k = [...func]; k[i] = {}; k[i][(i+15).toString(36)] = e.target.value; return k;})}}/> </label>
        })}
        <div style={{width : "80%", margin : "0 auto", textAlign : "left"}}>
        <button className="addFunc" onClick={() => setFuncCount(funcCount + !!(funcCount%5 + !(funcCount)))}>+</button>
        </div>
      </div>
      <div className="Exp">
        <label> Exp <input className="expField" onChange={e => setExp(e.target.value)}/></label>
      </div>
      <div className="Result">
        {Expression(exp, func)}
      </div>
    </div>
  );
}

export default App;
