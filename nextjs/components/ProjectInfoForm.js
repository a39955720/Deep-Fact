import { useEffect, useState } from "react"
import { useMoralis, useWeb3Contract } from "react-moralis"
import { ethers } from "ethers"
import { FraudBlockerAbi } from "../constants"

export default function Home() {
    const { isWeb3Enabled, chainId: chainIdHex, account } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const [error, setError] = useState()
    const [name, setName] = useState("")
    const [link, setLink] = useState("")
    const [description, setDescription] = useState("")

    const freedomDovesAddress = 0xa2470e00f4cdf3270c9e7930a356327412bf166e

    const networks = {
        zircuit: {
            chainId: "0xBF03",
            chainName: "Zircuit",
            nativeCurrency: {
                name: "Zircuit1",
                symbol: "ETH",
                decimals: 18,
            },
            rpcUrls: ["https://zircuit1.p2pify.com/"],
            blockExplorerUrls: ["https://explorer.zircuit.com"],
        },
    }

    const changeNetwork = async ({ networkName, setError }) => {
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
            setError(err.message)
            console.log(error)
        }
    }

    const handleNetworkSwitch = async (networkName) => {
        setError()
        await changeNetwork({ networkName, setError })
    }
    return (
        <div className="flex mt-10">
            {isWeb3Enabled && chainId == "48899" ? (
                <div className="flex justify-center w-full min-h-screen">
                    <div className="w-3/4 mb-10">
                        <div className="bg-red-600 rounded-lg overflow-hidden min-h-[100vh]">
                            <input
                                placeholder="Title"
                                className="border-2 border-blue-500 w-full mt-5 ml-5 mr-5 px-4 py-3 rounded-md focus:outline-none focus:ring focus:border-blue-500"
                                value={name}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                            <textarea
                                placeholder="Text"
                                className="border-2 border-blue-500 w-full h-3/4 mt-10 px-4 py-3 rounded-md focus:outline-none focus:ring focus:border-blue-500"
                                value={description}
                                onChange={(e) => setText(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-start mt-10">
                    <div className="ml-10 text-xl">Please connect to a wallet and switch to Zircuit Testnet.</div>
                    <button
                        onClick={() => {
                            handleNetworkSwitch("zircuit")
                        }}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-10 mt-10"
                    >
                        Switch to Zircuit Testnet
                    </button>
                </div>
            )}
        </div>
    )
}
