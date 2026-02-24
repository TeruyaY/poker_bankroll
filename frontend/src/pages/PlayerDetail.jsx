import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../api';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


function PlayerDetail() {
  // URLの「:playerId」の部分を抜き出す
  const { playerId } = useParams();

  const [sessions, setSessions] = useState([]);
    
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [game_type, setGame_type] = useState('');
  const [memo, setMemo] = useState('');

  const loadSessions = async () => {
    try {
      const response = await api.get('/sessions');
      setSessions(response.data);
    }  catch(error) {
      console.error("取得失敗:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post(`/player/${playerId}/session`, {
        date: date,
        location: location,
        game_type: game_type,
        memo: memo
      });

      setDate('');
      setLocation('');
      setGame_type('');
      setMemo('');

      loadSessions();
      alert("登録に成功しました！");
    } catch (error) {
      console.error("登録失敗:", error);
      alert("登録に失敗しました。");
    }
        
  };

  useEffect(() => {
      loadSessions();
  }, []);

  const prepareChartData = () => {
    let cumulativeProfit = 0;
    let cumulativeHours = 0;

    const chartData = [{hours: 0, profit: 0}];

    for (const s of [...sessions]) {
      cumulativeProfit += (s.cash_out - s.buy_in);
      cumulativeHours += s.duration_hours;

      chartData.push({
        hours: cumulativeHours,
        profit: cumulativeProfit,
        dateL: s.date
      })
    }

    return chartData;
  };

  const chartData = prepareChartData();


  return (
    <div style={{ padding: '20px'}}>
      <h1>プレイヤーID: {playerId} のページ</h1>

      <h2>プレイヤー収支グラフ</h2>

      {/* 2. グラフの表示エリア */}
      <div style={{ width: '100%', height: 300, backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '8px' }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hours" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="profit" stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc' }}>
        <h2>セッション登録</h2>
        <form onSubmit={handleSubmit}>
          <label>日付</label>
          <input
            type="date"
            placeholder="日付"
            value={date}
            onChange={(e) =>setDate(e.target.value)}
          />
          <label>場所</label>
          <input
            type="text"
            placeholder="場所"
            value={location}
            onChange={(e) =>setLocation(e.target.value)}
          />
          <label>ゲームの種類</label>
          <input
            type="text"
            placeholder="NLH1-3"
            value={game_type}
            onChange={(e) =>setGame_type(e.target.value)}
          />
          <label>メモ</label>
          <input
            type="text"
            placeholder="メモ"
            value={memo}
            onChange={(e) =>setMemo(e.target.value)}
          />
          <button type="submit">登録</button>
        </form>
      </div>


      <h2>セッション一覧</h2>
      <ul>
        {sessions.map(session => (
            <li key={session.id}>{session.date} {session.location} {session.game_type} {session.buy_in} {session.cash_out}</li>
        ))}
      </ul>
    </div>
  )
}

export default PlayerDetail