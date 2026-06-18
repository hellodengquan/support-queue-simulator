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

const QueueChartPanel = ({
  currentQueueData,
  currentUtilData,
  currentName,
  compareScenarios,
  isPrintMode = false,
}) => {
  const hasData =
    (currentQueueData && currentQueueData.length > 0) || compareScenarios.length > 0;

  if (!hasData) {
    return (
      <div className="chart-panel">
        <h2>队列与坐席状态</h2>
        <p className="empty-state">暂无数据</p>
      </div>
    );
  }

  const mergedData = mergeQueueData(
    currentQueueData,
    currentUtilData,
    currentName,
    compareScenarios
  );
  const lineConfigs = buildQueueLineConfigs(currentName, compareScenarios);

  const chartHeight = isPrintMode ? 380 : 300;
  const tickFontSize = isPrintMode ? 14 : 12;
  const labelFontSize = isPrintMode ? 14 : 12;
  const strokeWidthBase = isPrintMode ? 1.5 : 0;
  const legendFontSize = isPrintMode ? 13 : 12;

  return (
    <div className="chart-panel" id="chart-queue">
      <h2>队列与坐席状态</h2>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={mergedData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isPrintMode ? '#d0d0d0' : '#e0e0e0'} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: tickFontSize }}
              label={{
                value: '时间 (小时)',
                position: 'insideBottom',
                offset: -5,
                style: { fontSize: labelFontSize },
              }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: tickFontSize }}
              label={{
                value: '队列长度',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: labelFontSize },
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: tickFontSize }}
              label={{
                value: '利用率 (%)',
                angle: 90,
                position: 'insideRight',
                style: { fontSize: labelFontSize },
              }}
            />
            <Tooltip />
            <Legend
              wrapperStyle={{
                fontSize: legendFontSize,
                paddingTop: '10px',
              }}
            />
            {lineConfigs.map((config) => (
              <Line
                key={config.dataKey}
                yAxisId={config.axis}
                type="monotone"
                dataKey={config.dataKey}
                stroke={config.color}
                name={config.name}
                strokeWidth={(config.isCurrent ? 3 : 2) + strokeWidthBase}
                strokeDasharray={config.isCurrent ? '' : '5 5'}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const mergeQueueData = (currentQueueData, currentUtilData, currentName, compareScenarios) => {
  const timeMap = new Map();

  if (currentQueueData && currentQueueData.length > 0) {
    currentQueueData.forEach((d, index) => {
      timeMap.set(d.time, {
        time: d.time,
        [`current_queue_${currentName}`]: d.queueLength,
        [`current_util_${currentName}`]: currentUtilData?.[index]?.utilization || 0,
      });
    });
  }

  compareScenarios.forEach((scenario) => {
    if (scenario.queueLengthData) {
      scenario.queueLengthData.forEach((d, index) => {
        const existing = timeMap.get(d.time) || { time: d.time };
        existing[`scenario_queue_${scenario.id}`] = d.queueLength;
        existing[`scenario_util_${scenario.id}`] =
          scenario.agentUtilData?.[index]?.utilization || 0;
        timeMap.set(d.time, existing);
      });
    }
  });

  return Array.from(timeMap.values()).sort((a, b) => a.time - b.time);
};

const buildQueueLineConfigs = (currentName, compareScenarios) => {
  const configs = [];

  if (currentName) {
    configs.push({
      dataKey: `current_queue_${currentName}`,
      name: `当前队列: ${currentName}`,
      color: '#667eea',
      axis: 'left',
      isCurrent: true,
    });
    configs.push({
      dataKey: `current_util_${currentName}`,
      name: `当前利用率: ${currentName}`,
      color: '#ffc658',
      axis: 'right',
      isCurrent: true,
    });
  }

  compareScenarios.forEach((scenario) => {
    configs.push({
      dataKey: `scenario_queue_${scenario.id}`,
      name: `${scenario.name} 队列`,
      color: scenario.color,
      axis: 'left',
      isCurrent: false,
    });
    configs.push({
      dataKey: `scenario_util_${scenario.id}`,
      name: `${scenario.name} 利用率`,
      color: mixColor(scenario.color, '#ffc658'),
      axis: 'right',
      isCurrent: false,
    });
  });

  return configs;
};

const mixColor = (c1, c2) => {
  const hex = (c) => parseInt(c.slice(1), 16);
  const r1 = (hex(c1) >> 16) & 255;
  const g1 = (hex(c1) >> 8) & 255;
  const b1 = hex(c1) & 255;
  const r2 = (hex(c2) >> 16) & 255;
  const g2 = (hex(c2) >> 8) & 255;
  const b2 = hex(c2) & 255;
  const r = Math.round((r1 + r2) / 2);
  const g = Math.round((g1 + g2) / 2);
  const b = Math.round((b1 + b2) / 2);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

export default QueueChartPanel;
