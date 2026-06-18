import { useState, useCallback, useEffect } from 'react';
import ControlPanel from './components/ControlPanel';
import StatsPanel from './components/StatsPanel';
import ChartPanel from './components/ChartPanel';
import QueueChartPanel from './components/QueueChartPanel';
import ScenarioList from './components/ScenarioList';
import { runSimulation } from './utils/simulator';
import {
  getScenarios,
  saveScenario,
  deleteScenario,
  formatScenarioName,
} from './utils/scenarioManager';
import './App.css';

const defaultParams = {
  arrivalRate: 60,
  avgHandleTime: 300,
  agentCount: 10,
  simulationDuration: 8,
};

function App() {
  const [params, setParams] = useState(defaultParams);
  const [stats, setStats] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenarioIds, setSelectedScenarioIds] = useState([]);

  useEffect(() => {
    setScenarios(getScenarios());
  }, []);

  const handleRunSimulation = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      const result = runSimulation(params);
      setStats(result);
      setIsRunning(false);
    }, 100);
  }, [params]);

  const handleSaveScenario = useCallback(() => {
    if (!stats) return;
    const scenario = saveScenario({
      name: formatScenarioName(params),
      params: { ...params },
      stats: {
        totalTickets: stats.totalTickets,
        completedTickets: stats.completedTickets,
        avgWaitTime: stats.avgWaitTime,
        maxWaitTime: stats.maxWaitTime,
        maxQueueLength: stats.maxQueueLength,
        avgUtilization: stats.avgUtilization,
      },
      waitTimeData: stats.waitTimeData,
      queueLengthData: stats.queueLengthData,
      agentUtilData: stats.agentUtilData,
    });
    setScenarios([...scenarios, scenario]);
  }, [stats, params, scenarios]);

  const handleDeleteScenario = useCallback(
    (id) => {
      const updated = deleteScenario(id);
      setScenarios(updated);
      setSelectedScenarioIds((prev) => prev.filter((sid) => sid !== id));
    },
    []
  );

  const handleToggleSelect = useCallback((id) => {
    setSelectedScenarioIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  }, []);

  const handleLoadScenario = useCallback((scenario) => {
    setParams({ ...scenario.params });
  }, []);

  const selectedScenarios = scenarios.filter((s) =>
    selectedScenarioIds.includes(s.id)
  );

  const currentName = stats ? formatScenarioName(params) : null;

  return (
    <div className="app">
      <header className="app-header">
        <h1>客服排班模拟器</h1>
        <p className="subtitle">模拟工单到达，计算容量，优化排班决策</p>
      </header>

      <main className="app-main">
        <div className="left-panel">
          <ControlPanel
            params={params}
            onParamsChange={setParams}
            onRunSimulation={handleRunSimulation}
            isRunning={isRunning}
          />
          <ScenarioList
            scenarios={scenarios}
            selectedIds={selectedScenarioIds}
            onToggleSelect={handleToggleSelect}
            onDelete={handleDeleteScenario}
            onLoad={handleLoadScenario}
            onSave={handleSaveScenario}
            canSave={!!stats}
          />
        </div>

        <div className="right-panel">
          <StatsPanel stats={stats} compareScenarios={selectedScenarios} />
          <ChartPanel
            currentData={stats?.waitTimeData}
            currentName={currentName}
            compareScenarios={selectedScenarios}
          />
          <QueueChartPanel
            currentQueueData={stats?.queueLengthData}
            currentUtilData={stats?.agentUtilData}
            currentName={currentName}
            compareScenarios={selectedScenarios}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
