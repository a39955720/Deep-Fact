"use client"
import { ConnectButton } from "web3uikit"
import Link from "next/link"

export default function Home() {
    return (
        <div>
            <div className="flex flex-col items-center justify-center min-h-screen text-center">
                <h2 className="text-7xl font-bold mb-10">DeepFact</h2>
                <p className="text-xl mt-4 mx-4">
                    Create a decentralized anti-fraud community that gathers the power of experts and professional
                    institutions to combat fraud through blockchains.
                </p>
                <Link href="/start" legacyBehavior>
                    <a className="mt-10 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                        Get Started
                    </a>
                </Link>
            </div>
        </div>
    )
}
