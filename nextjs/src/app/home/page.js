"use client"
import Head from "next/head"
import Header from "../../../components/Header"
import Home from "../../../components/Home"
import Footer from "../../../components/Footer"

export default function HomePage() {
    return (
        <div className="bg-gray-300 flex-col min-h-screen">
            <Head>
                <title>Fraud Blocker</title>
                <meta name="description" content="DeepFact" />
                <link rel="icon" href="/logo1.png" />
            </Head>
            <Header />
            <Home />
            <Footer />
        </div>
    )
}
