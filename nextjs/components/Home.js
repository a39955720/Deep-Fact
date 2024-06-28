"use client"
import { ConnectButton } from "web3uikit";
import Link from "next/link";
import SpinningObject from "../components/SpinningObject";

export default function Home() {
    return (
        <div className="relative min-h-screen flex items-center justify-center bg-black text-white overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
                <img src="/graphic_element_1.jpg" alt="Background Graphic" className="w-full h-full object-cover opacity-50" />
            </div>
            <div className="absolute top-0 left-0 w-full h-1/2">
                <SpinningObject />
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <h2 className="text-7xl font-bold mb-10">DeepFact</h2>
                <p className="text-xl mt-4 mx-4">
                    Create a decentralized anti-fraud community that gathers the power of experts and professional
                    institutions to combat fraud through blockchains.
                </p>
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mt-10">
                    <Link href="/start" legacyBehavior>
                        <a className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                            Get Started
                        </a>
                    </Link>
                    <Link href="/history" legacyBehavior>
                        <a className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">
                            View Submitted Projects
                        </a>
                    </Link>
                </div>
            </div>
        </div>
    );
}