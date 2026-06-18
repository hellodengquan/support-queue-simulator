import { formatTime } from '../utils/simulator';
import { formatDiff } from '../utils/scenarioManager';

const StatsPanel = ({ stats, compareScenarios = [] }) => {
  if (!stats && compareScenarios.length === 0) {
    return (
      <div className="stats-panel">
        <h2>运行结果</h2>
        <p className="empty-state">请设置参数并开始模拟</p>
      </div>
    );
  }

  const renderStatCards = (s, prefix = '', isCompare = false, baseline = null) => {
    if (!s) return null;

    const diff = baseline
      ? {
          avgWaitTime: s.avgWaitTime - baseline.avgWaitTime,
          maxWaitTime: s.maxWaitTime - baseline.maxWaitTime,
          maxQueueLength: s.maxQueueLength - baseline.maxQueueLength,
          avgUtilization: s.avgUtilization - baseline.avgUtilization,
        }
      : null;

    const items = [
      { label: '总工单数', value: s.totalTickets, unit: '单', diff: null },
      { label: '已完成工单', value: s.completedTickets, unit: '单', diff: null },
      {
        label: '平均等待时长',
        value: formatTime(s.avgWaitTime),
        unit: '',
        diff: diff ? formatDiff(diff.avgWaitTime) : null,
      },
      {
        label: '最大等待时长',
        value: formatTime(s.maxWaitTime),
        unit: '',
        diff: diff ? formatDiff(diff.maxWaitTime) : null,
      },
      {
        label: '最大队列长度',
        value: s.maxQueueLength,
        unit: '单',
        diff: diff ? `${diff.maxQueueLength > 0 ? '+' : ''}${diff.maxQueueLength}` : null,
      },
      {
        label: '坐席平均利用率',
        value: `${s.avgUtilization.toFixed(1)}%`,
        unit: '',
        diff: diff ? formatDiff(diff.avgUtilization, '%', true) : null,
      },
    ];

    return (
      <div key={prefix} className={`stats-section ${isCompare ? 'compare' : ''}`}>
        {prefix && <h3 className="stats-title">{prefix}</h3>}
        <div className="stats-grid">
          {items.map((item, index) => (
            <div key={index} className="stat-card">
              <div className="stat-label">{item.label}</div>
              <div className="stat-value">
                {item.value}
                <span className="stat-unit">{item.unit}</span>
              </div>
              {item.diff !== null && (
                <div
                  className={`stat-diff ${
                    item.diff.startsWith('+') ? 'diff-bad' : 'diff-good'
                  }`}
                >
                  {item.diff}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="stats-panel">
      <h2>运行结果</h2>
      {renderStatCards(stats, stats ? '当前场景' : '', false)}
      {compareScenarios.map((scenario) =>
        renderStatCards(
          scenario.stats,
          `对比: ${scenario.name}`,
          true,
          stats
        )
      )}
    </div>
  );
};

export default StatsPanel;
