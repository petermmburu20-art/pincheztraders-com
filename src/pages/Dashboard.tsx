import React from 'react';
import BotSettings from '../components/BotSettings';
import AnalysisTools from '../components/AnalysisTools';
import DTrader from '../components/DTrader';
import './Dashboard.scss';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('overview');

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>📊 Pinchez Traders - Advanced Trading Platform</h1>
        <p>Powered by Deriv API</p>
      </div>

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📈 Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          📊 Analysis Tools
        </button>
        <button
          className={`tab-btn ${activeTab === 'dtrader' ? 'active' : ''}`}
          onClick={() => setActiveTab('dtrader')}
        >
          💰 DTrader
        </button>
        <button
          className={`tab-btn ${activeTab === 'bots' ? 'active' : ''}`}
          onClick={() => setActiveTab('bots')}
        >
          🤖 Trading Bots
        </button>
      </div>

      {/* Content */}
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <h2>Welcome to Pinchez Traders</h2>
            <div className="features-grid">
              <div className="feature-card">
                <h3>🤖 Automated Trading Bots</h3>
                <p>Run multiple trading strategies simultaneously with advanced bot engine.</p>
              </div>
              <div className="feature-card">
                <h3>📊 Technical Analysis</h3>
                <p>Real-time analysis with RSI, MACD, Bollinger Bands, and more indicators.</p>
              </div>
              <div className="feature-card">
                <h3>💰 Manual Trading</h3>
                <p>DTrader interface for manual trading with live account management.</p>
              </div>
              <div className="feature-card">
                <h3>📈 Market Signals</h3>
                <p>AI-powered market signals to help you make informed trading decisions.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && <AnalysisTools />}

        {activeTab === 'dtrader' && <DTrader />}

        {activeTab === 'bots' && <BotSettings />}
      </div>
    </div>
  );
};

export default Dashboard;
