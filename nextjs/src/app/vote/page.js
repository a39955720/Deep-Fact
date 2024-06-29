"use client"
import Head from "next/head"
import Header from "../../../components/Header"
import Vote from "../../../components/Vote"
import Footer from "../../../components/Footer"

export default function VotePage() {
    return (
        <div className="bg-gray-300 flex-col min-h-screen">
            <Head>
                <title>Fraud Blocker</title>
                <meta name="description" content="Deep Fact" />
                <link rel="icon" href="/logo1.png" />
            </Head>
            <Header />
            <Vote />
            <Footer />
        </div>
    )
}
