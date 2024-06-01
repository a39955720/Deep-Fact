import Image from "next/image"
import Head from "next/head"

export default function Home() {
    return (
        <div className="bg-yellow-400 flex-col min-h-screen">
            <Head>
                <title>Fraud Blocker</title>
                <meta name="description" content="Fraud Blocker" />
                <link rel="icon" href="/logo1.png" />
            </Head>
        </div>
    )
}
