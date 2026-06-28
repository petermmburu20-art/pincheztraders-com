export interface AnalysisData {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
  };
  stochastic: {
    k: number;
    d: number;
  };
  ema: {
    ema12: number;
    ema26: number;
  };
}

class TechnicalAnalysis {
  // Calculate RSI (Relative Strength Index)
  calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = prices.length - period; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff > 0) gains += diff;
      else losses += Math.abs(diff);
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    return Math.round(rsi * 100) / 100;
  }

  // Calculate MACD (Moving Average Convergence Divergence)
  calculateMACD(
    prices: number[]
  ): { macd: number; signal: number; histogram: number } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;

    const macdValues = [];
    for (let i = 0; i < prices.length; i++) {
      const ema12_i = this.calculateEMA(prices.slice(0, i + 1), 12);
      const ema26_i = this.calculateEMA(prices.slice(0, i + 1), 26);
      macdValues.push(ema12_i - ema26_i);
    }

    const signalLine = this.calculateEMA(macdValues, 9);
    const histogram = macdLine - signalLine;

    return {
      macd: Math.round(macdLine * 100) / 100,
      signal: Math.round(signalLine * 100) / 100,
      histogram: Math.round(histogram * 100) / 100
    };
  }

  // Calculate Bollinger Bands
  calculateBollingerBands(
    prices: number[],
    period: number = 20,
    stdDev: number = 2
  ): { upper: number; middle: number; lower: number } {
    const lastPrices = prices.slice(-period);
    const sma = lastPrices.reduce((a, b) => a + b) / period;

    const variance =
      lastPrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) /
      period;
    const std = Math.sqrt(variance);

    return {
      upper: Math.round((sma + std * stdDev) * 100) / 100,
      middle: Math.round(sma * 100) / 100,
      lower: Math.round((sma - std * stdDev) * 100) / 100
    };
  }

  // Calculate Stochastic Oscillator
  calculateStochastic(
    prices: number[],
    period: number = 14
  ): { k: number; d: number } {
    const lastPrices = prices.slice(-period);
    const lowest = Math.min(...lastPrices);
    const highest = Math.max(...lastPrices);
    const currentPrice = prices[prices.length - 1];

    const k = ((currentPrice - lowest) / (highest - lowest)) * 100;

    const kValues = [];
    for (let i = period; i < prices.length; i++) {
      const pricePeriod = prices.slice(i - period, i);
      const low = Math.min(...pricePeriod);
      const high = Math.max(...pricePeriod);
      const price = prices[i];
      kValues.push(((price - low) / (high - low)) * 100);
    }

    const d = kValues.reduce((a, b) => a + b) / kValues.length;

    return {
      k: Math.round(k * 100) / 100,
      d: Math.round(d * 100) / 100
    };
  }

  // Calculate EMA (Exponential Moving Average)
  calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];

    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;

    for (let i = period; i < prices.length; i++) {
      ema = prices[i] * multiplier + ema * (1 - multiplier);
    }

    return Math.round(ema * 100) / 100;
  }

  // Calculate SMA (Simple Moving Average)
  calculateSMA(prices: number[], period: number): number {
    const lastPrices = prices.slice(-period);
    const sma = lastPrices.reduce((a, b) => a + b) / period;
    return Math.round(sma * 100) / 100;
  }

  // Get comprehensive analysis
  getFullAnalysis(prices: number[]): AnalysisData {
    return {
      rsi: this.calculateRSI(prices),
      macd: this.calculateMACD(prices),
      bollinger: this.calculateBollingerBands(prices),
      stochastic: this.calculateStochastic(prices),
      ema: {
        ema12: this.calculateEMA(prices, 12),
        ema26: this.calculateEMA(prices, 26)
      }
    };
  }
}

export default new TechnicalAnalysis();
