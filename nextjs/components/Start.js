"use client"
import Link from "next/link"

export default function Start() {
    return (
        <div className="flex flex-col items-center min-h-screen text-center relative" style={{ fontFamily: 'Space Mono, monospace' }}>
            <div className="absolute top-10 left-5">
                <Link href="/" legacyBehavior>
                    <a className="text-gray-500 flex items-center text-2xl p-4 hover:bg-gray-200 rounded-lg transition duration-300">
                        <img src="/back_button.svg" alt="Back Icon" className="w-12 h-12 mr-4" />
                        <span>Back</span>
                    </a>
                </Link>
            </div>
            <h2 className="mt-20 text-7xl font-bold mb-10" style={{ color: 'black' }}>How do you want to contribute?</h2>
            <div className="flex space-x-10 mt-10 w-full justify-center">
                <Link href="/audit" className="w-2/5">
                    <div className="gradient-flow text-white p-18 rounded-lg shadow-md hover:shadow-lg transition duration-300 flex flex-col justify-center items-center" style={{ minHeight: "500px" }}>
                        <h3 className="custom-link text-4xl font-bold mb-4 hover:text-blue-500 transition duration-300">Want to Help others?</h3>
                        <p className=" text-lg font-bold  transition duration-300">Answer questions and Start to Earn ! →</p>
                    </div>
                </Link>
                <Link href="/submit" className="w-2/5">
                    <div className="gradient-flow text-white p-18 rounded-lg shadow-md hover:shadow-lg transition duration-300 flex flex-col justify-center items-center" style={{ minHeight: "500px" }}>
                        <h3 className="custom-link text-4xl font-bold mb-4 hover:text-blue-500 transition duration-300">Want to Ask a question?</h3>
                        <p className=" text-lg font-bold  transition duration-300">Receive the professional respond from our experts ! →</p>
                    </div>
                </Link>
            </div>
            <style jsx>{`
                @keyframes gradientFlow {
                    0% {
                        background-position: 0% 100%;
                    }
                    50% {
                        background-position: 0% 785;
                    }
                    100% {
                        background-position: 0% 100%;
                    }
                }

                .gradient-flow {
                    background: linear-gradient(to bottom, black, transparent);
                    background-size: 100% 200%;
                    transition: background 0.5s ease;
                }

                .gradient-flow:hover {
                    animation: gradientFlow 1s linear infinite;
                }
            `}</style>
        </div>
    )
}