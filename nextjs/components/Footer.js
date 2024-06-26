
"use client"
import { ConnectButton } from "web3uikit"
import Link from "next/link"

export default function Footer() {
    return (
        <footer className="flex items-center justify-center p-5 bg-gray-800 text-white">
<div className="flex justify-between items-center w-full px-4 py-2 text-white">
    <p>© 2024 DeepFact - All Rights Reserved</p>
    <div className="flex flex-row items-center space-x-10">
        <Link href="https://hackmd.io/@VP4VNGNwR4C0Nc6FtpbExA/H1MSzQDIR" legacyBehavior>
            <a className="text-white hover:underline">WhitePaper</a>
        </Link>
        <span className="text-white mx-1">|</span>
        <Link href="https://github.com/a39955720/Deep-Fact" legacyBehavior>
            <a className="text-white hover:underline">Github</a>
        </Link>
        <span className="text-white mx-1">|</span>
        <Link href="https://twitter.com" legacyBehavior>
            <a className="text-white hover:underline">Twitter</a>
        </Link>
    </div>
</div>
</footer>
    )
}