"use client";

// Aptos Wallet Standard interfaces
export interface AptosWalletAccount {
  address: string;
  publicKey: Uint8Array;
  chains: string[];
  features: string[];
  label?: string;
  icon?: string;
}

export interface AptosWallet {
  name: string;
  icon: string;
  chains: string[];
  features: string[];
  accounts: AptosWalletAccount[];
  connect(): Promise<AptosWalletAccount[]>;
  disconnect(): Promise<void>;
  signAndSubmitTransaction(transaction: any): Promise<any>;
  signMessage(message: any): Promise<any>;
}

export interface WalletState {
  connected: boolean;
  address: string | null;
  publicKey: string | null;
  balance: string;
  network: string;
}

export const APTOS_TESTNET_CONFIG = {
  chain_id: 2,
  name: "Testnet",
  url: "https://api.testnet.staging.aptoslabs.com/v1",
};

// Helper function to convert Uint8Array to hex string
function uint8ArrayToHex(uint8Array: Uint8Array): string {
  return Array.from(uint8Array)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export class WalletManager {
  private static instance: WalletManager;
  private wallet: AptosWallet | null = null;
  private state: WalletState = {
    connected: false,
    address: null,
    publicKey: null,
    balance: "0",
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

  isAptosWalletInstalled(): boolean {
    if (typeof window === "undefined") return false;

    // Check for Aptos Wallet Standard
    const aptosWallets = (window as any).aptos?.wallets;
    if (aptosWallets && Array.isArray(aptosWallets)) {
      return aptosWallets.some((wallet: any) => wallet.name === "Aptos");
    }

    // Fallback check for legacy Aptos wallet
    return "aptos" in window;
  }

  // Backward compatibility - keep old method name
  isPetraInstalled(): boolean {
    return this.isAptosWalletInstalled();
  }

  private getAptosWallet(): AptosWallet | null {
    if (typeof window === "undefined") return null;

    // Try to get Aptos wallet using Aptos Wallet Standard
    const aptosWallets = (window as any).aptos?.wallets;
    if (aptosWallets && Array.isArray(aptosWallets)) {
      const aptosWallet = aptosWallets.find(
        (wallet: any) => wallet.name === "Aptos"
      );
      if (aptosWallet) return aptosWallet;
    }

    // Fallback to legacy API (will be deprecated)
    if ("aptos" in window) {
      const legacyWallet = (window as any).aptos;
      // Wrap legacy API to match new standard
      return {
        name: "Aptos",
        icon: "",
        chains: ["aptos:testnet"],
        features: [
          "aptos:connect",
          "aptos:disconnect",
          "aptos:signAndSubmitTransaction",
        ],
        accounts: [],
        connect: async () => {
          const response = await legacyWallet.connect();
          const account: AptosWalletAccount = {
            address: response.address,
            publicKey: new Uint8Array(
              Buffer.from(response.publicKey.slice(2), "hex")
            ),
            chains: ["aptos:testnet"],
            features: ["aptos:signAndSubmitTransaction"],
          };
          return [account];
        },
        disconnect: () => legacyWallet.disconnect(),
        signAndSubmitTransaction: (tx: any) =>
          legacyWallet.signAndSubmitTransaction(tx),
        signMessage: (msg: any) => legacyWallet.signMessage(msg),
      };
    }

    return null;
  }

  async connectWallet(): Promise<WalletState> {
    if (!this.isAptosWalletInstalled()) {
      throw new Error(
        "Aptos wallet not installed. Please install Aptos wallet extension."
      );
    }

    try {
      this.wallet = this.getAptosWallet();
      if (!this.wallet) {
        throw new Error("Failed to get Aptos wallet instance");
      }

      console.log("Connecting to wallet:", this.wallet.name);
      const accounts = await this.wallet.connect();

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned from wallet");
      }

      const account = accounts[0];
      console.log("Wallet connection response:", account);
      console.log("Connected address:", account.address);

      // Convert publicKey to hex string for storage
      const publicKeyHex = uint8ArrayToHex(account.publicKey);

      // Get fresh balance after connection
      const balance = await this.getBalance(account.address);
      console.log("Fetched balance:", balance);

      this.state = {
        connected: true,
        address: account.address,
        publicKey: publicKeyHex,
        balance: balance,
        network: "testnet",
      };

      this.saveToSession();
      return this.state;
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    }
  }

  async disconnectWallet(): Promise<void> {
    if (this.wallet) {
      try {
        await this.wallet.disconnect();
      } catch (error) {
        console.error("Error disconnecting wallet:", error);
      }
    }

    this.state = {
      connected: false,
      address: null,
      publicKey: null,
      balance: "0",
      network: "testnet",
    };

    try {
      sessionStorage.removeItem("aptosigma_wallet");
    } catch (error) {
      console.error("Error removing session storage:", error);
    }
  }

  async getBalance(address: string): Promise<string> {
    try {
      console.log("Fetching balance for address:", address);
      console.log("Using API endpoint:", APTOS_TESTNET_CONFIG.url);

      // First, let's check if the account exists
      const accountResponse = await fetch(
        `${APTOS_TESTNET_CONFIG.url}/accounts/${address}`
      );
      console.log("Account response status:", accountResponse.status);

      if (!accountResponse.ok) {
        console.warn(
          "Account not found or API error:",
          accountResponse.status,
          accountResponse.statusText
        );
        return "0.0000";
      }

      const accountData = await accountResponse.json();
      console.log("Account data:", accountData);

      // Now fetch the APT coin resource
      const resourceType = "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>";
      const encodedResourceType = encodeURIComponent(resourceType);
      const resourceUrl = `${APTOS_TESTNET_CONFIG.url}/accounts/${address}/resource/${encodedResourceType}`;
      console.log("Fetching resource from:", resourceUrl);

      const response = await fetch(resourceUrl);
      console.log("Resource response status:", response.status);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(
            "APT CoinStore resource not found - account may not have been initialized with APT"
          );
          return "0.0000";
        }
        console.warn(
          "Failed to fetch balance resource:",
          response.status,
          response.statusText
        );
        return "0.0000";
      }

      const data = await response.json();
      console.log("Balance resource data:", JSON.stringify(data, null, 2));

      // Validate the response structure
      if (
        !data ||
        !data.data ||
        !data.data.coin ||
        typeof data.data.coin.value !== "string"
      ) {
        console.warn("Invalid balance response structure:", data);
        return "0.0000";
      }

      const balanceInOctas = data.data.coin.value;
      console.log("Balance in octas:", balanceInOctas);

      const balance = parseInt(balanceInOctas) / 100000000; // Convert octas to APT
      console.log("Balance in APT:", balance);

      return balance.toFixed(4);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      return "0.0000";
    }
  }

  async refreshBalance(): Promise<string> {
    if (!this.state.address) {
      return "0.0000";
    }

    const newBalance = await this.getBalance(this.state.address);
    this.state.balance = newBalance;
    this.saveToSession();
    return newBalance;
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

  async signAndSubmitTransaction(transaction: any): Promise<any> {
    if (!this.wallet) {
      throw new Error("Wallet not connected");
    }

    try {
      return await this.wallet.signAndSubmitTransaction(transaction);
    } catch (error) {
      console.error("Failed to sign and submit transaction:", error);
      throw error;
    }
  }

  async signMessage(message: any): Promise<any> {
    if (!this.wallet) {
      throw new Error("Wallet not connected");
    }

    try {
      return await this.wallet.signMessage(message);
    } catch (error) {
      console.error("Failed to sign message:", error);
      throw error;
    }
  }

  async debugWalletConnection() {
    console.log("=== WALLET DEBUG INFO ===");
    console.log("Current state:", this.state);
    console.log("Aptos wallet installed:", this.isAptosWalletInstalled());
    console.log(
      "Available wallets:",
      (window as any).aptos?.wallets?.map((w: any) => w.name) || "None"
    );

    if (this.state.address) {
      console.log("Debugging balance for address:", this.state.address);

      // Test different API endpoints
      const endpoints = [
        "https://api.testnet.staging.aptoslabs.com/v1",
        "https://fullnode.testnet.aptoslabs.com/v1",
        "https://api.testnet.aptoslabs.com/v1",
      ];

      for (const endpoint of endpoints) {
        console.log(`\n--- Testing endpoint: ${endpoint} ---`);
        try {
          const accountUrl = `${endpoint}/accounts/${this.state.address}`;
          const accountResponse = await fetch(accountUrl);
          console.log(`Account status: ${accountResponse.status}`);

          if (accountResponse.ok) {
            const accountData = await accountResponse.json();
            console.log(
              "Account sequence number:",
              accountData.sequence_number
            );

            const resourceType =
              "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>";
            const encodedResourceType = encodeURIComponent(resourceType);
            const resourceUrl = `${endpoint}/accounts/${this.state.address}/resource/${encodedResourceType}`;
            const resourceResponse = await fetch(resourceUrl);
            console.log(`Resource status: ${resourceResponse.status}`);

            if (resourceResponse.ok) {
              const resourceData = await resourceResponse.json();
              console.log(
                "APT balance (octas):",
                resourceData.data?.coin?.value
              );
              console.log(
                "APT balance (APT):",
                parseInt(resourceData.data?.coin?.value || "0") / 100000000
              );
            }
          }
        } catch (error) {
          console.error(`Error testing ${endpoint}:`, error);
        }
      }
    }
    console.log("=== END DEBUG INFO ===");
  }

  getState(): WalletState {
    return { ...this.state };
  }

  formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Helper method to check if using legacy API
  isUsingLegacyApi(): boolean {
    if (typeof window === "undefined") return false;
    const aptosWallets = (window as any).aptos?.wallets;
    return !aptosWallets || !Array.isArray(aptosWallets);
  }
}

export const walletManager = WalletManager.getInstance();
