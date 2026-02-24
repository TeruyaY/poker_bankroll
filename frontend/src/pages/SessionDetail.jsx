import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../api';


function SessionDetail() {
  // URLの「:sessionId」の部分を抜き出す
  const { sessionId } = useParams();

  const [intervals, setIntervals] = useState([]);
    
  const [timestamp, setTimestamp] = useState('');
  const [stack, setStack] = useState('');
  const [add_on_amount, setAdd_on_amount] = useState('');

  const loadIntervals = async () => {
    try {
      const response = await api.get('/intervals');
      setIntervals(response.data);
    }  catch(error) {
      console.error("取得失敗:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post(`/session/${sessionId}/interval`, {
        timestamp: timestamp,
        stack: stack,
        add_on_amount: add_on_amount
      });

      // 最新インターバル一覧の取得
      const response = await api.get(`/intervals`);
      const latestIntervals = response.data;

      // 計算
      let totalBuyIn = 0;
      for (const item of latestIntervals) {
        totalBuyIn += Number(item.add_on_amount);
      }
      const lastStack = latestIntervals[latestIntervals.length - 1].stack;
      
      const calculateDuration = (data) => {
        if (data.length < 2) return 0;

        const start = new Date(data[0].timestamp);
        const end = new Date(data[data.length - 1].timestamp);

        const diffHours = (end - start) / (1000 * 60 * 60);
        
        return Math.round(diffHours * 100) / 100;
      };

      const duration_hours = calculateDuration(latestIntervals);

      console.log("計算対象のデータ:", latestIntervals);
      console.log("計算されたバイイン:", totalBuyIn);

      // 親アップデート
      await api.put(`/session/${sessionId}`, {
        buy_in: totalBuyIn,
        cash_out: lastStack,
        duration_hours: duration_hours
      })

      setTimestamp('');
      setStack('');
      setAdd_on_amount('');

      setIntervals(latestIntervals);

      alert("登録に成功しました！");
    } catch (error) {
      console.error("登録失敗:", error);
      alert("登録に失敗しました。");
    }
        
  };

  useEffect(() => {
      loadIntervals();
  }, []);


  return (
    <div style={{ padding: '20px'}}>
      <h1>セッションID: {sessionId} のページ</h1>

      <div style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc' }}>
        <h2>インターバル登録</h2>
        <form onSubmit={handleSubmit}>
          <label>時間</label>
          <input
            type="datetime-local"
            placeholder="時間"
            value={timestamp}
            onChange={(e) =>setTimestamp(e.target.value)}
          />
          <label>スタック</label>
          <input
            type="number"
            placeholder="スタック"
            value={stack}
            onChange={(e) =>setStack(Number(e.target.value))}
          />
          <label>アドオン額</label>
          <input
            type="number"
            placeholder="0"
            value={add_on_amount}
            onChange={(e) =>setAdd_on_amount(Number(e.target.value))}
          />
          <button type="submit">登録</button>
        </form>
      </div>


      <h2>インターバル一覧</h2>
      <ul>
        {intervals.map(interval => (
            <li key={interval.id}>{interval.timestamp} {interval.stack} {interval.add_on_amount}</li>
        ))}
      </ul>
    </div>
  )
}

export default SessionDetail