import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import { findMaxDiffHours } from '../utils/scenarioManager';

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

const ChartPanel = ({ currentData, currentName, compareScenarios }) => {
  const hasData = (currentData && currentData.length > 0) || compareScenarios.length > 0;

  const highlightHours = useMemo(() => {
    if (compareScenarios.length > 0 && currentData) {
      return findMaxDiffHours(currentData, compareScenarios[0]);
    }
    return [];
  }, [currentData, compareScenarios]);

  if (!hasData) {
    return (
      <div className="chart-panel">
        <h2>等待时长曲线</h2>
        <p className="empty-state">暂无数据</p>
      </div>
    );
  }

  const mergedData = mergeWaitTimeData(currentData, currentName, compareScenarios);
  const lineConfigs = buildLineConfigs(currentName, compareScenarios, 'waitTime');

  return (
    <div className="chart-panel" id="chart-wait-time">
      <div className="chart-header">
        <h2>等待时长曲线</h2>
        {highlightHours.length > 0 && (
          <div className="chart-hint">
            🔴 红色标注: 差异最大时段 (第 {highlightHours.join(', ')} 小时)
          </div>
        )}
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mergedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              label={{ value: '时间 (小时)', position: 'insideBottom', offset: -5 }}
            />
            <YAxis tickFormatter={formatYAxis} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {highlightHours.map((hour, idx) => {
              const x1 = hour - 0.4;
              const x2 = hour + 0.4;
              return (
                <ReferenceArea
                  key={`hl-${idx}`}
                  x1={x1}
                  x2={x2}
                  strokeOpacity={0.3}
                  fill="#ff7c7c"
                  fillOpacity={0.15}
                />
              );
            })}
            {lineConfigs.map((config) => (
              <Line
                key={config.dataKey}
                type="monotone"
                dataKey={config.dataKey}
                stroke={config.color}
                name={config.name}
                strokeWidth={config.isCurrent ? 3 : 2}
                strokeDasharray={config.isCurrent ? '' : '5 5'}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (highlightHours.includes(payload.time)) {
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill={config.color}
                        stroke="#ff7c7c"
                        strokeWidth={2}
                      />
                    );
                  }
                  return null;
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const mergeWaitTimeData = (currentData, currentName, compareScenarios) => {
  const timeMap = new Map();

  if (currentData && currentData.length > 0) {
    currentData.forEach((d) => {
      timeMap.set(d.time, { time: d.time, [`current_${currentName}`]: d.waitTime });
    });
  }

  compareScenarios.forEach((scenario) => {
    if (scenario.waitTimeData) {
      scenario.waitTimeData.forEach((d) => {
        const existing = timeMap.get(d.time) || { time: d.time };
        existing[`scenario_${scenario.id}`] = d.waitTime;
        timeMap.set(d.time, existing);
      });
    }
  });

  return Array.from(timeMap.values()).sort((a, b) => a.time - b.time);
};

const buildLineConfigs = (currentName, compareScenarios, dataType) => {
  const configs = [];

  if (currentName) {
    configs.push({
      dataKey: `current_${currentName}`,
      name: `当前: ${currentName}`,
      color: '#667eea',
      isCurrent: true,
    });
  }

  compareScenarios.forEach((scenario) => {
    configs.push({
      dataKey: `scenario_${scenario.id}`,
      name: scenario.name,
      color: scenario.color,
      isCurrent: false,
    });
  });

  return configs;
};

export default ChartPanel;
