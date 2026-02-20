import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import PlayerDetail from './pages/PlayerDetail'

function App() {
  return (
    <Routes>
      {/* 「/」にアクセスしたら Home コンポーネントを表示 */}
      <Route path="/" element={<Home />} />
      
      {/* 「/players/数字」にアクセスしたら PlayerDetail を表示 */}
      <Route path="/players/:playerId" element={<PlayerDetail />} />
    </Routes>
  )
}

export default App