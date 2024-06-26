import { useEffect, useState } from "react"
import { useMoralis, useWeb3Contract } from "react-moralis"
import { ethers } from "ethers"
import { FraudBlockerAbi } from "../constants"
import OpenAI from "openai"

export default function Home() {
    const { isWeb3Enabled, chainId: chainIdHex, account } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const [showModal_1, setShowModal_1] = useState(false)
    const [showModal_2, setShowModal_2] = useState(false)
    const [results, setResults] = useState("")
    const [error, setError] = useState()
    const [name, setName] = useState("")
    const [link, setLink] = useState("")
    // const [submittedProjects, setSubmittedProjects] = useState("")
    const [description, setDescription] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const abi = ethers.utils.defaultAbiCoder
    const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY, dangerouslyAllowBrowser: true })
    // const cards = []

    const contractAddress = "0xf47b94232b16ab794915ccccfe4aff930cca15ff"

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

    async function submitProject() {
        setIsLoading(true)
        setShowModal_2(false)
        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content:
                        "You are an AI assistant that helps to review investment projects for potential fraud. Analyze the following project description and provide a detailed assessment including potential red flags and overall risk level. Within 200 words.",
                },
                {
                    role: "user",
                    content: description,
                },
            ],
            model: "gpt-3.5-turbo",
            max_tokens: 200,
        })
        const abiEncodeName = abi.encode(["string"], [name])
        const abiEncodeLink = abi.encode(["string"], [link])
        const abiEncodeDescription = abi.encode(["string"], [description])
        const abiEncodeCompletion = abi.encode(["string"], [completion.choices[0].message.content])
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const contract = new ethers.Contract(contractAddress, FraudBlockerAbi, signer)
        const valueInWei = ethers.utils.parseEther("0.004")
        try {
            const transactionResponse = await contract.submitProject(
                abiEncodeName,
                abiEncodeLink,
                abiEncodeDescription,
                abiEncodeCompletion,
                { value: valueInWei },
            )
            const str = "Successfully submitted Project."
            await listenForTransactionMine(transactionResponse, provider, str)
        } catch (error) {
            setShowModal_1(true)
            setResults(error.message)
            setIsLoading(false)
        }
    }

    // async function getSubmittedProjects() {
    //     const provider = new ethers.providers.Web3Provider(window.ethereum)
    //     const contract = new ethers.Contract(contractAddress, FraudBlockerAbi, provider)
    //     try {
    //         const _submittedProjects = (await contract.getSubmittedProjects(account)).toString()
    //         setSubmittedProjects(_submittedProjects)
    //     } catch (error) {
    //         console.error("Error:", error)
    //     }
    // }

    function listenForTransactionMine(transactionResponse, provider, str) {
        return new Promise((resolve, reject) => {
            try {
                provider.once(transactionResponse.hash, (transactionReceipt) => {
                    setResults(str)
                    setShowModal_1(true)
                    setIsLoading(false)
                    resolve()
                })
            } catch (error) {
                setResults(error)
                setShowModal_1(true)
                setIsLoading(false)
                reject(error)
            }
        })
    }

    // for (let i = 0; i < getSubmittedProjects().length; i++) {
    //     cards.push(
    //         <div
    //             className="w-full mt-5 bg-white rounded-lg shadow-md p-4 cursor-pointer transition duration-300 ease-in-out transform hover:bg-gray-200 hover:shadow-lg"
    //             onClick={() => handleClick(i)}
    //         >
    //             <div class="flex flex-col">
    //                 <h3 class="text-xl font-semibold">{getSubmittedProjects()[i][0]}</h3>
    //                 {/* <p class="text-gray-600 mt-2">{_content[i].substring(0, 200) + "..."}</p> */}
    //             </div>
    //         </div>,
    //     )
    // }

    return (
        <div className="flex mt-10">
            {isWeb3Enabled && chainId == "48899" ? (
                <div className="flex justify-center w-full min-h-screen">
                    <div className="w-5/6 mb-10">
                        {showModal_1 && (
                            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                <div className="bg-white p-5 rounded">
                                    <h2 className="text-2xl mb-4">{results}</h2>
                                    <div className="flex mt-4 justify-center">
                                        <button
                                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                            onClick={() => setShowModal_1(false)}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {showModal_2 && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                <div className="bg-gray-700 p-8 rounded-lg max-w-md items-center text-white">
                                    <div className="flex flex-col justify-center items-center mb-4">
                                        <span className="text-red-500 text-4xl">⚠</span>
                                        <h3 className="text-2xl font-bold">Disclaimer</h3>
                                    </div>
                                    <p className="mb-4 text-yellow-300">
                                        Please note that the audit results generated by our experts may not be 100%
                                        accurate.
                                    </p>
                                    <p className="mb-6 text-yellow-300">
                                        We recommend conducting additional research before making any investment
                                        decisions.
                                    </p>
                                    <div className="flex justify-center space-x-10 items-center">
                                        <button
                                            onClick={() => submitProject(false)}
                                            className="bg-yellow-400 text-black px-4 py-2 items-center rounded hover:bg-yellow-500"
                                        >
                                            Continue
                                        </button>
                                        <button
                                            onClick={() => setShowModal_2(false)}
                                            className="bg-yellow-400 text-black px-4 py-2 items-center rounded hover:bg-yellow-500"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="bg-red-600 rounded-lg overflow-hidden min-h-[80vh] p-10 flex flex-col">
                            <input
                                placeholder="Project Name"
                                className="border-2 border-blue-500 w-full mt-5 px-4 py-3 rounded-md focus:outline-none focus:ring focus:border-blue-500"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <input
                                placeholder="Project Link"
                                className="border-2 border-blue-500 w-full mt-10 px-4 py-3 rounded-md focus:outline-none focus:ring focus:border-blue-500"
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                            />
                            <textarea
                                placeholder="Description"
                                className="border-2 border-blue-500 w-full flex-grow mt-10 px-4 py-3 rounded-md focus:outline-none focus:ring focus:border-blue-500"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                            <button
                                className="bg-blue-500 hover:bg-blue-700 text-white mt-10 mb-5 font-bold py-2 px-4 rounded"
                                onClick={() => setShowModal_2(true)}
                            >
                                {isLoading ? (
                                    <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                                ) : (
                                    "Submit"
                                )}
                            </button>
                        </div>
                        {/* <div className="flex flex-wrap mt-5">{cards}</div> */}
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
