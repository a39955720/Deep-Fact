// networkUtils.js

export const networks = {
    zircuit: {
        chainId: "0xBF03",
        chainName: "Zircuit",
        nativeCurrency: {
            name: "Zircuit",
            symbol: "ETH",
            decimals: 18,
        },
        rpcUrls: ["https://zircuit1.p2pify.com/"],
        blockExplorerUrls: ["https://explorer.zircuit.com"],
    },
    optimism: {
        chainId: "0xaa37dc",
        chainName: "Optimism",
        nativeCurrency: {
            name: "Optimism",
            symbol: "ETH",
            decimals: 18,
        },
        rpcUrls: ["https://sepolia.optimism.io"],
        blockExplorerUrls: ["https://sepolia-optimistic.etherscan.io"],
    },
}

export const changeNetwork = async ({ networkName, setError }) => {
    try {
        if (!window.ethereum) throw new Error("No crypto wallet found")
        await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
                {
                    ...networks[networkName],
                },
            ],
        })
    } catch (err) {
        if (setError) setError(err.message)
        console.log(err)
    }
}

export const handleNetworkSwitch = async (networkName, setError) => {
    if (setError) setError()
    await changeNetwork({ networkName, setError })
}