import { useState } from 'react';

const ControlPanel = ({ params, onParamsChange, onRunSimulation, isRunning }) => {
  const [localParams, setLocalParams] = useState(params);

  const handleChange = (key, value) => {
    const newParams = { ...localParams, [key]: Number(value) };
    setLocalParams(newParams);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onParamsChange(localParams);
    onRunSimulation();
  };

  return (
    <div className="control-panel">
      <h2>参数配置</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="arrivalRate">工单到达率 (单/小时)</label>
          <input
            type="number"
            id="arrivalRate"
            value={localParams.arrivalRate}
            onChange={(e) => handleChange('arrivalRate', e.target.value)}
            min="1"
            step="1"
          />
        </div>

        <div className="form-group">
          <label htmlFor="avgHandleTime">平均处理时长 (秒)</label>
          <input
            type="number"
            id="avgHandleTime"
            value={localParams.avgHandleTime}
            onChange={(e) => handleChange('avgHandleTime', e.target.value)}
            min="1"
            step="1"
          />
        </div>

        <div className="form-group">
          <label htmlFor="agentCount">坐席数量</label>
          <input
            type="number"
            id="agentCount"
            value={localParams.agentCount}
            onChange={(e) => handleChange('agentCount', e.target.value)}
            min="1"
            step="1"
          />
        </div>

        <div className="form-group">
          <label htmlFor="simulationDuration">模拟时长 (小时)</label>
          <input
            type="number"
            id="simulationDuration"
            value={localParams.simulationDuration}
            onChange={(e) => handleChange('simulationDuration', e.target.value)}
            min="1"
            max="168"
            step="1"
          />
        </div>

        <button type="submit" className="btn-primary" disabled={isRunning}>
          {isRunning ? '模拟中...' : '开始模拟'}
        </button>
      </form>
    </div>
  );
};

export default ControlPanel;
