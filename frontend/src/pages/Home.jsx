import { useState, useEffect } from 'react'
import api from '../api'
import '../App.css'

function Home() {
  // ①【記憶の層】 (State)
  // 「今、画面に表示すべきデータは何？」を覚えている場所
  const [players, setPlayers] = useState([]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');


  // ②【行動の層】 (Logic / Functions)
  // 「ボタンが押されたら何をする？」「サーバーからどうやってデータを取る？」を決める場所
  const loadPlayers = async () => {
        try {
          const response = await api.get('/players');
          setPlayers(response.data);
        }  catch(error) {
          console.error("取得失敗:", error);
        }
        
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        // バックエンドにデータ送る
        await api.post('/player', {
          player_name: name,
          email: email
        });

        //　成功したら入力欄を空にする
        setName('');
        setEmail('');

        //　リストを最新にする
        loadPlayers();
        alert("登録に成功しました！");
    } catch (error) {
      console.error("登録失敗:", error);
      alert("登録に失敗しました。");
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  // ③【見た目の層】 (Return / JSX)
  // 「最終的にどんなHTMLを表示する？」を記述する場所
  return (
    <div style={{ padding: '20px' }}>
      <h1>Poker Manager</h1>

      <div style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc' }}>
        <h2>プレイヤー新規登録</h2>
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="プレイヤー名" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
          <input 
            type="email" 
            placeholder="メールアドレス" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <button type="submit">登録</button>
        </form>
      </div>

      <h2>プレイヤー一覧</h2>
      <ul>
        {players.map(player => (
          <li key={player.id}>{player.player_name} ({player.email})</li>
        ))}
      </ul>
    </div>
  );
}

export default Home
