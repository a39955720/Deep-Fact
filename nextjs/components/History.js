import { useEffect, useState } from "react"
import { useMoralis } from "react-moralis"
import { ethers } from "ethers"
import { DeepFactAbi, ZircuitContractAddress, OptimismContractAddress } from "../constants"
import { handleNetworkSwitch, networks } from "./networkUtils"
import { sortProjectsByTime, filterProjectsWithAuditorResponses, options } from "./projectUtils"
import Dropdown from 'react-dropdown'
import 'react-dropdown/style.css'


export default function History() {
    const { isWeb3Enabled, chainId: chainIdHex, account } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const [submittedProjects, setSubmittedProjects] = useState("")
    const [filteredProjects, setFilteredProjects] = useState([])  // Added state for filtered projects
    const [filteredIndices, setFilteredIndices] = useState([]);
    const [error, setError] = useState("")
    const [timestamps, setTimestamps] = useState([])
    const [currentIndex, setCurrentIndex] = useState("")
    const [showModal_3, setShowModal_3] = useState(false)
    const [_name, setNames] = useState([])
    const [_link, setLinks] = useState([])
    const [_description, setDescriptions] = useState([])
    const [_aiAuditResult, setAiAuditResult] = useState([])
    const [_auditor, setAuditor] = useState([[], []])
    const [_auditorAuditResult, setAuditorAuditResult] = useState([[], []])
    const abi = ethers.utils.defaultAbiCoder

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

    async function getSubmittedProjects() {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const contract = new ethers.Contract(contractAddress, DeepFactAbi, provider)
        try {
            const _submittedProjects = await contract.getSubmittedProjects(account)
            setSubmittedProjects(_submittedProjects)
        } catch (error) {
            console.error("Error:", error)
        }
    }

    async function getProjectData() {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const contract = new ethers.Contract(contractAddress, DeepFactAbi, provider)
        try {
            const names = []
            const links = []
            const descriptions = []
            const aiAuditResults = []
            const auditors = []
            const auditorAuditResults = []

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

                auditors[i] = []
                auditorAuditResults[i] = []

                for (let j = 0; j < 3; j++) {
                    if (projectData[6][j].toString() != "0x0000000000000000000000000000000000000000") {
                        auditors[i][j] = projectData[6][j].toString()
                        const decodedAuditorAuditResult = abi.decode(["string"], projectData[7][j])
                        auditorAuditResults[i][j] = decodedAuditorAuditResult.toString()
                    } else {
                        auditors[i][j] = "0x0000000000000000000000000000000000000000"
                        auditorAuditResults[i][j] = ""
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

    const handleFilterSelect = (option) => {
        if (option.value === 'Sort by Time (Old to New)') {
            const sortedProjects = sortProjectsByTime(submittedProjects, timestamps);
            setFilteredProjects(sortedProjects);
        } 
        else if (option.value === 'Sort by Time (New to Old)') {
            const sortedProjects = sortProjectsByTime(submittedProjects, timestamps).reverse();
            setFilteredProjects(sortedProjects);
        }
        else if (option.value === 'Filter by Answered') {
            const filteredProjectIndices = filterProjectsWithAuditorResponses(submittedProjects, _auditor);
            const filteredProjects = filteredProjectIndices.map(index => submittedProjects[index]);
            setFilteredProjects(filteredProjects);
        }
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            getSubmittedProjects()
            getProjectData()
        }
    }, [isWeb3Enabled, submittedProjects])

    const cards = []
    const cards1 = []

    const displayProjects = filteredProjects.length > 0 ? filteredProjects : submittedProjects;


    for (let project of displayProjects) {
        const index = submittedProjects.findIndex(p => p.toHexString() === project.toHexString());
        cards.push(
            <div
                key={index}
                className="w-full mt-5 bg-gray-200 rounded-lg shadow-md p-6 cursor-pointer transition duration-300 ease-in-out transform hover:bg-gray-300 hover:shadow-lg"
                onClick={() => handleClick(index)}
            >
                <div className="flex flex-col items-center custom-link">
                    <img src="/icon.svg" alt="Project Icon" className="w-12 h-12 mb-4" />
                    <h3 className="text-2xl font-semibold" style={{ color: 'black' }}>{_name[index]}</h3>
                    <p className="text-gray-700 mt-2">
                        {_description[index] && _description[index].length > 200
                            ? _description[index].slice(0, 200) + "..."
                            : _description[index]}
                    </p>
                    <a className="text-blue-500 underline mt-2">See Report</a>
                </div>
            </div>
        );
    }


    for (let i = 0; i < 3; i++) {
        if (_auditor[currentIndex] && _auditor[currentIndex][i] == "0x0000000000000000000000000000000000000000") {
            break
        } else if (_auditor[currentIndex]) {
            cards1.push(
                <div className="bg-gray-200 mt-5 rounded-lg shadow-md p-4 w-full" style={{color:"black"}}>
                    <div className="flex flex-col">
                        <p className="text-gray-500 font-semibold text-xl">{_auditor[currentIndex][i]}</p>
                        <p className="text-black text-base mt-3 break-words">{_auditorAuditResult[currentIndex][i]}</p>
                    </div>
                </div>
            )
        }
    }
    // cards1.push(
    //     <div className="bg-gray-200 mt-5 rounded-lg shadow-md p-4 w-full">
    //         <div className="flex flex-col">
    //             <p className="text-gray-500 font-semibold text-xl">AI audit results</p>
    //             <p className="text-black text-base mt-3 break-words">{_aiAuditResult[currentIndex]}</p>
    //         </div>
    //     </div>
    // )

    return (
        <div className="flex mt-10" style={{ fontFamily: 'Space Mono, monospace' }}>
            {isWeb3Enabled && chainId == "48899" || chainId == "11155420" ? (
                <div className="flex justify-center w-full min-h-screen">
                    <div className="w-5/6 mb-10">
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
                                    <div className="grid grid-cols-2 gap-4 mb-10 h-72">
                                        <div>
                                            <h3 className="text-2xl font-bold mb-2" style={{color :"black"}}>The Project Name</h3>
                                            <div className="bg-gray-100 p-4 rounded" style={{color:"black"}}>{_name[currentIndex]}</div>
                                        </div>
                                        <div className="row-span-2 mb-20">
                                            <h3 className="text-2xl font-bold mb-2" style={{color :"black"}}>Your Concerns & Some descriptions</h3>
                                            <div className="bg-gray-100 p-4 rounded break-words h-full" style={{ whiteSpace: "pre-wrap", color: "black" }}>{_description[currentIndex]}</div>
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold mb-2" style={{color :"black"}}>The Project Link</h3>
                                            <a href={_link[currentIndex]} className="bg-gray-100 p-4 rounded block text-blue-500" style={{color:"black"}}>{_link[currentIndex]}</a>
                                        </div>
                                    </div>
                                    <hr className="mb-5" />
                                    <div className="mb-10">
                                        <div className="flex justify-center items-center mb-5">
                                            <img src="/expert_logo.svg" className="w-16 h-16 mr-4" alt="Expert Logo" />
                                            <h3 className="text-4xl font-bold" style={{color :"black"}}>Human Auditors</h3>
                                        </div>
                                        <div className="grid grid-cols-3 gap-10 h-96">
                                            {Array.from({ length: 3 }).map((_, index) => (
                                                <div key={index} className="bg-gray-200 p-4 rounded-lg shadow-md flex items-center justify-center">
                                                    {index < _auditor[currentIndex].length && _auditor[currentIndex][index] !== "0x0000000000000000000000000000000000000000" ? (
                                                        <div className="flex flex-col h-full w-full p-4">
                                                            <div className="flex items-start mb-4">
                                                                <img src="/expert.svg" className="w-20 h-20 mr-4 mt-1" />
                                                                <div>
                                                                    <p className="text-xl font-bold text-black">Respond #{index + 1}</p>
                                                                    <p className="text-sm text-black break-all ">From: <br/>{_auditor[currentIndex][index]}</p>
                                                                </div>
                                                            </div>
                                                            <p className="mt-2 text-black">{_auditorAuditResult[currentIndex][index]}</p>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center h-full flex items-center justify-center">
                                                            <p className="text-2xl" style={{color:"black"}}>No respond yet...</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <hr className="mb-5" />
                                    <div>
                                        <div className="flex justify-center items-center mb-5">
                                            <img src="/AI-generated.svg" className="w-16 h-16 mr-4" alt="AI Generated Logo" />
                                            <h3 className="text-4xl font-bold gradient-text-AI">AI-Generated Response</h3>
                                        </div>
                                        <div className="bg-gray-100 p-4 rounded break-words" style={{ whiteSpace: "pre-wrap", color: "black" }}>{_aiAuditResult[currentIndex]}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="gradient-text text-8xl font-bold">Project Space</h2>
                            <div className="bg-gray-100 text-gray-800 py-2 px-4 rounded-lg">
                                {account}
                            </div>
                        </div>
                        <p className="text-2xl mb-4" style={{color:"black"}}>Hi, {account}</p>
                        <div className="flex justify-center items-center mb-8">
                            <p className="text-5xl mt-20 font-bold" style={{color:"black"}}>History Asked Questions</p>
                        </div>
                        <div className="flex justify-end mb-4">
                            <Dropdown 
                                options={options} 
                                onChange={handleFilterSelect} 
                                placeholder="Select a filter"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{cards}</div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-start mt-10 min-h-screen">
                    <div className="ml-10 text-xl">Please connect to a wallet and switch to Zircuit testnet or Optimism sepolia testnet .</div>
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