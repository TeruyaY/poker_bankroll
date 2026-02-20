import { useState, useEffect } from 'react'
import api from './api'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  // ①【記憶の層】 (State)
  // 「今、画面に表示すべきデータは何？」を覚えている場所
  const [players, setPlayers] = useState([]);


  // ②【行動の層】 (Logic / Functions)
  // 「ボタンが押されたら何をする？」「サーバーからどうやってデータを取る？」を決める場所
  useEffect(() => {
    const loadData = async () => {
        const response = await api.get('/players');
        setPlayers(response.data);
    };

    loadData();
  }, []);

  // ③【見た目の層】 (Return / JSX)
  // 「最終的にどんなHTMLを表示する？」を記述する場所
  return (
    <div>
      <h1>プレイヤー一覧</h1>
      <ul>
        {/* playersの中身を一つずつ取り出して <li> に変換する */}
        {players.map(player => (
            <li key={player.id}>
            {/* テンプレートリテラルを使うと綺麗に書けます */}
            <strong>{player.player_name}</strong> ： {player.email}
            </li>
        ))}
      </ul>
    </div>
  );
}

export default App
