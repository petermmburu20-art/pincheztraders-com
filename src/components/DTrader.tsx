import React, { useState, useEffect } from 'react';
import derivApi from '../services/derivApi';
import './DTrader.scss';

interface OpenPosition {
  id: string;
  symbol: string;
  type: 'CALL' | 'PUT';
  amount: number;
  entryTime: number;
  status: 'pending' | 'won' | 'lost';
  profit?: number;
}

const DTrader: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [selectedSymbol, setSelectedSymbol] = useState('R_50');
  const [contractType, setContractType] = useState<'CALL' | 'PUT'>('CALL');
  const [amount, setAmount] = useState(10);
  const [duration, setDuration] = useState(5);
  const [positions, setPositions] = useState<OpenPosition[]>([]);
  const [tradingStats, setTradingStats] = useState({
    totalTrades: 0,
    wins: 0,
    losses: 0,
    totalProfit: 0
  });

  const symbols = [
    { value: 'R_50', label: 'Index 50' },
    { value: 'R_100', label: 'Index 100' },
    { value: 'EURUSD', label: 'EUR/USD' },
    { value: 'GBPUSD', label: 'GBP/USD' },
    { value: 'USDJPY', label: 'USD/JPY' },
    { value: 'AUDUSD', label: 'AUD/USD' },
    { value: 'NZDUSD', label: 'NZD/USD' }
  ];

  useEffect(() => {
    // Listen for account updates
    derivApi.on('account', (data: any) => {
      setBalance(data.balance);
      setCurrency(data.currency);
      setIsConnected(true);
    });

    // Listen for trade results
    derivApi.on('trade', (data: any) => {
      const profit = data.payout - data.buy_price;
      setTradingStats((prev) => ({
        ...prev,
        totalTrades: prev.totalTrades + 1,
        wins: profit > 0 ? prev.wins + 1 : prev.wins,
        losses: profit <= 0 ? prev.losses + 1 : prev.losses,
        totalProfit: prev.totalProfit + profit
      }));
    });
  }, []);

  const handlePlaceTrade = async () => {
    if (!isConnected) {
      alert('⚠️ Please connect to Deriv first');
      return;
    }

    if (amount > balance) {
      alert('❌ Insufficient balance');
      return;
    }

    const newPosition: OpenPosition = {
      id: Math.random().toString(36).substr(2, 9),
      symbol: selectedSymbol,
      type: contractType,
      amount: amount,
      entryTime: Date.now(),
      status: 'pending'
    };

    setPositions([...positions, newPosition]);
    derivApi.getProposal(selectedSymbol, contractType, duration, amount);

    // Simulate trade result after duration
    setTimeout(() => {
      const won = Math.random() > 0.5;
      setPositions((prev) =>
        prev.map((p) =>
          p.id === newPosition.id
            ? {
                ...p,
                status: won ? 'won' : 'lost',
                profit: won ? amount : -amount
              }
            : p
        )
      );
    }, duration * 60000);
  };

  const winRate = tradingStats.totalTrades > 0 ? ((tradingStats.wins / tradingStats.totalTrades) * 100).toFixed(1) : 0;

  return (
    <div className="dtrader">
      <h2>💰 DTrader - Manual Trading</h2>

      {/* Account Section */}
      <div className="dtrader-section account-section">
        <h3>Account Information</h3>
        {isConnected ? (
          <div className="account-info">
            <div className="balance-box">
              <div className="balance-label">Account Balance</div>
              <div className="balance-value">
                {balance.toFixed(2)} {currency}
              </div>
            </div>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Total Trades</div>
                <div className="stat-value">{tradingStats.totalTrades}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Win Rate</div>
                <div className="stat-value" style={{ color: winRate > 50 ? '#28a745' : '#dc3545' }}>
                  {winRate}%
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Wins/Losses</div>
                <div className="stat-value">
                  <span style={{ color: '#28a745' }}>{tradingStats.wins}</span> /
                  <span style={{ color: '#dc3545' }}> {tradingStats.losses}</span>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Total Profit</div>
                <div className="stat-value" style={{ color: tradingStats.totalProfit >= 0 ? '#28a745' : '#dc3545' }}>
                  {tradingStats.totalProfit.toFixed(2)} {currency}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="not-connected">📡 Not connected. Open bot settings to connect Deriv API.</div>
        )}
      </div>

      {/* Trading Panel */}
      {isConnected && (
        <div className="dtrader-section trading-panel">
          <h3>Place Trade</h3>

          <div className="trade-inputs">
            <div className="input-row">
              <div className="input-group">
                <label>Symbol</label>
                <select value={selectedSymbol} onChange={(e) => setSelectedSymbol(e.target.value)}>
                  {symbols.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Direction</label>
                <div className="direction-buttons">
                  <button
                    className={`btn-direction ${contractType === 'CALL' ? 'active' : ''}`}
                    onClick={() => setContractType('CALL')}
                  >
                    📈 CALL
                  </button>
                  <button
                    className={`btn-direction ${contractType === 'PUT' ? 'active' : ''}`}
                    onClick={() => setContractType('PUT')}
                  >
                    📉 PUT
                  </button>
                </div>
              </div>
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>Amount ({currency})</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min="1"
                  max={balance}
                />
              </div>

              <div className="input-group">
                <label>Duration (minutes)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min="1"
                  max="60"
                />
              </div>
            </div>

            <button onClick={handlePlaceTrade} className="btn-trade">
              📊 Place Trade
            </button>
          </div>
        </div>
      )}

      {/* Open Positions */}
      {positions.length > 0 && (
        <div className="dtrader-section positions-section">
          <h3>Open Positions ({positions.length})</h3>
          <div className="positions-list">
            {positions.map((pos) => (
              <div key={pos.id} className={`position-card status-${pos.status}`}>
                <div className="position-header">
                  <div className="position-symbol">{pos.symbol}</div>
                  <div className={`position-type ${pos.type}`}>
                    {pos.type === 'CALL' ? '📈' : '📉'} {pos.type}
                  </div>
                  <div className={`position-status ${pos.status}`}>
                    {pos.status === 'won' && '✅ WON'}
                    {pos.status === 'lost' && '❌ LOST'}
                    {pos.status === 'pending' && '⏳ PENDING'}
                  </div>
                </div>
                <div className="position-details">
                  <div className="detail-item">
                    <span className="label">Amount:</span>
                    <span className="value">{pos.amount} {currency}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Entry:</span>
                    <span className="value">{new Date(pos.entryTime).toLocaleTimeString()}</span>
                  </div>
                  {pos.profit && (
                    <div className="detail-item">
                      <span className="label">P/L:</span>
                      <span className="value" style={{ color: pos.profit > 0 ? '#28a745' : '#dc3545' }}>
                        {pos.profit > 0 ? '+' : ''}{pos.profit.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DTrader;
