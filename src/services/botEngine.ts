import derivApi from './derivApi';

export interface BotStrategy {
  id: string;
  name: string;
  symbol: string;
  contractType: 'CALL' | 'PUT';
  amount: number;
  duration: number;
  stopLoss: number;
  takeProfit: number;
  strategy: 'martingale' | 'dca' | 'grid' | 'rsi' | 'simple';
  rsiPeriod?: number;
  rsiUpperBound?: number;
  rsiLowerBound?: number;
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'CALL' | 'PUT';
  amount: number;
  timestamp: number;
  status: 'pending' | 'won' | 'lost';
  profit?: number;
}

class BotEngine {
  private isRunning = false;
  private prices: { [key: string]: number[] } = {};
  private trades: Trade[] = [];
  private strategies: BotStrategy[] = [];
  private martingaleTracker: { [key: string]: number } = {};

  startBot(strategy: BotStrategy) {
    this.isRunning = true;
    this.strategies.push(strategy);
    console.log(`🤖 Bot started: ${strategy.name}`);

    // Subscribe to prices
    derivApi.subscribeToPrices(strategy.symbol);
    derivApi.getCandleData(strategy.symbol, 60);

    // Listen for price updates
    derivApi.on('price', (data: any) => {
      this.updatePrice(strategy.symbol, data.quote);
      this.executeStrategy(strategy);
    });
  }

  stopBot(strategyId: string) {
    this.strategies = this.strategies.filter((s) => s.id !== strategyId);
    if (this.strategies.length === 0) {
      this.isRunning = false;
    }
    console.log('🛑 Bot stopped');
  }

  private updatePrice(symbol: string, price: number) {
    if (!this.prices[symbol]) {
      this.prices[symbol] = [];
    }
    this.prices[symbol].push(price);
    // Keep only last 100 prices
    if (this.prices[symbol].length > 100) {
      this.prices[symbol].shift();
    }
  }

  private executeStrategy(strategy: BotStrategy) {
    if (!this.isRunning) return;

    const prices = this.prices[strategy.symbol] || [];
    if (prices.length < 2) return;

    switch (strategy.strategy) {
      case 'martingale':
        this.executeMartingale(strategy, prices);
        break;
      case 'dca':
        this.executeDCA(strategy, prices);
        break;
      case 'grid':
        this.executeGrid(strategy, prices);
        break;
      case 'rsi':
        this.executeRSI(strategy, prices);
        break;
      case 'simple':
        this.executeSimple(strategy, prices);
        break;
    }
  }

  private executeMartingale(strategy: BotStrategy, prices: number[]) {
    const lastPrice = prices[prices.length - 1];
    const previousPrice = prices[prices.length - 2];

    if (!this.martingaleTracker[strategy.id]) {
      this.martingaleTracker[strategy.id] = strategy.amount;
    }

    const tradeAmount = this.martingaleTracker[strategy.id];
    const contractType = lastPrice > previousPrice ? 'CALL' : 'PUT';

    this.placeBotTrade(strategy, contractType, tradeAmount);
    this.martingaleTracker[strategy.id] *= 2; // Double on next loss
  }

  private executeDCA(strategy: BotStrategy, prices: number[]) {
    // Dollar Cost Averaging - trade at fixed intervals
    this.placeBotTrade(strategy, strategy.contractType, strategy.amount);
  }

  private executeGrid(strategy: BotStrategy, prices: number[]) {
    const lastPrice = prices[prices.length - 1];
    const avgPrice = prices.reduce((a, b) => a + b) / prices.length;

    if (lastPrice > avgPrice) {
      this.placeBotTrade(strategy, 'CALL', strategy.amount);
    } else {
      this.placeBotTrade(strategy, 'PUT', strategy.amount);
    }
  }

  private executeRSI(strategy: BotStrategy, prices: number[]) {
    const rsi = this.calculateRSI(prices, strategy.rsiPeriod || 14);
    const upper = strategy.rsiUpperBound || 70;
    const lower = strategy.rsiLowerBound || 30;

    if (rsi > upper) {
      this.placeBotTrade(strategy, 'PUT', strategy.amount);
    } else if (rsi < lower) {
      this.placeBotTrade(strategy, 'CALL', strategy.amount);
    }
  }

  private executeSimple(strategy: BotStrategy, prices: number[]) {
    const lastPrice = prices[prices.length - 1];
    const previousPrice = prices[prices.length - 2];

    if (lastPrice > previousPrice * 1.001) {
      this.placeBotTrade(strategy, 'CALL', strategy.amount);
    } else if (lastPrice < previousPrice * 0.999) {
      this.placeBotTrade(strategy, 'PUT', strategy.amount);
    }
  }

  private placeBotTrade(strategy: BotStrategy, contractType: 'CALL' | 'PUT', amount: number) {
    const trade: Trade = {
      id: Math.random().toString(36).substr(2, 9),
      symbol: strategy.symbol,
      type: contractType,
      amount: amount,
      timestamp: Date.now(),
      status: 'pending'
    };

    this.trades.push(trade);

    derivApi.getProposal(strategy.symbol, contractType, strategy.duration, amount);

    console.log(`📊 Trade placed: ${contractType} ${amount} USD on ${strategy.symbol}`);
  }

  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period) return 50;

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

    return rsi;
  }

  getTrades(): Trade[] {
    return this.trades;
  }

  getStrategies(): BotStrategy[] {
    return this.strategies;
  }

  isRunning_(): boolean {
    return this.isRunning;
  }
}

export default new BotEngine();
