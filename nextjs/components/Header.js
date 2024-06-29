import { ConnectButton } from "web3uikit";
import Link from "next/link";

export default function Header() {
    return (
        <nav className="p-5 border-b-10 flex flex-row justify-between items-center bg-black bg-opacity-50" style={{ fontFamily: 'Verdana' }}>
            <div className="flex items-center">
                <Link href="/home" legacyBehavior>
                    <h1 className="font-orbitron text-white py-4 px-4 font-bold text-4xl ml-5">DeepFact</h1>
                </Link>
            </div>
            <div className="text-xl flex flex-row items-center space-x-10 ">
                <Link href="/start" legacyBehavior>
                    <a className="text-white hover:text-blue-500 custom-link">Get Started</a>
                </Link>
                <span className="text-white mx-1">|</span>
                <Link href="/home" legacyBehavior>
                    <a className="text-white hover:text-blue-500 custom-link">Home</a>
                </Link>
                <span className="text-white mx-1">|</span>
                <Link href="/history" legacyBehavior>
                    <a className="text-white hover:text-blue-500 custom-link">My Space</a>
                </Link>
            </div>
            <div className="flex font-bold flex-row justify-end">
                <div className="custom-connect-button z-50">
                    <ConnectButton moralisAuth={false} />
                </div>
            </div>
        </nav>
    );
}