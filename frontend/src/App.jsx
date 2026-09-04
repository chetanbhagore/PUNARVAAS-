import React, { useState, useEffect, useCallback } from 'react';
import StatusBar from './components/StatusBar';
import Sidebar from './components/Sidebar';
import JudgeDemoBanner from './components/JudgeDemoBanner';

import OverviewTab from './tabs/OverviewTab';
import LiveMapTab from './tabs/LiveMapTab';
import AlertsTab from './tabs/AlertsTab';
import DirectoryTab from './tabs/DirectoryTab';
import CapacityTab from './tabs/CapacityTab';
import RelocationTab from './tabs/RelocationTab';
import AnalyticsTab from './tabs/AnalyticsTab';
import MethodologyTab from './tabs/MethodologyTab';

import {
  fetchStats,
  fetchHabitations,
  fetchAlerts,
  fetchScenarios,
  triggerSimulation,
  triggerJudgeDemo
} from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [habitations, setHabitations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [activeScenario, setActiveScenario] = useState('baseline');

  const [selectedHabitation, setSelectedHabitation] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isJudgeDemoLoading, setIsJudgeDemoLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Load baseline dashboard state
  const loadDashboardData = useCallback(async () => {
    try {
      const [statsData, habsData, alertsData, scenariosData] = await Promise.all([
        fetchStats(),
        fetchHabitations(),
        fetchAlerts(),
        fetchScenarios()
      ]);
      setStats(statsData);
      setHabitations(habsData);
      setAlerts(alertsData);
      setScenarios(scenariosData.scenarios || []);
      setActiveScenario(scenariosData.active_scenario || 'baseline');
    } catch (err) {
      console.error('Error fetching dashboard state:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Section 13: Judge Demo Mode Handler
  const handleTriggerJudgeDemo = async () => {
    setIsJudgeDemoLoading(true);
    try {
      const res = await triggerJudgeDemo();
      await loadDashboardData();

      // Automatically navigate to Alerts & Warnings tab and expand the lead RED alert
      setActiveTab('alerts');
      if (res.lead_alert) {
        setSelectedAlert(res.lead_alert);
      }
    } catch (err) {
      console.error('Judge Demo Mode failed:', err);
    } finally {
      setIsJudgeDemoLoading(false);
    }
  };

  // Simulation scenario selector handler
  const handleSimulateScenario = async (scenarioId) => {
    setIsSimulating(true);
    try {
      const res = await triggerSimulation(scenarioId);
      await loadDashboardData();
      if (scenarioId !== 'baseline') {
        setActiveTab('alerts');
        if (res.lead_alert) {
          setSelectedAlert(res.lead_alert);
        }
      }
    } catch (err) {
      console.error('Scenario simulation failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Reset to baseline state
  const handleResetBaseline = async () => {
    setIsResetting(true);
    try {
      await triggerSimulation('baseline');
      await loadDashboardData();
      setSelectedAlert(null);
      setSelectedHabitation(null);
    } catch (err) {
      console.error('Reset failed:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const getScenarioDisplayName = () => {
    if (activeScenario === 'baseline') return null;
    const match = scenarios.find(s => s.id === activeScenario);
    return match ? match.name : activeScenario;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#EDF0F2] flex items-center justify-center text-xs font-semibold text-[#5C6B76]">
        Initializing PUNARVAAS Decision Engine...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#EDF0F2] font-sans antialiased text-[#16232E]">
      {/* Persistent Top Status Bar (Section 4 & 5) */}
      <StatusBar
        stats={stats}
        onTriggerJudgeDemo={handleTriggerJudgeDemo}
        isJudgeDemoLoading={isJudgeDemoLoading}
      />

      {/* Simulation Active Notice Banner */}
      <JudgeDemoBanner
        scenarioName={getScenarioDisplayName()}
        onResetBaseline={handleResetBaseline}
        isResetting={isResetting}
      />

      {/* Main Container: Sidebar + Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Fixed Sidebar Navigation (Section 4) */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tabId) => {
            setActiveTab(tabId);
            setSelectedHabitation(null);
          }}
          totalActiveAlerts={stats?.total_active_alerts || 0}
        />

        {/* Tab Content Viewport */}
        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-45px)]">
          {activeTab === 'overview' && (
            <OverviewTab
              stats={stats}
              alerts={alerts}
              onNavigateTab={setActiveTab}
              onSelectAlert={(a) => {
                setSelectedAlert(a);
                setActiveTab('alerts');
              }}
              onTriggerJudgeDemo={handleTriggerJudgeDemo}
              isJudgeDemoLoading={isJudgeDemoLoading}
            />
          )}

          {activeTab === 'live_map' && (
            <LiveMapTab
              habitations={habitations}
              selectedHabitation={selectedHabitation}
              onSelectHabitation={setSelectedHabitation}
              onCloseDetail={() => setSelectedHabitation(null)}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsTab
              alerts={alerts}
              selectedAlert={selectedAlert}
              onSelectAlert={setSelectedAlert}
              onNavigateTab={setActiveTab}
              habitations={habitations}
              onSelectHabitation={(hab) => {
                setSelectedHabitation(hab);
                setActiveTab('live_map');
              }}
              scenarios={scenarios}
              activeScenario={activeScenario}
              onSimulateScenario={handleSimulateScenario}
              onTriggerJudgeDemo={handleTriggerJudgeDemo}
              isSimulating={isSimulating}
              isJudgeDemoLoading={isJudgeDemoLoading}
            />
          )}

          {activeTab === 'directory' && (
            <DirectoryTab
              habitations={habitations}
              selectedHabitation={selectedHabitation}
              onSelectHabitation={setSelectedHabitation}
              onCloseDetail={() => setSelectedHabitation(null)}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'capacity' && (
            <CapacityTab />
          )}

          {activeTab === 'relocation' && (
            <RelocationTab habitations={habitations} />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsTab />
          )}

          {activeTab === 'methodology' && (
            <MethodologyTab />
          )}
        </main>
      </div>
    </div>
  );
}
