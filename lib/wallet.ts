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
  balance: any;
  network: string;
}

export const APTOS_TESTNET_CONFIG = {
  chain_id: 190,
  name: "Aptos Testnet",
  url: "https://api.testnet.staging.aptoslabs.com/v1",
};

export const STAKING_CONTRACT = {
  address: "0x4afbef1832e39a9e7f4ca7434bcf216e4d2864f9da4003d2627558928ac30f54",
  module: "flexibleStaking",
  poolOwner:
    "0x4afbef1832e39a9e7f4ca7434bcf216e4d2864f9da4003d2627558928ac30f54",
};

export class WalletManager {
  private static instance: WalletManager;
  private wallet: PetraWallet | null = null;
  private state: WalletState = {
    connected: false,
    address: null,
    publicKey: null,
    balance: null,
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
      // Silent error handling
    }
  }

  private saveToSession() {
    try {
      sessionStorage.setItem("aptosigma_wallet", JSON.stringify(this.state));
    } catch (error) {
      // Silent error handling
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
      this.wallet = (window as any).aptos;
      const response = await this.wallet!.connect();

      const balance = await this.getBalance(response.address);
      console.log("Connect wallet - final balance:", balance);

      this.state = {
        connected: true,
        address: response.address,
        publicKey: response.publicKey,
        balance: balance,
        network: "testnet",
      };

      this.saveToSession();
      return this.state;
    } catch (error) {
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
      balance: null,
      network: "testnet",
    };

    sessionStorage.removeItem("aptosigma_wallet");
  }

  async getBalance(address: string): Promise<any> {
    try {
      const balanceUrl = `${APTOS_TESTNET_CONFIG.url}/accounts/${address}/balance/0x1::aptos_coin::AptosCoin`;
      const response = await fetch(balanceUrl);

      if (!response.ok) {
        if (response.status === 404) {
          console.log("Balance API response (404 - not found):", null);
          return null;
        }
        console.log("Balance API response (error):", null);
        return null;
      }

      const data = await response.json();
      console.log("Balance API response:", data);
      return data;
    } catch (error) {
      console.log("Balance API response (catch error):", null);
      return null;
    }
  }

  async refreshBalance(): Promise<any> {
    if (!this.state.address) {
      console.log("Refresh balance - no address available:", null);
      return null;
    }

    const newBalance = await this.getBalance(this.state.address);
    console.log("Refresh balance result:", newBalance);
    this.state.balance = newBalance;
    this.saveToSession();

    return newBalance;
  }

  async checkContractInitialized(moduleAddress?: string): Promise<boolean> {
    try {
      const contractAddress = moduleAddress || STAKING_CONTRACT.address;

      // Check if the contract has been initialized by trying to access a resource that should exist after initialization
      // We'll check for the StakingPool resource or similar
      const resourceUrl = `${APTOS_TESTNET_CONFIG.url}/accounts/${contractAddress}/resource/${contractAddress}::${STAKING_CONTRACT.module}::StakingPool`;
      const response = await fetch(resourceUrl);

      if (response.ok) {
        const resourceData = await response.json();
        console.log(
          "Contract initialization check - resource found:",
          resourceData
        );
        return true;
      }

      // Alternative check: Look for any resources under the contract address
      const accountUrl = `${APTOS_TESTNET_CONFIG.url}/accounts/${contractAddress}/resources`;
      const accountResponse = await fetch(accountUrl);

      if (accountResponse.ok) {
        const resources = await accountResponse.json();
        console.log("Contract resources:", resources);

        // Check if any staking-related resources exist
        const hasStakingResources = resources.some(
          (resource: any) =>
            resource.type.includes(STAKING_CONTRACT.module) ||
            resource.type.includes("StakingPool") ||
            resource.type.includes("Pool")
        );

        return hasStakingResources;
      }

      console.log("Contract not initialized - no resources found");
      return false;
    } catch (error) {
      console.error("Error checking contract initialization:", error);
      return false;
    }
  }

  async initializeContract(moduleAddress?: string): Promise<{
    success: boolean;
    hash?: string;
    error?: string;
  }> {
    if (!this.wallet || !this.state.address) {
      return { success: false, error: "Wallet not connected" };
    }

    try {
      const contractAddress = moduleAddress || STAKING_CONTRACT.address;

      console.log("Initializing contract at:", contractAddress);

      // Call the initialize function on the contract
      const transaction = {
        type: "entry_function_payload",
        function: `${contractAddress}::${STAKING_CONTRACT.module}::initialize`,
        type_arguments: [],
        arguments: [], // Most initialize functions don't require arguments, but you might need to adjust this
      };

      console.log("Submitting initialization transaction:", transaction);

      const result = await this.wallet.signAndSubmitTransaction(transaction);
      console.log("Initialization transaction submitted:", result);

      await this.waitForTransaction(result.hash);
      console.log("Contract initialized successfully");

      return { success: true, hash: result.hash };
    } catch (error: any) {
      console.error("Contract initialization error:", error);
      return {
        success: false,
        error: error.message || "Failed to initialize contract",
      };
    }
  }

  async ensureContractInitialized(moduleAddress?: string): Promise<{
    success: boolean;
    hash?: string;
    error?: string;
  }> {
    const isInitialized = await this.checkContractInitialized(moduleAddress);

    if (isInitialized) {
      console.log("Contract already initialized");
      return { success: true };
    }

    console.log("Contract not initialized, initializing now...");
    return await this.initializeContract(moduleAddress);
  }

  async checkStakingStatus(
    userAddress: string,
    moduleAddress?: string
  ): Promise<boolean> {
    try {
      const contractAddress = moduleAddress || STAKING_CONTRACT.address;

      // Try to get the user's stake information from the contract
      const resourceUrl = `${APTOS_TESTNET_CONFIG.url}/accounts/${userAddress}/resource/${contractAddress}::${STAKING_CONTRACT.module}::StakeInfo`;
      const response = await fetch(resourceUrl);

      if (response.ok) {
        const stakeData = await response.json();
        return stakeData.data && stakeData.data.amount > 0;
      }

      return false;
    } catch (error) {
      console.error("Error checking staking status:", error);
      return false;
    }
  }

  async getStakeInfo(
    userAddress: string,
    moduleAddress?: string
  ): Promise<{ amount: string; stakeTime: string; isActive: boolean } | null> {
    try {
      const contractAddress = moduleAddress || STAKING_CONTRACT.address;

      // Try to get the user's stake information from the contract
      const resourceUrl = `${APTOS_TESTNET_CONFIG.url}/accounts/${userAddress}/resource/${contractAddress}::${STAKING_CONTRACT.module}::StakeInfo`;
      const response = await fetch(resourceUrl);

      if (response.ok) {
        const stakeData = await response.json();
        return {
          amount: stakeData.data.amount || "0",
          stakeTime: stakeData.data.stake_time || "0",
          isActive: stakeData.data.is_active || false,
        };
      }

      return null;
    } catch (error) {
      console.error("Error getting stake info:", error);
      return null;
    }
  }

  async stakeAPT(moduleAddress?: string): Promise<{
    success: boolean;
    hash?: string;
    error?: string;
  }> {
    if (!this.wallet || !this.state.address) {
      return { success: false, error: "Wallet not connected" };
    }

    try {
      // First, ensure the contract is initialized
      const initResult = await this.ensureContractInitialized(moduleAddress);
      if (!initResult.success) {
        return {
          success: false,
          error: `Contract initialization failed: ${initResult.error}`,
        };
      }

      const contractAddress = moduleAddress || STAKING_CONTRACT.address;

      console.log("Staking APT with contract:", contractAddress);

      const transaction = {
        type: "entry_function_payload",
        function: `${contractAddress}::${STAKING_CONTRACT.module}::stake`,
        type_arguments: [],
        arguments: [STAKING_CONTRACT.poolOwner],
      };

      console.log("Submitting staking transaction:", transaction);

      const result = await this.wallet.signAndSubmitTransaction(transaction);
      console.log("Staking transaction submitted:", result);

      await this.waitForTransaction(result.hash);
      await this.refreshBalance();

      console.log("Staking completed successfully");
      return { success: true, hash: result.hash };
    } catch (error: any) {
      console.error("Staking error:", error);

      // Check if it's still an initialization error
      if (error.message && error.message.includes("E_NOT_INITIALIZED")) {
        return {
          success: false,
          error:
            "Contract is not properly initialized. Please contact the contract owner to initialize the staking pool.",
        };
      }

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
            return;
          } else {
            throw new Error(`Transaction failed: ${JSON.stringify(txData)}`);
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      } catch (error) {
        throw error;
      }
    }

    throw new Error("Transaction confirmation timeout");
  }

  async getNetworkInfo() {
    try {
      const response = await fetch(`${APTOS_TESTNET_CONFIG.url}`);
      const data = await response.json();
      return data;
    } catch (error) {
      return null;
    }
  }

  getState(): WalletState {
    return { ...this.state };
  }

  formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}

export const walletManager = WalletManager.getInstance();
export function useWallet() {
  return walletManager;
}