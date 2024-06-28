"use client"
import Link from "next/link"

export default function Start() {
    return (
        <div className="flex flex-col items-center min-h-screen text-center relative">
            <div className="absolute top-10 left-5">
                <Link href="/" legacyBehavior>
                    <a className="text-gray-500 flex items-center">
                        <img src="/back_button.svg" alt="Back Icon" className="w-6 h-6 mr-2" />
                        <span>Back</span>
                    </a>
                </Link>
            </div>
            <h2 className="mt-20 text-7xl font-bold mb-10" style={{ color: 'black' }}>How do you want to contribute?</h2>
            <div className="flex space-x-10 mt-10 w-full justify-center">
                <Link href="/audit-and-earn" className="w-2/5">
                    <div className="bg-gradient-to-b from-black to-transparent bg-opacity-70 text-white p-18 rounded-lg shadow-md hover:shadow-lg transition duration-300 flex flex-col justify-center items-center" style={{ minHeight: "500px" }}>
                        <h3 className="text-4xl font-bold mb-4 hover:text-blue-500 transition duration-300">Audit and Earn</h3>
                        <p className="text-lg font-bold hover:text-blue-500 transition duration-300">Stake and Start to Earn ! →</p>
                    </div>
                </Link>
                <Link href="/submit" className="w-2/5">
                    <div className="bg-gradient-to-b from-black to-transparent bg-opacity-70 text-white p-18 rounded-lg shadow-md hover:shadow-lg transition duration-300 flex flex-col justify-center items-center" style={{ minHeight: "500px" }}>
                        <h3 className="text-4xl font-bold mb-4 hover:text-blue-500 transition duration-300">Submit Project</h3>
                        <p className="text-lg font-bold hover:text-blue-500 transition duration-300">Become a Contributor ! →</p>
                    </div>
                </Link>
            </div>
        </div>
    )
}