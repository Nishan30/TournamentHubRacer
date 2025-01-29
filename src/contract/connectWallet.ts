import {
    requestAccess,
    signTransaction,
    setAllowed,
  } from "@stellar/freighter-api";
  
  /**
   * Checks if the Freighter wallet connection is allowed.
   * @returns {Promise<boolean>} - Returns true if the connection is allowed.
   */
  export const checkConnection = async (): Promise<boolean> => {
    try {
      const isAllowed = await setAllowed();
      return isAllowed;
    } catch (error) {
      console.error("Error checking connection:", error);
      return false;
    }
  };
  
  /**
   * Retrieves the public key of the connected account from Freighter.
   * @returns {Promise<string>} - Returns the public key or throws an error message.
   */
  export const retrievePublicKey = async (): Promise<string> => {
    try {
      const publicKey = await requestAccess();
      return publicKey;
    } catch (error: unknown) {
      if (typeof error === "string") {
        console.error("Error retrieving public key:", error);
        throw new Error(error);
      }
      console.error("Unexpected error:", error);
      throw new Error("An unexpected error occurred while retrieving the public key.");
    }
  };
  
  /**
   * Signs a transaction using Freighter.
   * @param xdr - The transaction XDR to be signed.
   * @param network - The network to use (e.g., "TESTNET" or "PUBLIC").
   * @param signWith - The public key of the account to sign with.
   * @returns {Promise<string>} - Returns the signed transaction XDR or throws an error message.
   */
  export const userSignTransaction = async (
    xdr: string,
    network: string,
    signWith: string
  ): Promise<string> => {
    try {
      const signedTransaction = await signTransaction(xdr, {
        network,
        accountToSign: signWith,
      });
      return signedTransaction;
    } catch (error: unknown) {
      if (typeof error === "string") {
        console.error("Error signing transaction:", error);
        throw new Error(error);
      }
      console.error("Unexpected error:", error);
      throw new Error("An unexpected error occurred while signing the transaction.");
    }
  };
  