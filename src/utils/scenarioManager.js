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
