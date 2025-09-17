import { ref, readonly } from 'vue';
import Web3Modal from 'web3modal';
import { ethers } from 'ethers';
import axios from 'axios'; // Make sure axios is imported here

// --- Non-reactive, module-level variables for the instances ---
let web3ModalInstance = null;
let provider = null;
let signer = null;

// --- Reactive state, kept simple and clean ---
const account = ref(null);
const isConnected = ref(false);

// --- Provider Options ---
const providerOptions = {
  /* future wallet integrations */
};

const initWeb3Modal = () => {
    if (!web3ModalInstance) {
        web3ModalInstance = new Web3Modal({
            cacheProvider: true,
            providerOptions,
            theme: 'dark',
        });
    }
};

const subscribeToProviderEvents = (instance) => {
    instance.on("accountsChanged", (accounts) => {
        console.log("Event: accountsChanged", accounts);
        account.value = accounts[0] || null;
        if (!accounts[0]) {
            disconnectWallet();
        }
    });

    instance.on("chainChanged", () => {
        console.log("Event: chainChanged");
        // Reload to reconnect with the new chain info.
        window.location.reload();
    });

    instance.on("disconnect", () => {
        console.log("Event: disconnect");
        disconnectWallet();
    });
};

const loginAndFetchUser = async (userAccount) => {
    if (!userAccount) return null; // Return null on failure
    try {
        console.log(`Calling backend login for account: ${userAccount}`);
        const response = await axios.post('http://localhost:3000/api/auth/login', {
            walletAddress: userAccount
        });
        console.log('Backend login response:', response.data);
        return response.data.user; // Return the user object
    } catch (error) {
        console.error('Error calling backend login API:', error);
        return null; // Return null on failure
    }
};

const connectWallet = async () => {
    initWeb3Modal();
    try {
        const instance = await web3ModalInstance.connect();
        subscribeToProviderEvents(instance);
        
        provider = new ethers.providers.Web3Provider(instance);
        signer = provider.getSigner();
        
        const userAccount = await signer.getAddress();
        account.value = userAccount;
        
        // Login to backend and get user data
        const user = await loginAndFetchUser(userAccount);
        
        if (user) {
            isConnected.value = true;
            return user; // Return the full user object on success
        } else {
            // If backend login fails, treat it as a connection failure
            await disconnectWallet();
            return null;
        }

    } catch (e) {
        console.error("Connection error:", e);
        disconnectWallet();
        return null;
    }
};

const disconnectWallet = async () => {
    if (web3ModalInstance) {
        web3ModalInstance.clearCachedProvider();
    }
    // No need to unsubscribe, a new instance will be created on next connect
    provider = null;
    signer = null;
    account.value = null;
    isConnected.value = false;
};

// --- The Composable that exposes the functionality ---
export function useWeb3() {

    /*
    // Auto-connect on initial load if provider is cached - DISABLED
    if (typeof window !== 'undefined' && !web3ModalInstance && localStorage.getItem("WEB3_CONNECT_CACHED_PROVIDER")) {
        console.log("Cached provider found, attempting auto-connect...");
        setTimeout(connectWallet, 100);
    }
    */

    return {
        connectWallet,
        disconnectWallet,
        account: readonly(account),
        isConnected: readonly(isConnected),
    };
} 