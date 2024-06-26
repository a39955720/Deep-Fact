"use client"
import Link from "next/link"

export default function Start() {
    return (
        <div className="flex flex-col items-center min-h-screen text-center">
            <h2 className="items-center mt-10 text-7xl font-bold mb-10">How do you want to contribute?</h2>
            <div className="flex space-x-10 mt-10 min-h-screen w-full justify-center">
                <Link href="/audit-and-earn" className="w-2/5 ml-10">
                    <div className="bg-gray-200 p-12 rounded-lg shadow-md hover:shadow-lg transition duration-300 h-1/2 flex flex-col justify-center">
                        <h3 className="text-3xl font-semibold mb-4">Audit and Earn</h3>
                        <p className="text-sm">Stake and Start to Earn ! →</p>
                    </div>
                </Link>
                <Link href="/submit" className="w-2/5 mr-10">
                    <div className="bg-gray-200 p-12 rounded-lg shadow-md hover:shadow-lg transition duration-300 h-1/2 flex flex-col justify-center">
                        <h3 className="text-3xl font-semibold mb-4">Submit Project</h3>
                        <p className="text-sm">Become a Contributor ! →</p>
                    </div>
                </Link>
            </div>
        </div>
    )
}
