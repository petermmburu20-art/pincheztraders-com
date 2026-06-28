import React, { useState, useEffect } from 'react';
import derivApi from '../services/derivApi';
import botEngine, { BotStrategy } from '../services/botEngine';
import './BotSettings.scss';

const BotSettings: React.FC = () => {
  const [apiToken, setApiToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [botName, setBotName] = useState('My Bot');
  const [symbol, setSymbol] = useState('R_50');
  const [contractType, setContractType] = useState<'CALL' | 'PUT'>('CALL');
  const [amount, setAmount] = useState(10);
  const [duration, setDuration] = useState(5);
  const [strategy, setStrategy] = useState<'martingale' | 'dca' | 'grid' | 'rsi' | 'simple'>('simple');
  const [isRunning, setIsRunning] = useState(false);
  const [activeBots, setActiveBots] = useState<BotStrategy[]>([]);
  const [rsiSettings, setRsiSettings] = useState({ period: 14, upper: 70, lower: 30 });

  const handleConnect = async () => {
    if (apiToken) {
      try {
        await derivApi.connect(apiToken);
        setIsConnected(true);
        alert('✅ Connected to Deriv!');
      } catch (error) {
        alert('❌ Connection failed: ' + error);
      }
    }
  };

  const handleStartBot = () => {
    if (!isConnected) {
      alert('⚠️ Please connect to Deriv first!');
      return;
    }

    const newBot: BotStrategy = {
      id: Math.random().toString(36).substr(2, 9),
      name: botName,
      symbol,
      contractType,
      amount,
      duration,
      stopLoss: amount * 0.5,
      takeProfit: amount * 2,
      strategy,
      rsiPeriod: rsiSettings.period,
      rsiUpperBound: rsiSettings.upper,
      rsiLowerBound: rsiSettings.lower
    };

    botEngine.startBot(newBot);
    setActiveBots([...botEngine.getStrategies()]);
    setIsRunning(true);
    alert(`✅ Bot "${botName}" started!`);
  };

  const handleStopBot = (botId: string) => {
    botEngine.stopBot(botId);
    setActiveBots([...botEngine.getStrategies()]);
    if (botEngine.getStrategies().length === 0) {
      setIsRunning(false);
    }
  };

  return (
    <div className="bot-settings">
      <h2>🤖 Trading Bot Settings</h2>

      {/* Connection Section */}
      <div className="settings-section">
        <h3>API Connection</h3>
        <div className="input-group">
          <label>Deriv API Token:</label>
          <input
            type="password"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder="Enter your Deriv API token"
            disabled={isConnected}
          />
          <button onClick={handleConnect} disabled={isConnected} className="btn-primary">
            {isConnected ? '✅ Connected' : 'Connect'}
          </button>
        </div>
      </div>

      {/* Bot Configuration Section */}
      {isConnected && (
        <div className="settings-section">
          <h3>Bot Configuration</h3>

          <div className="input-group">
            <label>Bot Name:</label>
            <input type="text" value={botName} onChange={(e) => setBotName(e.target.value)} />
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>Symbol:</label>
              <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
                <option value="R_50">Index 50</option>
                <option value="R_100">Index 100</option>
                <option value="EURUSD">EUR/USD</option>
                <option value="GBPUSD">GBP/USD</option>
                <option value="USDJPY">USD/JPY</option>
              </select>
            </div>

            <div className="input-group">
              <label>Contract Type:</label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value as 'CALL' | 'PUT')}
              >
                <option value="CALL">Call (Up)</option>
                <option value="PUT">Put (Down)</option>
              </select>
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>Trade Amount (USD):</label>
              <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            </div>

            <div className="input-group">
              <label>Duration (minutes):</label>
              <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
            </div>
          </div>

          <div className="input-group">
            <label>Strategy:</label>
            <select value={strategy} onChange={(e) => setStrategy(e.target.value as any)}>
              <option value="simple">Simple (Price Movement)</option>
              <option value="martingale">Martingale</option>
              <option value="dca">DCA (Dollar Cost Averaging)</option>
              <option value="grid">Grid Trading</option>
              <option value="rsi">RSI (Relative Strength Index)</option>
            </select>
          </div>

          {strategy === 'rsi' && (
            <div className="rsi-settings">
              <h4>RSI Settings</h4>
              <div className="input-row">
                <div className="input-group">
                  <label>Period:</label>
                  <input
                    type="number"
                    value={rsiSettings.period}
                    onChange={(e) => setRsiSettings({ ...rsiSettings, period: Number(e.target.value) })}
                  />
                </div>
                <div className="input-group">
                  <label>Upper Bound:</label>
                  <input
                    type="number"
                    value={rsiSettings.upper}
                    onChange={(e) => setRsiSettings({ ...rsiSettings, upper: Number(e.target.value) })}
                  />
                </div>
                <div className="input-group">
                  <label>Lower Bound:</label>
                  <input
                    type="number"
                    value={rsiSettings.lower}
                    onChange={(e) => setRsiSettings({ ...rsiSettings, lower: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleStartBot}
            className="btn-success"
            style={{ marginTop: '15px' }}
          >
            ▶️ Start Bot
          </button>
        </div>
      )}

      {/* Active Bots Section */}
      {activeBots.length > 0 && (
        <div className="settings-section">
          <h3>Active Bots ({activeBots.length})</h3>
          {activeBots.map((bot) => (
            <div key={bot.id} className="bot-card">
              <div className="bot-info">
                <strong>{bot.name}</strong>
                <span className="badge">{bot.strategy.toUpperCase()}</span>
              </div>
              <div className="bot-details">
                <p>{bot.symbol} - {bot.contractType}</p>
                <p>Amount: ${bot.amount} | Duration: {bot.duration}m</p>
              </div>
              <button
                onClick={() => handleStopBot(bot.id)}
                className="btn-danger"
              >
                ⏹️ Stop
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BotSettings;
