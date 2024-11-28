import { HandlerContext, SkillResponse } from "@xmtp/message-kit";
import axios from "axios";

interface ModeBlock {
  height: string;
  timestamp: string;
  tx_count: string;
  miner: string;
  size: string;
  hash: string;
  type: string;
}

interface ModeToken {
  address: string;
  name: string;
  symbol: string;
  type: string;
  holders: string;
  total_supply: string;
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  fee: string;
  timestamp: string;
  status: string;
}

export class ModeHandler {
  private readonly MODE_API_URL = "https://explorer.mode.network/api/v2";

  async getNetworkStats() {
    try {
      console.log("Fetching Mode stats...");
      const response = await axios.get(`${this.MODE_API_URL}/stats`, {
        headers: {
          'accept': 'application/json'
        }
      });
      console.log("Stats response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Detailed stats error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(`Failed to fetch Mode stats: ${error.message}`);
    }
  }

  async getLatestBlocks() {
    try {
      console.log("Fetching Mode blocks...");
      const response = await axios.get(`${this.MODE_API_URL}/blocks`, {
        headers: {
          'accept': 'application/json'
        }
      });
      console.log("Blocks response:", response.data);
      return response.data.items || [];
    } catch (error: any) {
      console.error("Detailed blocks error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(`Failed to fetch Mode blocks: ${error.message}`);
    }
  }

  async searchTokens(query: string = '') {
    try {
      console.log("Fetching Mode tokens...");
      const response = await axios.get(`${this.MODE_API_URL}/tokens`, {
        params: {
          q: query,
          type: 'ERC-20,ERC-721,ERC-1155'
        },
        headers: {
          'accept': 'application/json'
        }
      });
      console.log("Tokens response:", response.data);
      return response.data.items || [];
    } catch (error: any) {
      console.error("Detailed tokens error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(`Failed to fetch Mode tokens: ${error.message}`);
    }
  }

  async getLatestTransactions(limit: number = 10): Promise<Transaction[]> {
    try {
      console.log("Fetching Mode transactions with limit:", limit);
      const response = await axios.get(`${this.MODE_API_URL}/transactions`, {
        params: {
          limit: limit
        },
        headers: {
          'accept': 'application/json'
        }
      });
      console.log("Transactions response:", response.data);
      return response.data.items || [];
    } catch (error: any) {
      console.error("Detailed transactions error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(`Failed to fetch Mode transactions: ${error.message}`);
    }
  }

  async handleModeRequest(
    context: HandlerContext
  ): Promise<SkillResponse | undefined> {
    try {
      const {
        message: {
          content: { skill, params },
        },
      } = context;

      console.log("Handling Mode request:", { skill, params });

      if (skill === "modestats") {
        const stats = await this.getNetworkStats();
        await context.send(
          `📊 Mode Network Statistics\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          Object.entries(stats).map(([key, value]) => 
            `${key}: ${value}`
          ).join('\n')
        );
        return { code: 200, message: "Stats fetched successfully" };
      }

      if (skill === "modeblocks") {
        const blocks = await this.getLatestBlocks();
        if (!blocks || blocks.length === 0) {
          await context.send("No blocks found");
          return { code: 404, message: "No blocks found" };
        }
        
        const blockList = blocks.slice(0, 5).map((block, i) => 
          `${i + 1}. Block #${block.height}\n` +
          `   📅 Time: ${block.timestamp}\n` +
          `   📦 Transactions: ${block.tx_count}\n` +
          `   ⛏️ Miner: ${block.miner}\n` +
          `   🔗 Hash: ${block.hash}\n`
        ).join('\n');

        await context.send(
          `🏗️ Latest Mode Blocks\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n${blockList}`
        );
        return { code: 200, message: "Blocks fetched successfully" };
      }

      

      if (skill === "modetokens") {
        const query = params?.query || '';
        const tokens = await this.searchTokens(query);
        if (!tokens || tokens.length === 0) {
          await context.send("No tokens found");
          return { code: 404, message: "No tokens found" };
        }

        const tokenList = tokens.slice(0, 5).map((token, i) => 
          `${i + 1}. ${token.name} (${token.symbol})\n` +
          `   📝 Type: ${token.type}\n` +
          `   📍 Address: ${token.address}\n` +
          `   👥 Holders: ${token.holders}\n`
        ).join('\n');

        await context.send(
          `🪙 Mode Tokens${query ? ` matching "${query}"` : ''}\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n${tokenList}`
        );
        return { code: 200, message: "Tokens fetched successfully" };
      }

      if (skill === "modetransactions") {
        const limit = parseInt(params?.limit) || 5;
        const transactions = await this.getLatestTransactions(limit);
        
        if (!transactions || transactions.length === 0) {
          await context.send("No transactions found");
          return { code: 404, message: "No transactions found" };
        }

        const txList = transactions.map((tx, i) => 
          `${i + 1}. Transaction Details\n` +
          `   🔗 Hash: ${tx.hash}\n` +
          `   📤 From: ${tx.from}\n` +
          `   📥 To: ${tx.to}\n` +
          `   💰 Value: ${tx.value}\n` +
          `   🏷️ Fee: ${tx.fee}\n` +
          `   ⏰ Time: ${tx.timestamp}\n` +
          `   ✅ Status: ${tx.status}\n` +
          `   🔍 View: https://explorer.mode.network/tx/${tx.hash}\n`
        ).join('\n');

        await context.send(
          `🔄 Latest Mode Transactions\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n${txList}\n\n` +
          `View more at: https://explorer.mode.network/transactions`
        );

        return { code: 200, message: "Transactions fetched successfully" };
      }

      return undefined;
    } catch (error: any) {
      console.error("Handler error:", error);
      const errorMessage = error.response?.data?.message || error.message;
      await context.send(`❌ Error: ${errorMessage}`);
      return {
        code: 500,
        message: `Error: ${errorMessage}`
      };
    }
  }
} 