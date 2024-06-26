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
    const [showModal_3, setShowModal_3] = useState(false)
    const [results, setResults] = useState("")
    const [error, setError] = useState()
    const [name, setName] = useState("")
    const [link, setLink] = useState("")
    const [submittedProjects, setSubmittedProjects] = useState("")
    const [description, setDescription] = useState("")
    const [currentIndex, setCurrentIndex] = useState("")
    const [_name, setNames] = useState([])
    const [_link, setLinks] = useState([])
    const [_description, setDescriptions] = useState([])
    const [_aiAuditResult, setAiAuditResult] = useState([])
    const [_auditor, setAuditor] = useState([[], []])
    const [_auditorAuditResult, setAuditorAuditResult] = useState([[], []])
    const [isLoading, setIsLoading] = useState(false)
    const abi = ethers.utils.defaultAbiCoder
    const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY, dangerouslyAllowBrowser: true })
    const cards = []
    const cards1 = []

    const contractAddress = "0x3d19963555e8eE7B0dcc81eb442E7DCED5e8d12b"

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

    // async function stake() {
    //     const provider = new ethers.providers.Web3Provider(window.ethereum)
    //     const signer = provider.getSigner()
    //     const contract = new ethers.Contract(contractAddress, FraudBlockerAbi, signer)
    //     const valueInWei = ethers.utils.parseEther("0.1")
    //     try {
    //         const transactionResponse = await contract.stakeAsAuditor(
    //             { value: valueInWei },
    //         )
    //         const str = "Successfully submitted Project."
    //         await listenForTransactionMine(transactionResponse, provider, str)
    //     } catch (error) {
    //         setShowModal_1(true)
    //         setResults(error.message)
    //         setIsLoading(false)
    //     }
    // }

    async function getSubmittedProjects() {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const contract = new ethers.Contract(contractAddress, FraudBlockerAbi, provider)
        try {
            const _submittedProjects = await contract.getSubmittedProjects(account)
            setSubmittedProjects(_submittedProjects)
        } catch (error) {
            console.error("Error:", error)
        }
    }

    async function getProjectData() {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const contract = new ethers.Contract(contractAddress, FraudBlockerAbi, provider)
        try {
            const names = []
            const links = []
            const descriptions = []
            const aiAuditResults = []
            const auditors = [[], []]
            const auditorAuditResults = [[], []]
            for (let i = 0; i < submittedProjects.length; i++) {
                const _id = submittedProjects[i]
                const projectData = await contract.getProjectData(_id)
                const decodedName = abi.decode(["string"], projectData[2])
                const decodedLink = abi.decode(["string"], projectData[3])
                const decodedDescription = abi.decode(["string"], projectData[4])
                const decodedAiAuditResult = abi.decode(["string"], projectData[5])
                names[i] = decodedName.toString()
                links[i] = decodedLink.toString()
                descriptions[i] = decodedDescription.toString()
                aiAuditResults[i] = decodedAiAuditResult.toString()
                for (let j = 0; j < 3; j++) {
                    auditors[i][j] = projectData[6][j].toString()
                    if (projectData[6][j].toString() != "0x0000000000000000000000000000000000000000") {
                        const decodedAuditorAuditResult = abi.decode(["string"], projectData[7][j])
                        auditorAuditResults[i][j] = decodedAuditorAuditResult.toString()
                    }
                }
            }
            setNames(names)
            setLinks(links)
            setDescriptions(descriptions)
            setAiAuditResult(aiAuditResults)
            setAuditor(auditors)
            setAuditorAuditResult(auditorAuditResults)
        } catch (error) {
            console.error("Error:", error)
        }
    }

    const handleClick = (i) => {
        setCurrentIndex(i)
        setShowModal_3(true)
    }

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

    async function updateUI() {
        getSubmittedProjects()
        getProjectData()
    }

    useEffect(() => {
        updateUI()
    }, [isWeb3Enabled, submittedProjects, showModal_1, showModal_2])

    for (let i = 0; i < submittedProjects.length; i++) {
        cards.push(
            <div
                className="w-full mt-5 bg-white rounded-lg shadow-md p-4 cursor-pointer transition duration-300 ease-in-out transform hover:bg-gray-200 hover:shadow-lg"
                onClick={() => handleClick(i)}
            >
                <div class="flex flex-col">
                    <h3 class="text-xl font-semibold">{_name[i]}</h3>
                    <p class="text-gray-600 mt-2">
                        {_description[i] && _description[i].length > 200
                            ? _description[i].slice(0, 200) + "..."
                            : _description[i]}
                    </p>
                </div>
            </div>,
        )
    }

    cards1.push(
        <div className="bg-gray-200 mt-5 rounded-lg shadow-md p-4 w-full">
            <div class="flex flex-col">
                <p class="text-gray-500 font-semibold text-xl">AI audit results</p>
                <p class="text-black text-base mt-3 break-words">{_aiAuditResult[currentIndex]}</p>
            </div>
        </div>,
    )
    for (let i = 0; i < 3; i++) {
        if (_auditor[currentIndex] && _auditor[currentIndex][i] == "0x0000000000000000000000000000000000000000") {
            break
        } else if (_auditor[currentIndex]) {
            cards1.push(
                <div className="bg-gray-200 mt-5 rounded-lg shadow-md p-4 w-full">
                    <div class="flex flex-col">
                        <p class="text-gray-500 font-semibold text-xl">{_auditor[currentIndex][i]}</p>
                        <p class="text-black text-base mt-3 break-words">{_auditorAuditResult[currentIndex][i]}</p>
                    </div>
                </div>,
            )
        }
    }

    return (
        <div className="flex mt-10">
            {isWeb3Enabled && chainId == "48899" ? (
                <div className="flex justify-center w-full min-h-screen">
                    <div className="w-5/6 mb-10">
                        {showModal_1 && (
                            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
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
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                                            onClick={() => submitProject()}
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
                        {showModal_3 && (
                            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto z-50">
                                <div className="bg-white p-5 rounded w-3/4 bg-gray-200 h-screen overflow-y-scroll">
                                    <button
                                        className="bg-white hover:bg-gray-200 text-black font-bold py-2 px-4 rounded"
                                        style={{ float: "right" }}
                                        onClick={() => setShowModal_3(false)}
                                    >
                                        X
                                    </button>
                                    <h1 class="text-3xl font-semibold mt-10 ml-5 mb-5">{_name[currentIndex]}</h1>
                                    <a href={_link[currentIndex]} className="text-blue-500 text-xl ml-5">
                                        {_link[currentIndex]}
                                    </a>
                                    <p
                                        class="text-black text-xl mt-5 ml-5 break-words"
                                        style={{ whiteSpace: "pre-wrap" }}
                                    >
                                        {_description[currentIndex]}
                                    </p>
                                    <div className="flex flex-wrap mt-5">{cards1}</div>
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
                        <h2 className="items-center mt-10 text-4xl font-bold">History</h2>
                        <div className="flex flex-wrap mt-5">{cards}</div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-start mt-10 min-h-screen">
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
