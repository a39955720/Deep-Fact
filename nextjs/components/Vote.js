import { useEffect, useState } from "react"
import { useMoralis, useWeb3Contract } from "react-moralis"
import { ethers } from "ethers"
import { DeepFactAbi, ZircuitContractAddress, OptimismContractAddress } from "../constants"
import { handleNetworkSwitch, networks } from "./networkUtils"

export default function Vote() {
    const { isWeb3Enabled, chainId: chainIdHex, account } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const [isAuditor, setIsAuditor] = useState(false)
    const [showModal_1, setShowModal_1] = useState(false)
    const [showModal_2, setShowModal_2] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [results, setResults] = useState("")
    const [totalProposal, setTotalProposal] = useState("")
    const [totoalPendingProposal, setTotoalPendingProposal] = useState("")
    const [proposalId, setProposalId] = useState([])
    const [projectId, setProjectId] = useState([])
    const [reportedAuditor, setReportedAuditor] = useState([])
    const [currentIndex, setCurrentIndex] = useState("")
    const [startTime, setStartTime] = useState([])
    const [yesVotes, setYesVotes] = useState([])
    const [noVotes, setNoVotes] = useState([])
    const [name, setName] = useState([])
    const [link, setLink] = useState([])
    const [_reportedAuditor, setReportedAuditors] = useState([])
    const [auditResult, setAuditResult] = useState([])
    const [description, setDescription] = useState([])
    const abi = ethers.utils.defaultAbiCoder
    const cards = []

    const getContractAddress = () => {
        switch (chainId) {
            case 48899:
                return ZircuitContractAddress
            case 11155420:
                return OptimismContractAddress
            default:
                return null
        }
    }

    const contractAddress = getContractAddress()

    async function getIsAuditor() {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const contract = new ethers.Contract(contractAddress, DeepFactAbi, provider)
            const _isAuditor = await contract.getIsAuditor(account)
            setIsAuditor(_isAuditor)
        } catch (error) {
            console.error("Error:", error)
        }
    }

    async function getTotalProposal() {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const contract = new ethers.Contract(contractAddress, DeepFactAbi, provider)
            const _totalProposal = await contract.getTotalProposal()
            setTotalProposal(_totalProposal)
        } catch (error) {
            console.error("Error:", error)
        }
    }

    async function getProposalInfo() {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const contract = new ethers.Contract(contractAddress, DeepFactAbi, provider)
            const _proposalId = []
            const _projectId = []
            const _reportedAuditor = []
            const _startTime = []
            const _yesVotes = []
            const _noVotes = []
            let _totoalPendingProposal = 0
            for (let i = 0; i < totalProposal; i++) {
                const totalProposalInfo = await contract.getProposalInfo(i)
                if (totalProposalInfo[6] == 0) {
                    _proposalId[i] = totalProposalInfo[0]
                    _projectId[i] = totalProposalInfo[1]
                    _reportedAuditor[i] = totalProposalInfo[2]
                    _startTime[i] = totalProposalInfo[3]
                    _yesVotes[i] = totalProposalInfo[4]
                    _noVotes[i] = totalProposalInfo[5]
                    _totoalPendingProposal++
                }
            }
            setTotoalPendingProposal(_totoalPendingProposal)
            setProposalId(_proposalId)
            setProjectId(_projectId)
            setReportedAuditor(_reportedAuditor)
            setStartTime(_startTime)
            setYesVotes(_yesVotes)
            setNoVotes(_noVotes)
        } catch (error) {
            console.error("Error:", error)
        }
    }

    async function getProjectData() {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const contract = new ethers.Contract(contractAddress, DeepFactAbi, provider)
            const names = []
            const links = []
            const descriptions = []
            const reportedAuditors = []
            const auditResults = []

            for (let i = 0; i < totoalPendingProposal; i++) {
                const projectData = await contract.getProjectData(projectId[i])
                const decodedName = abi.decode(["string"], projectData[2])
                const decodedLink = abi.decode(["string"], projectData[3])
                const decodedDescription = abi.decode(["string"], projectData[4])
                const decodedAuditResult = abi.decode(["string"], projectData[7][reportedAuditor[i]])

                reportedAuditors[i] = []
                auditResults[i] = []

                names[i] = decodedName.toString()
                links[i] = decodedLink.toString()
                descriptions[i] = decodedDescription.toString()
                auditResults[i] = decodedAuditResult.toString()
                reportedAuditors[i] = projectData[6][reportedAuditor[i]].toString()
            }
            setName(names)
            setLink(links)
            setDescription(descriptions)
            setReportedAuditors(reportedAuditors)
            setAuditResult(auditResults)
        } catch (error) {
            console.error("Error:", error)
        }
    }

    async function stake() {
        setIsLoading(true)
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const contract = new ethers.Contract(contractAddress, DeepFactAbi, signer)
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

    async function voteOnProposal(yesOrNo) {
        setIsLoading(true)
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const contract = new ethers.Contract(contractAddress, DeepFactAbi, signer)
        try {
            const transactionResponse = await contract.voteOnProposal(proposalId[(currentIndex, yesOrNo)])
            const str = "Successfully voted"
            await listenForTransactionMine(transactionResponse, provider, str)
        } catch (error) {
            setShowModal_1(true)
            setResults(error.message)
            setIsLoading(false)
        }
    }

    const handleClick = (i) => {
        setCurrentIndex(i)
        setShowModal_2(true)
    }

    function listenForTransactionMine(transactionResponse, provider, str) {
        return new Promise((resolve, reject) => {
            try {
                provider.once(transactionResponse.hash, (transactionReceipt) => {
                    setResults(str)
                    setshowModal_1(true)
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
        getTotalProposal()
        getProposalInfo()
        getProjectData()
    }

    useEffect(() => {
        updateUI()
    }, [isWeb3Enabled, isAuditor, account, totalProposal])

    for (let i = 0; i < totoalPendingProposal; i++) {
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
            {(isWeb3Enabled && chainId == "48899") || chainId == "11155420" ? (
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
                        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto z-40">
                            <div className="bg-white p-5 rounded w-3/4 bg-gray-200 h-screen overflow-y-scroll">
                                <button
                                    className="bg-white hover:bg-gray-200 text-black font-bold py-2 px-4 rounded"
                                    style={{ float: "right" }}
                                    onClick={() => setShowModal_2(false)}
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
                                <div className="w-full mt-5 bg-white rounded-lg shadow-md p-4 cursor-pointer transition duration-300 ease-in-out transform hover:bg-gray-200 hover:shadow-lg">
                                    <p class="text-gray-500 font-semibold text-xl">
                                        {_reportedAuditor[currentIndex]}
                                    </p>
                                    <p class="text-black text-base mt-3 break-words">
                                        {auditResult[currentIndex]}
                                    </p>
                                </div>
                                <p class="text-black text-xl mt-5 ml-5 break-words" style={{ whiteSpace: "pre-wrap" }}>
                                    Do you think this response is incorrect or random answer?
                                </p>
                                <button
                                    className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white ml-5 mt-10 mb-5 font-bold py-2 px-4 rounded-full shadow-lg transition duration-300"
                                    onClick={() => voteOnProposal(1)}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                                    ) : (
                                        "Yes"
                                    )}
                                </button>
                                <button
                                    className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white ml-5 mt-10 mb-5 font-bold py-2 px-4 rounded-full shadow-lg transition duration-300"
                                    onClick={() => voteOnProposal(0)}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                                    ) : (
                                        "No"
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                    {isAuditor ? (
                        <div className="container mx-auto p-4">
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
                                disabled={isLoading}
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
                    <div className="ml-10 text-xl">
                        Please connect to a wallet and switch to Zircuit testnet or Optimism sepolia testnet .
                    </div>
                    <button
                        onClick={() => {
                            handleNetworkSwitch("zircuit", setError)
                        }}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-10 mt-10"
                    >
                        Switch to Zircuit Testnet
                    </button>
                    <button
                        onClick={() => {
                            handleNetworkSwitch("optimism", setError)
                        }}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-10 mt-10"
                    >
                        Switch to Optimism sepolia testnet
                    </button>
                </div>
            )}
        </div>
    )
}
