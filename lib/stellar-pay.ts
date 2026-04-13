/**
 * Stellar Payment Helper
 * Handles sending XLM payments on Stellar testnet via Freighter wallet
 * Falls back to manual tx hash input if Freighter is not available
 */

declare global {
  interface Window {
    freighterApi?: {
      isConnected: () => Promise<boolean>;
      getPublicKey: () => Promise<string>;
      signTransaction: (xdr: string, opts?: { networkPassphrase?: string }) => Promise<string>;
      getNetwork: () => Promise<string>;
    };
  }
}

export interface FreighterStatus {
  installed: boolean;
  connected: boolean;
  publicKey: string | null;
  network: string | null;
}

/**
 * Check if Freighter wallet extension is available and connected
 */
export async function checkFreighter(): Promise<FreighterStatus> {
  if (typeof window === 'undefined' || !window.freighterApi) {
    return { installed: false, connected: false, publicKey: null, network: null };
  }

  try {
    const connected = await window.freighterApi.isConnected();
    if (!connected) {
      return { installed: true, connected: false, publicKey: null, network: null };
    }

    const publicKey = await window.freighterApi.getPublicKey();
    let network: string | null = null;
    try {
      network = await window.freighterApi.getNetwork();
    } catch {
      // getNetwork may not be available in older versions
    }

    return { installed: true, connected: true, publicKey, network };
  } catch {
    return { installed: true, connected: false, publicKey: null, network: null };
  }
}

/**
 * Build a Stellar Laboratory URL for sending a payment
 * This is the manual fallback when Freighter is not available
 */
export function buildStellarLabPaymentUrl(
  destination: string,
  amount: string,
  memo?: string
): string {
  const base = 'https://laboratory.stellar.org/#txbuilder';
  const params = new URLSearchParams({
    network: 'test',
  });
  // Lab URL with testnet pre-selected — user will need to fill in details
  return `${base}?${params.toString()}`;
}

/**
 * Build a direct Stellar Expert link to check a transaction
 */
export function buildTxExplorerUrl(txHash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
}

/**
 * Shorten a Stellar address for display
 */
export function shortenAddress(address: string): string {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}
