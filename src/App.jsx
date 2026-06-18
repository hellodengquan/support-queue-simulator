import { useState, useCallback, useEffect, useRef } from 'react';
import ControlPanel from './components/ControlPanel';
import StatsPanel from './components/StatsPanel';
import ChartPanel from './components/ChartPanel';
import QueueChartPanel from './components/QueueChartPanel';
import ScenarioList from './components/ScenarioList';
import ExportPanel from './components/ExportPanel';
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
  const rightPanelRef = useRef(null);

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
  const exportTitle = currentName || '模拟结果';

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-top">
          <div className="header-title">
            <h1>客服排班模拟器</h1>
            <p className="subtitle">模拟工单到达，计算容量，优化排班决策</p>
          </div>
          <div className="header-actions">
            <ExportPanel
              targetId=".right-panel"
              title={exportTitle}
            />
          </div>
        </div>
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

        <div className="right-panel" ref={rightPanelRef}>
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
