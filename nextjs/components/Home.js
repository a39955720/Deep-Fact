"use client"
import { useEffect } from 'react';
import { ConnectButton } from "web3uikit";
import Link from "next/link";
import SpinningObject from "../components/SpinningObject";

export default function Home() {
    let index = 0;
    useEffect(() => {
        const text = "Create a decentralized anti-fraud community that gathers the power\n of experts and professional institutions to combat fraud.";
        const speed = 50; // Adjust typing speed here
        const cursor = document.getElementById('cursor');
        const subtitle = document.getElementById('subtitle');

        // Clear the content before starting the typing effect
        subtitle.innerHTML = '';

        function typeWriter() {
            if (index < text.length) {
                subtitle.innerHTML += text.charAt(index);
                index++;
                setTimeout(typeWriter, speed);
            } else {
                cursor.style.display = 'none'; // Hide the cursor after typing is done
            }
        }

        setTimeout(typeWriter, 500); // Start typing after a delay
    }, []);

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-black text-white overflow-hidden" style={{ fontFamily: 'Verdana' }}>
            <div className="absolute inset-0 overflow-hidden">
                <img src="/graphic_element_1.jpg" alt="Background Graphic" className="w-full h-full object-cover opacity-60" />
            </div>
            {/* <div className="absolute top-0 left-0 w-full h-1/4">
                <SpinningObject />
            </div> */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center animate-pop">
                <h2 className="text-deepfact font-bold mb-10 animate-pop">DeepFact</h2>
                <div className="text-2xl mb-4 mx-4 animate-pop typing-container">
                    <span id="subtitle" style={{ whiteSpace: 'pre' }}></span>
                    <span id="cursor" className="blinking-cursor">|</span>
                </div>
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mt-10 animate-pop">
                    <Link href="/start" legacyBehavior>
                        <a className="bg-custom-blue hover:bg-blue-500 shadow-lg custom-link text-white py-4 px-8 rounded-lg flex items-center">
                                Get Started
                                <img src="/rocket.svg" alt="Rocket Icon" className="w-6 h-6 ml-2" />
                            </a>
                    </Link>
                </div>
            </div>
            <style jsx>{`
                @keyframes pop {
                    0% {
                        transform: scale(0.5);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.1);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(1);
                    }
                }
                .animate-pop {
                    animation: pop 1s ease-out forwards;
                }
                @keyframes blink {
                    0% { opacity: 1; }
                    50% { opacity: 0; }
                    100% { opacity: 1; }
                }
                .blinking-cursor {
                    animation: blink 0.7s infinite;
                }
                .typing-container {
                    display: inline-block;
                    text-align: left;
                }
                #subtitle {
                    display: inline-block;
                    text-align: middle;
                }
                .bg-custom-blue {
                    background-color: #315a87;
                }
                .bg-custom-blue:hover {
                    background-color: #2b4d74;
                }
                .shadow-lg {
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                }
            `}</style>
        </div>
    );
}