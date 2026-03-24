import './App.css'
import { ModeToggle } from './components/mode-toggle'

function App() {
  return (
    <div>
      <div>
        <img src="/src/assets/NextSound Logo.png" alt="" className='w-50'/>
      </div>
      <div>
        <ModeToggle />
      </div>
    </div>
  )
}

export default App
