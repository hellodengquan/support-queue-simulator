const STORAGE_KEY = 'support_queue_simulator_scenarios';

export const COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7c7c',
  '#4ecdc4',
  '#a8e6cf',
  '#ff8b94',
  '#a55eea',
];

export const saveScenario = (scenario) => {
  const scenarios = getScenarios();
  const newScenario = {
    ...scenario,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    color: COLORS[scenarios.length % COLORS.length],
  };
  scenarios.push(newScenario);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
  return newScenario;
};

export const getScenarios = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const deleteScenario = (id) => {
  const scenarios = getScenarios().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
  return scenarios;
};

export const formatScenarioName = (params) => {
  return `${params.agentCount}坐席_${params.arrivalRate}单/h`;
};

export const calculateDiff = (current, baseline) => {
  if (!current || !baseline) return null;
  return {
    avgWaitTime: current.avgWaitTime - baseline.avgWaitTime,
    maxWaitTime: current.maxWaitTime - baseline.maxWaitTime,
    maxQueueLength: current.maxQueueLength - baseline.maxQueueLength,
    avgUtilization: current.avgUtilization - baseline.avgUtilization,
  };
};

export const formatDiff = (value, unit = '', isPercent = false) => {
  const sign = value > 0 ? '+' : '';
  if (isPercent) {
    return `${sign}${value.toFixed(1)}%`;
  }
  if (Math.abs(value) < 60) {
    return `${sign}${value.toFixed(1)}${unit}`;
  } else if (Math.abs(value) < 3600) {
    return `${sign}${(value / 60).toFixed(1)}分`;
  } else {
    return `${sign}${(value / 3600).toFixed(2)}时`;
  }
};

export const sortScenarios = (scenarios, sortBy) => {
  const sorted = [...scenarios];
  switch (sortBy) {
    case 'waitTime_asc':
      sorted.sort((a, b) => a.stats.avgWaitTime - b.stats.avgWaitTime);
      break;
    case 'waitTime_desc':
      sorted.sort((a, b) => b.stats.avgWaitTime - a.stats.avgWaitTime);
      break;
    case 'utilization_desc':
      sorted.sort((a, b) => b.stats.avgUtilization - a.stats.avgUtilization);
      break;
    case 'utilization_asc':
      sorted.sort((a, b) => a.stats.avgUtilization - b.stats.avgUtilization);
      break;
    case 'recommended':
      sorted.sort((a, b) => calculateScore(b) - calculateScore(a));
      break;
    case 'created_desc':
    default:
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  return sorted;
};

export const calculateScore = (scenario) => {
  const { avgWaitTime, avgUtilization, maxQueueLength } = scenario.stats;
  const waitScore = Math.max(0, 100 - avgWaitTime / 10);
  const utilScore = Math.max(0, Math.min(100, (avgUtilization - 50) * 2));
  const queueScore = Math.max(0, 100 - maxQueueLength * 10);
  return waitScore * 0.4 + utilScore * 0.4 + queueScore * 0.2;
};

export const findRecommendedScenario = (scenarios) => {
  if (scenarios.length === 0) return null;
  return scenarios.reduce((best, current) =>
    calculateScore(current) > calculateScore(best) ? current : best
  );
};

export const findMaxDiffHours = (currentData, compareScenario) => {
  if (!currentData || !compareScenario?.waitTimeData || currentData.length === 0) {
    return [];
  }

  const compareMap = new Map(
    compareScenario.waitTimeData.map((d) => [d.time, d.waitTime])
  );

  let maxDiff = 0;
  const diffs = currentData.map((d) => {
    const compareVal = compareMap.get(d.time) || 0;
    const diff = Math.abs(d.waitTime - compareVal);
    maxDiff = Math.max(maxDiff, diff);
    return { time: d.time, diff };
  });

  const threshold = maxDiff * 0.7;
  return diffs
    .filter((d) => d.diff >= threshold && d.diff > 0)
    .map((d) => d.time);
};
