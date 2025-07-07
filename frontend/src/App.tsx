import { useState } from 'react'

import FlowBuilderPage from './pages/FlowBuilderPage'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <FlowBuilderPage/>
    </>
  )
}

export default App
