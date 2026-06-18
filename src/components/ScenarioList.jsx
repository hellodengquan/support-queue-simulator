import { useState, useMemo } from 'react';
import { formatTime } from '../utils/simulator';
import {
  sortScenarios,
  findRecommendedScenario,
  calculateScore,
} from '../utils/scenarioManager';

const ScenarioList = ({
  scenarios,
  selectedIds,
  onToggleSelect,
  onDelete,
  onLoad,
  onSave,
  canSave,
}) => {
  const [sortBy, setSortBy] = useState('recommended');

  const recommendedId = useMemo(() => {
    const rec = findRecommendedScenario(scenarios);
    return rec ? rec.id : null;
  }, [scenarios]);

  const sortedScenarios = useMemo(() => {
    return sortScenarios(scenarios, sortBy);
  }, [scenarios, sortBy]);

  const sortOptions = [
    { value: 'recommended', label: '推荐排序' },
    { value: 'waitTime_asc', label: '等待时长↑' },
    { value: 'waitTime_desc', label: '等待时长↓' },
    { value: 'utilization_desc', label: '利用率↓' },
    { value: 'utilization_asc', label: '利用率↑' },
    { value: 'created_desc', label: '最新创建' },
  ];

  return (
    <div className="scenario-panel">
      <div className="scenario-header">
        <h2>场景对比</h2>
        <button
          className="btn-save"
          onClick={onSave}
          disabled={!canSave}
        >
          保存当前场景
        </button>
      </div>

      {scenarios.length > 0 && (
        <div className="sort-bar">
          <span className="sort-label">排序:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {scenarios.length === 0 ? (
        <p className="empty-state">暂无保存的场景，运行模拟后可保存</p>
      ) : (
        <div className="scenario-list">
          {sortedScenarios.map((scenario) => (
            <div
              key={scenario.id}
              className={`scenario-item ${
                selectedIds.includes(scenario.id) ? 'selected' : ''
              } ${scenario.id === recommendedId ? 'recommended' : ''}`}
            >
              {scenario.id === recommendedId && (
                <div className="recommend-badge">
                  ⭐ 推荐
                </div>
              )}
              <div className="scenario-main">
                <label className="scenario-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(scenario.id)}
                    onChange={() => onToggleSelect(scenario.id)}
                  />
                  <span
                    className="color-dot"
                    style={{ backgroundColor: scenario.color }}
                  />
                </label>
                <div className="scenario-info" onClick={() => onToggleSelect(scenario.id)}>
                  <div className="scenario-name">{scenario.name}</div>
                  <div className="scenario-params">
                    {scenario.params.agentCount}坐席 · {scenario.params.arrivalRate}单/h · {scenario.params.avgHandleTime}秒
                  </div>
                  <div className="scenario-stats">
                    <span>等待: {formatTime(scenario.stats.avgWaitTime)}</span>
                    <span>利用率: {scenario.stats.avgUtilization.toFixed(1)}%</span>
                    <span className="score-badge">
                      得分: {calculateScore(scenario).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="scenario-actions">
                <button className="btn-icon" onClick={() => onLoad(scenario)} title="加载参数">
                  ↩
                </button>
                <button className="btn-icon btn-delete" onClick={() => onDelete(scenario.id)} title="删除">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScenarioList;
