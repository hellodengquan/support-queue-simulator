import { formatTime } from '../utils/simulator';

const StatsPanel = ({ stats }) => {
  if (!stats) {
    return (
      <div className="stats-panel">
        <h2>运行结果</h2>
        <p className="empty-state">请设置参数并开始模拟</p>
      </div>
    );
  }

  const statItems = [
    { label: '总工单数', value: stats.totalTickets, unit: '单' },
    { label: '已完成工单', value: stats.completedTickets, unit: '单' },
    { label: '平均等待时长', value: formatTime(stats.avgWaitTime), unit: '' },
    { label: '最大等待时长', value: formatTime(stats.maxWaitTime), unit: '' },
    { label: '最大队列长度', value: stats.maxQueueLength, unit: '单' },
    { label: '坐席平均利用率', value: `${stats.avgUtilization.toFixed(1)}%`, unit: '' },
  ];

  return (
    <div className="stats-panel">
      <h2>运行结果</h2>
      <div className="stats-grid">
        {statItems.map((item, index) => (
          <div key={index} className="stat-card">
            <div className="stat-label">{item.label}</div>
            <div className="stat-value">
              {item.value}
              <span className="stat-unit">{item.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsPanel;
