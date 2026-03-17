import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../api';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Grid, 
  Card, 
  Stack, 
  Typography, 
  Box, 
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button
} from '@mui/material';
import { IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';




function SessionDetail() {
  // URLの「:sessionId」の部分を抜き出す
  const { sessionId } = useParams();

  const [intervals, setIntervals] = useState([]);
    
  const [timestamp, setTimestamp] = useState('');
  const [stack, setStack] = useState('');
  const [add_on_amount, setAdd_on_amount] = useState('');

  const loadIntervals = async () => {
    try {
      const response = await api.get(`/session/${sessionId}/intervals`);
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
      const response = await api.get(`/session/${sessionId}/intervals`);
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

  const prepareChartData = () => {
    let cumulativeProfit = 0;
    let cumulativeHours = 0;

    if (intervals.length == 0) {
      return [{hours: 0, profit: 0}];
    } else {
      const chartData = [];
      let previousTime = new Date(intervals[0].timestamp);

      let cumulativeBuyIn = 0;
      let cumulativeHours = 0;

      for (const i of [...intervals]) {
        const currentTime = new Date(i.timestamp);
        const diffHours = (currentTime - previousTime) / (1000 * 60 * 60);

        cumulativeBuyIn += (i.add_on_amount || 0);
        cumulativeHours += diffHours;

        previousTime = currentTime;

        chartData.push({
          hours: Number(cumulativeHours.toFixed(1)),
          profit: i.stack - cumulativeBuyIn,
        })
      }

      return chartData;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("このデータを削除してもよろしいですか？")) return;

    try {
      await api.delete(`/interval/${id}`);
      loadIntervals();
    } catch (error) {
      console.error("削除に失敗しました", error);
    }

  };

  const calculateXAxis = (data) => {
    const rawValues = [...data.map(d => d.hours), 
      ...data.map(d => d.hands)];
    const values = rawValues.filter( v=> typeof v === 'number' && !isNaN(v));
    return calculateAxis(values);
  };

  const calculateYAxis = (data) => {
    const rawValues = [...data.map(d => d.profit), 
      ...data.map(d => d.nError70), 
      ...data.map(d => d.pError70),
      ...data.map(d => d.nError95),
      ...data.map(d => d.pError95),];
    const values = rawValues.filter( v=> typeof v === 'number' && !isNaN(v));
    return calculateAxis(values);
  };

  const calculateAxis = (values) => {
    if (!values || values.length === 0) return [[0,100], [0, 50, 100]];

    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    const range = dataMax - dataMin;

    const roughStep = range / 10;

    const exponent = Math.floor(Math.log10(roughStep));
    const magnitude = Math.pow(10, exponent);

    const normalizedStep = roughStep / magnitude;
    let step = 0;
    if (normalizedStep < 1.5) step = 1 * magnitude;
    else if (normalizedStep < 3.5) step = 2 * magnitude;
    else if (normalizedStep < 7.5) step = 5 * magnitude;
    else step = 10 * magnitude;

    const bottom = Math.floor(dataMin / step) * step;
    const top = Math.ceil(dataMax / step) * step;

    const ticks = [];
    for (let val = bottom; val <=top; val += step) {
      ticks.push(val);
    }

    return [[bottom, top], ticks];
  };

  const chartData = prepareChartData();
  const [xDomain, xTicks] = calculateXAxis(chartData);
  const [yDomain, yTicks] = calculateYAxis(chartData);

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 5, md: 7 }, pb: 4 }}>
      <Grid container spacing={3} disableEqualOverflow>

        <Grid size={{ xs:12, md:12 }}>
          <Typography variant="h3" sx={{m:3}}>セッションID: {sessionId} のページ</Typography>
        </Grid>

        <Grid size={{ xs:12, md:8 }}>
          {/* 2. グラフの表示エリア */}
          <Card sx={{p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column'}}>
            <Stack spacing={4} sx={{ height: '100%'}}>
              <Typography variant="h4">セッション収支グラフ</Typography>
              <Box sx={{ width: '100%', aspectRatio: { xs: '1 / 1', md: '16 / 9' },  minHeight: 0,}}>
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="hours" type="number" domain={xDomain} ticks={xTicks}/>
                      <YAxis domain={yDomain} ticks={yTicks} tickFormatter={(val) => val.toLocaleString()}/>
                      <Tooltip />
                      <Line type="linear" dataKey="profit" stroke="#8884d8" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs:12, md:4 }}>
          <Card sx={{height:400, p: { xs: 2, md: 3 }}}>
            <Stack spacing={2} sx={{ height: '100%'}} component="form" onSubmit={handleSubmit} justifyContent="space-between">
              <Typography variant="h4">インターバル登録</Typography>
              <TextField
                type="datetime-local"
                label="時間"
                value={timestamp}
                onChange={(e) =>setTimestamp(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <TextField
                type="number"
                label="スタック"
                placeholder="0"
                value={stack}
                onChange={(e) =>setStack(Number(e.target.value))}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <TextField
                type="number"
                label="アドオン額"
                placeholder="0"
                value={add_on_amount}
                onChange={(e) =>setAdd_on_amount(Number(e.target.value))}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <Button type="submit">登録</Button>
            </Stack>
          </Card>  
        </Grid>

        <Grid size={{ xs: 12, md: 12 }}>
          <Card sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h4" sx={{ mb: 2 }}>インターバル一覧</Typography>

            {/* --- 【1】スマホ用：カード形式リスト (md 未満で表示) --- */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              {intervals.length > 0 ? (
                intervals.map((interval) => {
                  const timeString = new Date(interval.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <Card 
                      key={interval.id} 
                      variant="outlined" 
                      sx={{ mb: 1.5, p: 2, borderRadius: 2 }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        {/* 左側：時間とラベル */}
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            時間
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {timeString}
                          </Typography>
                        </Box>

                        {/* 中央：スタック量 */}
                        <Box textAlign="right" sx={{ flexGrow: 1, mr: 3 }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            スタック
                          </Typography>
                          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                            {interval.stack.toLocaleString()}
                          </Typography>
                        </Box>

                        {/* 右側：削除ボタン */}
                        <IconButton 
                          color="error" 
                          onClick={() => handleDelete(interval.id)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>

                      {/* アドオンがある場合のみ下に表示 */}
                      {interval.add_on_amount > 0 && (
                        <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed #eee', display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">アドオン追加</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {interval.add_on_amount.toLocaleString()}
                          </Typography>
                        </Box>
                      )}
                    </Card>
                  );
                })
              ) : (
                <Typography sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                  データがありません
                </Typography>
              )}
            </Box>

            {/* --- 【2】PC用：従来のテーブル形式 (md 以上で表示) --- */}
            <TableContainer 
              component={Paper} 
              sx={{ 
                display: { xs: 'none', md: 'block' }, 
                mt: 3, 
                boxShadow: 2, 
                borderRadius: 2 
              }}
            >
              <Table sx={{ minWidth: 300 }} aria-label="interval table">
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>時間</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>スタック</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>アドオン</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {intervals.map((interval) => {
                    const timeString = new Date(interval.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <TableRow key={interval.id} sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                        <TableCell>{timeString}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                          {interval.stack.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          {interval.add_on_amount > 0 ? `${interval.add_on_amount.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton color="error" onClick={() => handleDelete(interval.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

      </Grid>
    </Container>
      
  )
}

export default SessionDetail