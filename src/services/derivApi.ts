import { authorize } from '@deriv/deriv-api/types';

interface PriceData {
  symbol: string;
  bid: number;
  ask: number;
  timestamp: number;
}

interface AccountInfo {
  email: string;
  balance: number;
  currency: string;
  loginid: string;
}

class DerivApiService {
  private ws: WebSocket | null = null;
  private apiToken: string = '';
  private messageCallbacks: { [key: string]: Function[] } = {};
  private accountInfo: AccountInfo | null = null;

  constructor() {
    this.messageCallbacks = {
      price: [],
      account: [],
      trade: [],
      proposal: [],
      error: []
    };
  }

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiToken = token;
      try {
        this.ws = new WebSocket('wss://ws.deriv.com/websockets/v3');

        this.ws.onopen = () => {
          console.log('✅ Connected to Deriv');
          this.authorize();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('❌ Deriv API Error:', error);
          this.triggerCallback('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Connection closed');
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private authorize() {
    if (this.ws) {
      this.ws.send(
        JSON.stringify({
          authorize: this.apiToken
        })
      );
    }
  }

  private handleMessage(data: string) {
    const response = JSON.parse(data);

    if (response.authorize) {
      this.accountInfo = {
        email: response.authorize.email,
        balance: response.authorize.balance,
        currency: response.authorize.currency,
        loginid: response.authorize.loginid
      };
      this.triggerCallback('account', this.accountInfo);
    }

    if (response.tick) {
      this.triggerCallback('price', response.tick);
    }

    if (response.proposal) {
      this.triggerCallback('proposal', response.proposal);
    }

    if (response.buy) {
      this.triggerCallback('trade', response.buy);
    }
  }

  private triggerCallback(type: string, data: any) {
    if (this.messageCallbacks[type]) {
      this.messageCallbacks[type].forEach((callback) => callback(data));
    }
  }

  on(event: string, callback: Function) {
    if (!this.messageCallbacks[event]) {
      this.messageCallbacks[event] = [];
    }
    this.messageCallbacks[event].push(callback);
  }

  // Get live prices
  subscribeToPrices(symbol: string) {
    if (this.ws) {
      this.ws.send(
        JSON.stringify({
          ticks: symbol,
          subscribe: 1
        })
      );
    }
  }

  // Get candlestick data for charts
  getCandleData(symbol: string, granularity: number = 60) {
    if (this.ws) {
      this.ws.send(
        JSON.stringify({
          candles: symbol,
          granularity: granularity,
          subscribe: 1
        })
      );
    }
  }

  // Get contract proposal
  getProposal(symbol: string, contractType: string, duration: number, amount: number) {
    if (this.ws) {
      this.ws.send(
        JSON.stringify({
          proposal: 1,
          subscribe: 1,
          contract_type: contractType,
          currency: 'USD',
          duration: duration,
          duration_unit: 'm',
          symbol: symbol,
          amount: amount
        })
      );
    }
  }

  // Place a trade
  placeTrade(proposalId: string, amount: number) {
    if (this.ws) {
      this.ws.send(
        JSON.stringify({
          buy: proposalId,
          price: amount
        })
      );
    }
  }

  // Get account balance
  getBalance() {
    if (this.ws) {
      this.ws.send(
        JSON.stringify({
          balance: 1,
          subscribe: 1
        })
      );
    }
  }

  // Close connection
  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getAccountInfo(): AccountInfo | null {
    return this.accountInfo;
  }
}

export default new DerivApiService();
