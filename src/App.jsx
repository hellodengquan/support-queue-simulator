import { useState, useCallback } from 'react';
import ControlPanel from './components/ControlPanel';
import StatsPanel from './components/StatsPanel';
import ChartPanel from './components/ChartPanel';
import QueueChartPanel from './components/QueueChartPanel';
import { runSimulation } from './utils/simulator';
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

  const handleRunSimulation = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      const result = runSimulation(params);
      setStats(result);
      setIsRunning(false);
    }, 100);
  }, [params]);

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
        </div>

        <div className="right-panel">
          <StatsPanel stats={stats} />
          <ChartPanel data={stats?.waitTimeData} />
          <QueueChartPanel
            queueData={stats?.queueLengthData}
            utilData={stats?.agentUtilData}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
