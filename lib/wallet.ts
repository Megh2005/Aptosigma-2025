"use client";

export interface PetraWallet {
  connect: () => Promise<{ publicKey: string; address: string }>;
  disconnect: () => Promise<void>;
  account: () => Promise<{ publicKey: string; address: string }>;
  isConnected: () => Promise<boolean>;
  network: () => Promise<string>;
  signAndSubmitTransaction: (transaction: any) => Promise<any>;
  signMessage: (message: any) => Promise<any>;
}

export interface WalletState {
  connected: boolean;
  address: string | null;
  publicKey: string | null;
  balance: any; // Raw balance from API - can be any format
  network: string;
}

export const APTOS_TESTNET_CONFIG = {
  chain_id: 190,
  name: "Aptos Testnet",
  url: "https://api.testnet.staging.aptoslabs.com/v1",
};

// Staking contract configuration
export const STAKING_CONTRACT = {
  address: "0xa15ac83fec3d7693c55992835fe8e7ac3f3d3486d61193aa411176f0f4d32d58",
  module: "flexibleStaking",
  poolOwner:
    "0xa15ac83fec3d7693c55992835fe8e7ac3f3d3486d61193aa411176f0f4d32d58", // Using contract address as pool owner
};

export class WalletManager {
  private static instance: WalletManager;
  private wallet: PetraWallet | null = null;
  private state: WalletState = {
    connected: false,
    address: null,
    publicKey: null,
    balance: null, // Raw balance from API
    network: "testnet",
  };

  constructor() {
    if (typeof window !== "undefined") {
      this.loadFromSession();
    }
  }

  static getInstance(): WalletManager {
    if (!WalletManager.instance) {
      WalletManager.instance = new WalletManager();
    }
    return WalletManager.instance;
  }

  private loadFromSession() {
    try {
      const saved = sessionStorage.getItem("aptosigma_wallet");
      if (saved) {
        this.state = { ...this.state, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error("Failed to load wallet state from session:", error);
    }
  }

  private saveToSession() {
    try {
      sessionStorage.setItem("aptosigma_wallet", JSON.stringify(this.state));
    } catch (error) {
      console.error("Failed to save wallet state to session:", error);
    }
  }

  isPetraInstalled(): boolean {
    return typeof window !== "undefined" && "aptos" in window;
  }

  async connectWallet(): Promise<WalletState> {
    if (!this.isPetraInstalled()) {
      throw new Error(
        "Petra wallet not installed. Please install Petra wallet extension."
      );
    }

    try {
      console.log("=== WALLET CONNECTION PROCESS ===");
      this.wallet = (window as any).aptos;
      const response = await this.wallet!.connect();

      console.log(
        "Wallet connection response:",
        JSON.stringify(response, null, 2)
      );
      console.log("Connected address:", response.address);
      console.log("Connected public key:", response.publicKey);

      // Get fresh balance after connection using public key
      console.log("Fetching raw balance using public key...");
      const balance = await this.getBalance(response.publicKey);
      console.log("Retrieved raw balance:", JSON.stringify(balance, null, 2));

      this.state = {
        connected: true,
        address: response.address,
        publicKey: response.publicKey,
        balance: balance,
        network: "testnet",
      };

      console.log("Final wallet state:", JSON.stringify(this.state, null, 2));
      this.saveToSession();
      console.log("=== WALLET CONNECTION COMPLETE ===");
      return this.state;
    } catch (error) {
      console.error("=== WALLET CONNECTION FAILED ===");
      console.error("Connection error:", error);
      throw error;
    }
  }

  async disconnectWallet(): Promise<void> {
    if (this.wallet) {
      await this.wallet.disconnect();
    }

    this.state = {
      connected: false,
      address: null,
      publicKey: null,
      balance: null, // Reset to null
      network: "testnet",
    };

    sessionStorage.removeItem("aptosigma_wallet");
  }

  async getBalance(publicKey: string): Promise<any> {
    try {
      console.log("=== FETCHING BALANCE ===");
      console.log("Public key:", publicKey);

      // Use the simplified balance endpoint with public key
      const balanceUrl = `${APTOS_TESTNET_CONFIG.url}/accounts/${publicKey}/balance/0x1::aptos_coin::AptosCoin`;
      console.log("Balance endpoint URL:", balanceUrl);

      const response = await fetch(balanceUrl);
      console.log("Balance response status:", response.status);
      console.log(
        "Balance response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        console.warn("Balance fetch failed:", {
          status: response.status,
          statusText: response.statusText,
          url: balanceUrl,
        });

        if (response.status === 404) {
          console.warn("Account not found or no APT balance - returning null");
          return null;
        }
        return null;
      }

      const data = await response.json();
      console.log("Raw balance response data:", JSON.stringify(data, null, 2));

      // USE ONLY THE RAW BALANCE FROM THE API RESPONSE
      const rawBalance = data;
      console.log("Using raw balance data:", rawBalance);

      // Store and use the raw balance exactly as returned
      const formattedBalance = rawBalance;
      console.log("Final balance (raw from API):", formattedBalance);
      console.log("=== BALANCE FETCH COMPLETE ===");

      return formattedBalance;
    } catch (error) {
      console.error("=== BALANCE FETCH ERROR ===");
      console.error("Error details:", error);
      console.error(
        "Error stack:",
        error instanceof Error ? error.stack : "No stack trace"
      );
      return null;
    }
  }

  async refreshBalance(): Promise<any> {
    if (!this.state.publicKey) {
      console.log("No public key available for balance refresh");
      return null;
    }

    console.log("=== REFRESHING BALANCE ===");
    console.log("Using public key:", this.state.publicKey);

    const newBalance = await this.getBalance(this.state.publicKey);
    console.log(
      "New raw balance retrieved:",
      JSON.stringify(newBalance, null, 2)
    );
    console.log(
      "Previous balance:",
      JSON.stringify(this.state.balance, null, 2)
    );

    this.state.balance = newBalance;
    this.saveToSession();

    console.log("Balance updated in state and session");
    console.log("=== BALANCE REFRESH COMPLETE ===");
    return newBalance;
  }

  // Balance-based staking functions (no /view endpoints)
  async checkStakingStatus(userPublicKey: string): Promise<boolean> {
    try {
      console.log("=== CHECKING STAKING STATUS ===");
      console.log("User public key:", userPublicKey);

      // Get balance to determine staking status
      const balance = await this.getBalance(userPublicKey);
      console.log("Current raw balance:", JSON.stringify(balance, null, 2));

      // Note: Without /view endpoint, we can't directly check staking status
      // This would need to be implemented based on your staking contract's balance behavior
      // For now, returning false as placeholder
      console.log("Staking status check complete (placeholder implementation)");
      return false;
    } catch (error) {
      console.error("Error checking staking status:", error);
      return false;
    }
  }

  async getStakeInfo(
    userPublicKey: string
  ): Promise<{ amount: string; stakeTime: string; isActive: boolean } | null> {
    try {
      console.log("=== GETTING STAKE INFO ===");
      console.log("User public key:", userPublicKey);

      // Get current balance
      const balance = await this.getBalance(userPublicKey);
      console.log("Current raw balance:", JSON.stringify(balance, null, 2));

      // Note: Without /view endpoint, we can't get detailed stake info
      // This would need to be implemented based on your staking contract's balance behavior
      console.log("Stake info retrieval complete (placeholder implementation)");

      return {
        amount: balance, // Use raw balance
        stakeTime: "0",
        isActive: false,
      };
    } catch (error) {
      console.error("Error getting stake info:", error);
      return null;
    }
  }

  async stakeAPT(): Promise<{
    success: boolean;
    hash?: string;
    error?: string;
  }> {
    if (!this.wallet || !this.state.address) {
      return { success: false, error: "Wallet not connected" };
    }

    try {
      console.log("Initiating stake transaction...");

      const transaction = {
        type: "entry_function_payload",
        function: `${STAKING_CONTRACT.address}::${STAKING_CONTRACT.module}::stake`,
        type_arguments: [],
        arguments: [STAKING_CONTRACT.poolOwner],
      };

      console.log("Transaction payload:", transaction);

      const result = await this.wallet.signAndSubmitTransaction(transaction);
      console.log("Stake transaction result:", result);

      // Wait for transaction confirmation
      await this.waitForTransaction(result.hash);

      // Refresh balance after staking
      await this.refreshBalance();

      return { success: true, hash: result.hash };
    } catch (error: any) {
      console.error("Staking failed:", error);
      return {
        success: false,
        error: error.message || "Failed to stake APT",
      };
    }
  }

  private async waitForTransaction(txHash: string): Promise<void> {
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(
          `${APTOS_TESTNET_CONFIG.url}/transactions/by_hash/${txHash}`
        );

        if (response.ok) {
          const txData = await response.json();
          if (txData.success) {
            console.log("Transaction confirmed:", txHash);
            return;
          } else {
            throw new Error("Transaction failed");
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      } catch (error) {
        console.error("Error waiting for transaction:", error);
        throw error;
      }
    }

    throw new Error("Transaction confirmation timeout");
  }

  async getNetworkInfo() {
    try {
      console.log("Fetching network info from:", APTOS_TESTNET_CONFIG.url);
      const response = await fetch(`${APTOS_TESTNET_CONFIG.url}`);
      const data = await response.json();
      console.log("Network info:", data);
      return data;
    } catch (error) {
      console.error("Failed to fetch network info:", error);
      return null;
    }
  }

  async debugWalletConnection() {
    console.log("=== COMPREHENSIVE WALLET DEBUG INFO ===");
    console.log("Current state:", JSON.stringify(this.state, null, 2));
    console.log("Petra installed:", this.isPetraInstalled());
    console.log(
      "Session storage key exists:",
      !!sessionStorage.getItem("aptosigma_wallet")
    );

    if (this.state.publicKey) {
      console.log("=== BALANCE DEBUG WITH PUBLIC KEY ===");
      console.log("Using public key for balance:", this.state.publicKey);

      try {
        // Test the balance endpoint directly
        const balanceUrl = `${APTOS_TESTNET_CONFIG.url}/accounts/${this.state.publicKey}/balance/0x1::aptos_coin::AptosCoin`;
        console.log("Testing balance endpoint:", balanceUrl);

        const response = await fetch(balanceUrl);
        console.log("Balance endpoint response status:", response.status);
        console.log(
          "Balance endpoint response headers:",
          Object.fromEntries(response.headers.entries())
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Raw balance response:", JSON.stringify(data, null, 2));

          console.log("Raw balance data being used everywhere:", data);
        } else {
          const errorText = await response.text();
          console.log("Balance endpoint error response:", errorText);
        }

        // Also test with address if available
        if (this.state.address && this.state.address !== this.state.publicKey) {
          console.log(
            "=== TESTING WITH ADDRESS (if different from public key) ==="
          );
          const addressBalanceUrl = `${APTOS_TESTNET_CONFIG.url}/accounts/${this.state.address}/balance/0x1::aptos_coin::AptosCoin`;
          console.log("Testing address endpoint:", addressBalanceUrl);

          const addressResponse = await fetch(addressBalanceUrl);
          console.log("Address endpoint status:", addressResponse.status);

          if (addressResponse.ok) {
            const addressData = await addressResponse.json();
            console.log(
              "Address balance response:",
              JSON.stringify(addressData, null, 2)
            );
          }
        }
      } catch (error) {
        console.error("Error during balance debug:", error);
      }
    } else {
      console.log("No public key available for balance testing");
    }

    console.log("=== END COMPREHENSIVE DEBUG INFO ===");
  }

  getState(): WalletState {
    return { ...this.state };
  }

  formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}

export const walletManager = WalletManager.getInstance();
