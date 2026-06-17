import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const QueueChartPanel = ({ queueData, utilData }) => {
  if (!queueData || queueData.length === 0) {
    return (
      <div className="chart-panel">
        <h2>队列与坐席状态</h2>
        <p className="empty-state">暂无数据</p>
      </div>
    );
  }

  const combinedData = queueData.map((item, index) => ({
    ...item,
    utilization: utilData[index]?.utilization || 0,
  }));

  return (
    <div className="chart-panel">
      <h2>队列与坐席状态</h2>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={combinedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              label={{ value: '时间 (小时)', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              yAxisId="left"
              label={{ value: '队列长度', angle: -90, position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{ value: '利用率 (%)', angle: 90, position: 'insideRight' }}
            />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="queueLength"
              stroke="#82ca9d"
              name="队列长度"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="utilization"
              stroke="#ffc658"
              name="坐席利用率"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default QueueChartPanel;
