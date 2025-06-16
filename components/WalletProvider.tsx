"use client";

import { PropsWithChildren } from "react";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";
import { toast } from "@/hooks/use-toast";


export function WalletProvider({ children }: PropsWithChildren) {

    return (
        <AptosWalletAdapterProvider
            autoConnect={true}
            dappConfig={{ network: Network.TESTNET }}
            optInWallets={["Petra", "Nightly", "Pontem Wallet", "Mizu Wallet"]}
            onError={(error) => {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: error || "Unknown wallet error",
                });
            }}
        >
            {children}
        </AptosWalletAdapterProvider>
    );
}