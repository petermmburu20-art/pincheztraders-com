import React, { useState, useEffect } from 'react';
import technicalAnalysis, { AnalysisData } from '../services/technicalAnalysis';
import derivApi from '../services/derivApi';
import './AnalysisTools.scss';

interface AnalysisState {
  prices: number[];
  analysis: AnalysisData | null;
  selectedSymbol: string;
}

const AnalysisTools: React.FC = () => {
  const [state, setState] = useState<AnalysisState>({
    prices: [],
    analysis: null,
    selectedSymbol: 'R_50'
  });

  const symbols = [
    { value: 'R_50', label: 'Index 50' },
    { value: 'R_100', label: 'Index 100' },
    { value: 'EURUSD', label: 'EUR/USD' },
    { value: 'GBPUSD', label: 'GBP/USD' },
    { value: 'USDJPY', label: 'USD/JPY' }
  ];

  useEffect(() => {
    // Subscribe to prices
    derivApi.on('price', (data: any) => {
      setState((prev) => {
        const newPrices = [...prev.prices, data.quote];
        if (newPrices.length > 100) newPrices.shift();

        const analysis = technicalAnalysis.getFullAnalysis(newPrices);

        return {
          ...prev,
          prices: newPrices,
          analysis
        };
      });
    });

    derivApi.subscribeToPrices(state.selectedSymbol);
  }, [state.selectedSymbol]);

  const handleSymbolChange = (symbol: string) => {
    setState((prev) => ({
      ...prev,
      selectedSymbol: symbol,
      prices: [],
      analysis: null
    }));
  };

  const getSignal = () => {
    if (!state.analysis) return 'NEUTRAL';

    const { rsi, macd, stochastic } = state.analysis;

    let signal = 'NEUTRAL';

    // RSI signals
    if (rsi > 70) signal = 'OVERBOUGHT';
    if (rsi < 30) signal = 'OVERSOLD';

    // MACD signals
    if (macd.histogram > 0) signal = 'BULLISH';
    if (macd.histogram < 0) signal = 'BEARISH';

    return signal;
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BULLISH':
        return '#28a745';
      case 'BEARISH':
        return '#dc3545';
      case 'OVERBOUGHT':
        return '#ffc107';
      case 'OVERSOLD':
        return '#17a2b8';
      default:
        return '#666';
    }
  };

  return (
    <div className="analysis-tools">
      <h2>📊 Technical Analysis Tools</h2>

      {/* Symbol Selection */}
      <div className="analysis-section">
        <h3>Select Symbol</h3>
        <div className="symbol-selector">
          {symbols.map((symbol) => (
            <button
              key={symbol.value}
              className={`symbol-btn ${state.selectedSymbol === symbol.value ? 'active' : ''}`}
              onClick={() => handleSymbolChange(symbol.value)}
            >
              {symbol.label}
            </button>
          ))}
        </div>
      </div>

      {/* Analysis Results */}
      {state.analysis && (
        <>
          {/* Signal Summary */}
          <div className="analysis-section signal-summary">
            <h3>Market Signal</h3>
            <div className="signal-box" style={{ borderColor: getSignalColor(getSignal()) }}>
              <div className="signal-indicator" style={{ backgroundColor: getSignalColor(getSignal()) }}>
                {getSignal()}
              </div>
              <p>Current market condition based on technical indicators</p>
            </div>
          </div>

          {/* RSI Section */}
          <div className="analysis-section">
            <h3>RSI (Relative Strength Index)</h3>
            <div className="metric-card">
              <div className="metric-value" style={{ color: state.analysis.rsi > 70 ? '#ffc107' : state.analysis.rsi < 30 ? '#17a2b8' : '#666' }}>
                {state.analysis.rsi.toFixed(2)}
              </div>
              <div className="metric-label">RSI (14)</div>
              <div className="metric-info">
                {state.analysis.rsi > 70 && '⚠️ Overbought - Consider SELL'}
                {state.analysis.rsi < 30 && '✅ Oversold - Consider BUY'}
                {state.analysis.rsi >= 30 && state.analysis.rsi <= 70 && '➖ Neutral zone'}
              </div>
              <div className="progress-bar">
                <div className="progress" style={{ width: `${state.analysis.rsi}%` }}></div>
              </div>
            </div>
          </div>

          {/* MACD Section */}
          <div className="analysis-section">
            <h3>MACD (Moving Average Convergence Divergence)</h3>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-value">{state.analysis.macd.macd.toFixed(4)}</div>
                <div className="metric-label">MACD Line</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{state.analysis.macd.signal.toFixed(4)}</div>
                <div className="metric-label">Signal Line</div>
              </div>
              <div className="metric-card">
                <div className="metric-value" style={{ color: state.analysis.macd.histogram > 0 ? '#28a745' : '#dc3545' }}>
                  {state.analysis.macd.histogram.toFixed(4)}
                </div>
                <div className="metric-label">Histogram</div>
                <div className="metric-info">
                  {state.analysis.macd.histogram > 0 ? '📈 Bullish' : '📉 Bearish'}
                </div>
              </div>
            </div>
          </div>

          {/* Bollinger Bands Section */}
          <div className="analysis-section">
            <h3>Bollinger Bands</h3>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-value">{state.analysis.bollinger.upper.toFixed(4)}</div>
                <div className="metric-label">Upper Band</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{state.analysis.bollinger.middle.toFixed(4)}</div>
                <div className="metric-label">Middle (SMA)</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{state.analysis.bollinger.lower.toFixed(4)}</div>
                <div className="metric-label">Lower Band</div>
              </div>
            </div>
          </div>

          {/* Stochastic Section */}
          <div className="analysis-section">
            <h3>Stochastic Oscillator</h3>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-value" style={{ color: state.analysis.stochastic.k > 80 ? '#ffc107' : state.analysis.stochastic.k < 20 ? '#17a2b8' : '#666' }}>
                  {state.analysis.stochastic.k.toFixed(2)}
                </div>
                <div className="metric-label">%K Line</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{state.analysis.stochastic.d.toFixed(2)}</div>
                <div className="metric-label">%D Line</div>
              </div>
            </div>
          </div>

          {/* EMA Section */}
          <div className="analysis-section">
            <h3>Exponential Moving Averages</h3>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-value">{state.analysis.ema.ema12.toFixed(4)}</div>
                <div className="metric-label">EMA (12)</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{state.analysis.ema.ema26.toFixed(4)}</div>
                <div className="metric-label">EMA (26)</div>
              </div>
            </div>
            <div className="metric-info" style={{ marginTop: '10px' }}>
              {state.analysis.ema.ema12 > state.analysis.ema.ema26 ? '📈 EMA(12) above EMA(26) - Bullish' : '📉 EMA(12) below EMA(26) - Bearish'}
            </div>
          </div>
        </>
      )}

      {state.prices.length === 0 && (
        <div className="loading-message">
          ⏳ Loading market data... {state.selectedSymbol}
        </div>
      )}
    </div>
  );
};

export default AnalysisTools;
