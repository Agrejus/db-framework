import { useRef, useState } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";
import { CustomContext } from './CustomContext';

function App() {
	const [count, setCount] = useState(0);
	const contextRef = useRef(new CustomContext());

	const onClick = async () => {

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
		<div className="App">
			<div>
				<a href="https://reactjs.org" target="_blank" rel="noreferrer">
					<img src={reactLogo} className="logo react" alt="React logo" />
				</a>
			</div>
			<h1>Rspack + React + TypeScript</h1>
			<div className="card">
				<button type="button" onClick={onClick}>
					count is {count}
				</button>
				<p>
					Edit <code>src/App.tsx</code> and save to test HMR
				</p>
			</div>
			<p className="read-the-docs">
				Click on the Rspack and React logos to learn more
			</p>
		</div>
	);
}

export default App;
