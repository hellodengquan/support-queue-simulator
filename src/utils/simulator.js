export const runSimulation = (params) => {
  const {
    arrivalRate,
    avgHandleTime,
    agentCount,
    simulationDuration,
    timeStep = 1,
  } = params;

  const lambda = arrivalRate / 3600;
  const mu = 1 / avgHandleTime;

  let currentTime = 0;
  let queue = [];
  let agents = Array(agentCount).fill(null);
  let nextArrivalTime = generateExponential(lambda);

  const waitTimeData = [];
  const queueLengthData = [];
  const agentUtilData = [];

  let totalTickets = 0;
  let totalWaitTime = 0;
  let maxWaitTime = 0;
  let completedTickets = 0;
  let maxQueueLength = 0;

  while (currentTime < simulationDuration * 3600) {
    let nextEventTime = nextArrivalTime;
    let eventType = 'arrival';

    for (let i = 0; i < agents.length; i++) {
      if (agents[i] !== null && agents[i].endTime < nextEventTime) {
        nextEventTime = agents[i].endTime;
        eventType = 'departure';
      }
    }

    currentTime = nextEventTime;

    if (currentTime >= simulationDuration * 3600) break;

    if (eventType === 'arrival') {
      totalTickets++;
      const ticket = {
        id: totalTickets,
        arrivalTime: currentTime,
        handleTime: generateExponential(mu),
      };

      let assigned = false;
      for (let i = 0; i < agents.length; i++) {
        if (agents[i] === null) {
          agents[i] = {
            ticket,
            endTime: currentTime + ticket.handleTime,
          };
          assigned = true;
          break;
        }
      }

      if (!assigned) {
        queue.push(ticket);
        if (queue.length > maxQueueLength) {
          maxQueueLength = queue.length;
        }
      }

      nextArrivalTime = currentTime + generateExponential(lambda);
    } else {
      for (let i = 0; i < agents.length; i++) {
        if (agents[i] !== null && agents[i].endTime <= currentTime) {
          const waitTime = agents[i].ticket.handleTime;
          totalWaitTime += waitTime;
          maxWaitTime = Math.max(maxWaitTime, waitTime);
          completedTickets++;
          agents[i] = null;

          if (queue.length > 0) {
            const nextTicket = queue.shift();
            const waitDuration = currentTime - nextTicket.arrivalTime;
            totalWaitTime += waitDuration;
            if (waitDuration > maxWaitTime) {
              maxWaitTime = waitDuration;
            }
            agents[i] = {
              ticket: nextTicket,
              endTime: currentTime + nextTicket.handleTime,
            };
          }
        }
      }
    }

    const timeHour = Math.floor(currentTime / 3600);
    if (timeHour >= waitTimeData.length) {
      waitTimeData.push({
        time: timeHour + 1,
        waitTime: maxWaitTimeForHour(queue, agents, currentTime),
      });
      queueLengthData.push({
        time: timeHour + 1,
        queueLength: queue.length,
      });
      agentUtilData.push({
        time: timeHour + 1,
        utilization: calculateUtilization(agents),
      });
    }
  }

  const avgWaitTime = completedTickets > 0 ? totalWaitTime / completedTickets : 0;
  const avgUtilization = agentUtilData.reduce((sum, d) => sum + d.utilization, 0) / Math.max(agentUtilData.length, 1);

  return {
    totalTickets,
    completedTickets,
    avgWaitTime,
    maxWaitTime,
    maxQueueLength,
    avgUtilization,
    waitTimeData,
    queueLengthData,
    agentUtilData,
  };
};

const generateExponential = (rate) => {
  return -Math.log(Math.random()) / rate;
};

const maxWaitTimeForHour = (queue, agents, currentTime) => {
  let maxWait = 0;
  for (const ticket of queue) {
    const wait = currentTime - ticket.arrivalTime;
    if (wait > maxWait) maxWait = wait;
  }
  return maxWait;
};

const calculateUtilization = (agents) => {
  const busy = agents.filter((a) => a !== null).length;
  return (busy / agents.length) * 100;
};

export const formatTime = (seconds) => {
  if (seconds < 60) {
    return `${seconds.toFixed(1)} 秒`;
  } else if (seconds < 3600) {
    return `${(seconds / 60).toFixed(1)} 分钟`;
  } else {
    return `${(seconds / 3600).toFixed(2)} 小时`;
  }
};

export const erlangC = (arrivalRate, avgHandleTime, agentCount) => {
  const lambda = arrivalRate / 3600;
  const mu = 1 / avgHandleTime;
  const a = lambda / mu;

  if (a >= agentCount) return { waitProbability: 1, avgWaitTime: Infinity };

  let numerator = (Math.pow(a, agentCount) / factorial(agentCount)) * (agentCount / (agentCount - a));
  let denominator = 0;
  for (let i = 0; i < agentCount; i++) {
    denominator += Math.pow(a, i) / factorial(i);
  }
  denominator += numerator;

  const pw = numerator / denominator;
  const avgWaitTime = (pw * avgHandleTime) / (agentCount - a);

  return {
    waitProbability: pw,
    avgWaitTime,
    utilization: (a / agentCount) * 100,
  };
};

const factorial = (n) => {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
};
