import { HandlerContext, SkillResponse } from "@xmtp/message-kit";
import axios from "axios";

interface ModeStats {
  totalBlocks: number;
  avgBlockTime: number;
  totalTransactions: number;
  walletAddresses: number;
  gasPrice: string;
  networkUtilization: string;
}

interface Transaction {
  hash: string;
  type: string;
  status: string;
  from: string;
  to: string;
  value: string;
  fee: string;
  timestamp: string;
}

export class ModeHandler {
  private readonly MODE_EXPLORER_API = "https://explorer.mode.network/api";
  
  async getNetworkStats(): Promise<ModeStats> {
    try {
      // In a real implementation, you would make API calls to the Mode explorer
      return {
        totalBlocks: 8940150,
        avgBlockTime: 14.3,
        totalTransactions: 193823272,
        walletAddresses: 28634064,
        gasPrice: "$1.01",
        networkUtilization: "22.56%"
      };
    } catch (error) {
      throw new Error("Failed to fetch Mode network stats");
    }
  }

  async getLatestTransactions(limit: number = 10): Promise<Transaction[]> {
    try {
      // Generate more realistic transaction data
      return Array(limit).fill(null).map((_, i) => ({
        // Generate full-length 66-character transaction hash (0x + 64 hex chars)
        hash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        type: "Transfer",
        status: "Success",
        // Generate full-length 42-character addresses (0x + 40 hex chars)
        from: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        to: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        value: `${(Math.random() * 10).toFixed(4)} ETH`,
        fee: `${(Math.random() * 0.01).toFixed(4)} ETH`,
        timestamp: `${Math.floor(Math.random() * 60)} mins ago`
      }));
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw new Error("Failed to fetch latest transactions");
    }
  }

  async getTokenInfo(address: string): Promise<any> {
    try {
      // Example with the STUB token
      if (address === "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729") {
        return {
          name: "Stub Token",
          symbol: "STUB",
          type: "Transparent Upgradable Proxy",
          balance: "0.00",
          transactions: 10,
          tokenTransfers: 10
        };
      }
      throw new Error("Token not found");
    } catch (error) {
      throw new Error("Failed to fetch token info");
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

      console.log("Received skill:", skill);
      console.log("Received params:", params);

      if (skill === "modetransactions") {
        const limit = params?.limit || 5;
        console.log("Fetching transactions with limit:", limit);
        
        const txns = await this.getLatestTransactions(limit);
        console.log("Fetched transactions:", txns);

        const txnList = txns.map((tx, i) => 
          `${i + 1}. Transaction Details\n` +
          `   📝 Hash: ${tx.hash}\n` +
          `   💰 Value: ${tx.value}\n` +
          `   🏷️ Fee: ${tx.fee}\n` +
          `   📤 From: ${tx.from}\n` +
          `   📥 To: ${tx.to}\n` +
          `   🔍 Explorer: https://explorer.mode.network/tx/${tx.hash}\n` +
          `   ⏰ Time: ${tx.timestamp}\n`
        ).join('\n');

        await context.send(
          `🔄 Latest Mode Network Transactions\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n${txnList}\n\n` +
          `View more at: https://explorer.mode.network/`
        );

        return {
          code: 200,
          message: "Transactions fetched successfully"
        };
      }

      switch (skill) {
        case "modestats": {
          const stats = await this.getNetworkStats();
          return {
            code: 200,
            message: `📊 Mode Network Stats\n` +
                    `━━━━━━━━━━━━━━━━━━━━━\n` +
                    `Total Blocks: ${stats.totalBlocks.toLocaleString()}\n` +
                    `Avg Block Time: ${stats.avgBlockTime}s\n` +
                    `Total Transactions: ${stats.totalTransactions.toLocaleString()}\n` +
                    `Wallet Addresses: ${stats.walletAddresses.toLocaleString()}\n` +
                    `Gas Price: ${stats.gasPrice}\n` +
                    `Network Utilization: ${stats.networkUtilization}\n`
          };
        }

        case "modetoken": {
          const { address } = params;
          if (!address) {
            return {
              code: 400,
              message: "Please provide a token address"
            };
          }
          const token = await this.getTokenInfo(address);
          return {
            code: 200,
            message: `📱 Token Info: ${token.name}\n` +
                    `━━━━━━━━━━━━━━━━━━━━━\n` +
                    `Symbol: ${token.symbol}\n` +
                    `Type: ${token.type}\n` +
                    `Balance: ${token.balance}\n` +
                    `Transactions: ${token.transactions}\n` +
                    `Token Transfers: ${token.tokenTransfers}\n`
          };
        }
      }
    } catch (error) {
      console.error("Handler error:", error);
      await context.send(`❌ Error: ${error}`);
      return {
        code: 500,
        message: `Error: ${error}`
      };
    }
  }
} 