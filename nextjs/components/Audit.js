import { useEffect, useState } from "react"
import { useMoralis, useWeb3Contract } from "react-moralis"
import { ethers } from "ethers"
import { FraudBlockerAbi } from "../constants"
import { handleNetworkSwitch, networks } from "./networkUtils"
import Link from "next/link"

export default function Audit() {
    const { isWeb3Enabled, chainId: chainIdHex, account } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const [isAuditor, setIsAuditor] = useState(false)
    const [showModal_1, setShowModal_1] = useState(false)
    const [showModal_2, setShowModal_2] = useState(false)
    const [showModal_3, setShowModal_3] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [currentIndex, setCurrentIndex] = useState("")
    const [auditReport, setAuditReport] = useState("")
    const [results, setResults] = useState("")
    const [totalProject, setTotalProject] = useState("")
    const [totoalPendingProject, setTotoalPendingProject] = useState([])
    const [name, setName] = useState([])
    const [link, setLink] = useState([])
    const [description, setDescription] = useState([])
    const abi = ethers.utils.defaultAbiCoder
    const cards = []
    const contractAddress = "0x3d19963555e8eE7B0dcc81eb442E7DCED5e8d12b"

    async function getIsAuditor() {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const contract = new ethers.Contract(contractAddress, FraudBlockerAbi, provider)
        try {
            const _isAuditor = await contract.getIsAuditor(account)
            setIsAuditor(_isAuditor)
        } catch (error) {
            console.error("Error:", error)
        }
    }

    async function getTotalProject() {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const contract = new ethers.Contract(contractAddress, FraudBlockerAbi, provider)
        try {
            const _totalProject = await contract.getTotalProject()
            setTotalProject(_totalProject)
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
            let _totalPendingProject = 0

            for (let i = 0; i < totalProject; i++) {
                const projectData = await contract.getProjectData(i)
                if (projectData[8] == 0) {
                    const decodedName = abi.decode(["string"], projectData[2])
                    const decodedLink = abi.decode(["string"], projectData[3])
                    const decodedDescription = abi.decode(["string"], projectData[4])

                    names[i] = decodedName.toString()
                    links[i] = decodedLink.toString()
                    descriptions[i] = decodedDescription.toString()
                    _totalPendingProject++
                }
            }
            setName(names)
            setLink(links)
            setDescription(descriptions)
            setTotoalPendingProject(_totalPendingProject)
        } catch (error) {
            console.error("Error:", error)
        }
    }

    async function stake() {
        setIsLoading(true)
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const contract = new ethers.Contract(contractAddress, FraudBlockerAbi, signer)
        const valueInWei = ethers.utils.parseEther("0.1")
        try {
            const transactionResponse = await contract.stakeAsAuditor({ value: valueInWei })
            const str = "Successfully staked"
            await listenForTransactionMine(transactionResponse, provider, str)
        } catch (error) {
            setShowModal_1(true)
            setResults(error.message)
            setIsLoading(false)
        }
    }

    async function revokeAndWithdrawStake() {
        setIsLoading(true)
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const contract = new ethers.Contract(contractAddress, FraudBlockerAbi, signer)
        try {
            const transactionResponse = await contract.revokeAndWithdrawStake()
            const str = "Successfully revoked"
            await listenForTransactionMine(transactionResponse, provider, str)
        } catch (error) {
            setShowModal_1(true)
            setResults(error.message)
            setIsLoading(false)
        }
    }

    async function auditProject(currentIndex) {
        setIsLoading(true)
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const contract = new ethers.Contract(contractAddress, FraudBlockerAbi, signer)
        const abiEncodeAuditReport = abi.encode(["string"], [auditReport])
        try {
            const transactionResponse = await contract.auditProject(currentIndex, abiEncodeAuditReport)
            const str = "Successfully audited"
            await listenForTransactionMine(transactionResponse, provider, str)
        } catch (error) {
            setShowModal_1(true)
            setResults(error.message)
            setIsLoading(false)
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
                    setShowModal_2(true)
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
        getIsAuditor()
        getTotalProject()
        getProjectData()
    }

    useEffect(() => {
        updateUI()
    }, [isWeb3Enabled,totalProject, isAuditor, account])

    for (let i = 0; i < totoalPendingProject; i++) {
        cards.push(
            <div
                className="w-full mt-5 bg-white rounded-lg shadow-md p-4 cursor-pointer transition duration-300 ease-in-out transform hover:bg-gray-200 hover:shadow-lg"
                onClick={() => handleClick(i)}
            >
                <div class="flex flex-col">
                    <h3 class="text-xl font-semibold " style={{ color: "black" }}>
                        {name[i]}
                    </h3>
                    <p class="text-gray-600 mt-2">
                        {description[i] && description[i].length > 200
                            ? description[i].slice(0, 200) + "..."
                            : description[i]}
                    </p>
                </div>
            </div>,
        )
    }

    return (
        <div className="flex mt-5">
            {isWeb3Enabled && chainId == "48899" ? (
                <div className="flex justify-center w-full min-h-screen">
                    {showModal_1 && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                            <div className="bg-white p-5 rounded">
                                <h2 className="text-2xl mb-4">{results}</h2>
                                <div className="flex mt-4 justify-center">
                                    <button
                                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                        onClick={() => {
                                            setShowModal_1(false)
                                        }}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {showModal_2 && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                            <div className="bg-white p-5 rounded">
                                <h2 className="text-2xl mb-4">{results}</h2>
                                <div className="flex mt-4 justify-center">
                                    <button
                                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                        onClick={() => {
                                            setShowModal_2(false)
                                            window.location.reload()
                                        }}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {showModal_3 && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto z-40">
                            <div className="bg-white p-5 rounded w-3/4 bg-gray-200 h-screen overflow-y-scroll">
                                <button
                                    className="bg-white hover:bg-gray-200 text-black font-bold py-2 px-4 rounded"
                                    style={{ float: "right" }}
                                    onClick={() => setShowModal_3(false)}
                                >
                                    X
                                </button>
                                <h1 class="text-3xl font-semibold mt-10 ml-5 mb-5" style={{ color: "black" }}>
                                    {name[currentIndex]}
                                </h1>
                                <a href={link[currentIndex]} className="text-blue-500 text-xl ml-5">
                                    {link[currentIndex]}
                                </a>
                                <p class="text-black text-xl mt-5 ml-5 break-words" style={{ whiteSpace: "pre-wrap" }}>
                                    {description[currentIndex]}
                                </p>
                                <textarea
                                    placeholder="Audit Report"
                                    className="border-2 border-blue-500 h-1/3 w-full flex-grow mt-10 px-4 py-3 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition duration-300"
                                    value={auditReport}
                                    onChange={(e) => setAuditReport(e.target.value)}
                                    style={{ color: "black" }}
                                />
                                <button
                                    className="bg-gradient-to-r w-full from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white mt-10 mb-5 font-bold py-2 px-4 rounded-full shadow-lg transition duration-300"
                                    onClick={() => auditProject(currentIndex)}
                                >
                                    {isLoading ? (
                                        <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                                    ) : (
                                        "Submit"
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                    {isAuditor ? (
                        <div className="container mx-auto p-4">
                            <button
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded mr-10 w-full h-12"
                                onClick={() => revokeAndWithdrawStake()}
                            >
                                {isLoading ? (
                                    <div className="animate-spin bg-blue-600 spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                                ) : (
                                    "Revoke and withdraw stake"
                                )}
                            </button>
                            <Link href="/vote" legacyBehavior>
                                <a className="block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded mt-5 mr-10 w-full h-12 text-center">
                                    Vote
                                </a>
                            </Link>
                            <div className="flex flex-wrap mt-5">{cards}</div>
                        </div>
                    ) : (
                        <div>
                            <h1 className="text-4xl font-bold mb-6">Welcome to DeepFact Auditor Page</h1>

                            <p className="text-xl mb-8 text-gray-600">
                                Contribute to the Web3 communities to make the world better !
                            </p>

                            <button
                                className="bg-blue-600 hover:bg-gray-300 text-white font-semibold py-2 px-4 rounded shadow"
                                onClick={() => stake()}
                            >
                                {isLoading ? (
                                    <div className="animate-spin bg-blue-600 spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                                ) : (
                                    "Stake 0.1 ETH and Begin to Earn"
                                )}
                            </button>

                            <p className="mt-8 text-sm text-gray-500">
                                See the{" "}
                                <a href="#" className="text-blue-500 hover:underline">
                                    auditor regulations
                                </a>{" "}
                                before you started !
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-start mt-10 min-h-screen">
                    <div className="ml-10 text-xl">Please connect to a wallet and switch to Zircuit Testnet.</div>
                    <button
                        onClick={() => {
                            handleNetworkSwitch("zircuit", setError)
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
