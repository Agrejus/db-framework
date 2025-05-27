import { useRef, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { CustomContext } from './CustomContext';
// import PouchDB from 'pouchdb';

function App() {
  const [count, setCount] = useState(0);
  const contextRef = useRef(new CustomContext());

  const onClick = async () => {
    const db = new PouchDB();

    console.log(db);

    await contextRef.current.products.addAsync({
      child: {
        name: "Child Name",
        nested: {
          more: {
            array: ["test"],
            final: 1
          },
          winner: 100
        }
      },
      name: "James",
      more: {
        one: "one",
        two: "two"
      },
      order: 100
    });

    const response = await contextRef.current.saveChangesAsync();

    setCount(w => w + response)
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={onClick}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
