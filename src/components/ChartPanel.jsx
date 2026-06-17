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

const ChartPanel = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-panel">
        <h2>等待时长曲线</h2>
        <p className="empty-state">暂无数据</p>
      </div>
    );
  }

  const formatYAxis = (value) => {
    if (value < 60) {
      return `${value.toFixed(0)}秒`;
    } else if (value < 3600) {
      return `${(value / 60).toFixed(0)}分`;
    } else {
      return `${(value / 3600).toFixed(1)}时`;
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">第 {label} 小时</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatYAxis(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-panel">
      <h2>等待时长曲线</h2>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              label={{ value: '时间 (小时)', position: 'insideBottom', offset: -5 }}
            />
            <YAxis tickFormatter={formatYAxis} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="waitTime"
              stroke="#8884d8"
              name="等待时长"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartPanel;
