import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import styles from "../styles/Home.module.css";
import { Form, useNotification, Button } from "web3uikit";
import { useMoralis, useWeb3Contract } from "react-moralis"
import getContractABI from "../components/getContractABI";
import nftMarketplaceAbi from '../constants/NftMarketplace.json';

const MARKETPLACE_ADDRESS = "0x655734AF87aB0D39c5028158723b09ECF7C4d188";

export default function Home() {
    const [nftAddress, setNFTAddress] = useState("");
    const [tokenId, setTokenId] = useState("");
    const [price, setPrice] = useState("");
    const [proceeds, setProceeds] = useState("0");
    const dispatch = useNotification();
    const { runContractFunction } = useWeb3Contract()

    const handleSellNFT = async (e) => {
        const nftAddressData = e.data.find((item) => item.key === "nftAddress");
        const tokenIdData = e.data.find((item) => item.key === "tokenId");
        const priceData = e.data.find((item) => item.key === "price");

        if (nftAddressData && tokenIdData && priceData) {
            const nftAddress = nftAddressData.inputResult;
            const tokenId = tokenIdData.inputResult;
            const price = priceData.inputResult;

            const POLYGONSCAN_API_KEY = "https://polygon-mumbai.g.alchemy.com/v2/QdymiHgRusnx0El7MjbzgY2EqGui9dPu";
            const fetchedNFTAbi = await getContractABI(nftAddress, POLYGONSCAN_API_KEY);

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const nftContract = new ethers.Contract(nftAddress, fetchedNFTAbi, signer);
            const marketplaceContract = new ethers.Contract(MARKETPLACE_ADDRESS, nftMarketplaceAbi, signer);

            // Approve the marketplace to sell the NFT on user's behalf
            const approvalTx = await nftContract.approve(MARKETPLACE_ADDRESS, tokenId);
            await approvalTx.wait();

            // List the NFT on the marketplace after getting approval
            const listingPriceInWei = ethers.utils.parseEther(price);
            const tx = await marketplaceContract.listItem(nftAddress, tokenId, listingPriceInWei);
            await tx.wait();

            alert("Successfully Listed!");

            // Reset the form (optional)
            setNFTAddress("");
            setTokenId("");
            setPrice("");
        }
    };

    const handleWithdrawSuccess = () => {
        dispatch({
            type: "success",
            message: "Withdrawing proceeds",
            position: "topR",
        });
    };

    useEffect(() => {
        setupUI();
    }, [proceeds]);

    async function setupUI() {
        const returnedProceeds = await runContractFunction({
            params: {
                abi: nftMarketplaceAbi,
                contractAddress: MARKETPLACE_ADDRESS,
                functionName: "getProceeds",
                params: {
                    seller: account,
                },
            },
            onError: (error) => console.log(error),
        });
        if (returnedProceeds) {
            setProceeds(returnedProceeds.toString());
        }
    }

    return (
        <div className={styles.container}>
            <Form
                onSubmit={handleSellNFT}
                data={[
                    {
                        name: "NFT Address",
                        type: "text",
                        value: nftAddress,
                        key: "nftAddress",
                        onChange: (e) => setNFTAddress(e.target.value),
                    },
                    {
                        name: "Token ID",
                        type: "number",
                        value: tokenId,
                        key: "tokenId",
                        onChange: (e) => setTokenId(e.target.value),
                    },
                    {
                        name: "Price (in ETH)",
                        type: "number",
                        value: price,
                        key: "price",
                        onChange: (e) => setPrice(e.target.value),
                    },
                ]}
                title="Sell your NFT!"
                id="Main Form"
            />
            <div>Withdraw {proceeds} proceeds</div>
            {proceeds !== "0" ? (
                <Button
                    onClick={() => {
                        runContractFunction({
                            params: {
                                abi: nftMarketplaceAbi,
                                contractAddress: MARKETPLACE_ADDRESS,
                                functionName: "withdrawProceeds",
                                params: {},
                            },
                            onError: (error) => console.log(error),
                            onSuccess: handleWithdrawSuccess,
                        });
                    }}
                    text="Withdraw"
                    type="button"
                />
            ) : (
                <div>No proceeds detected</div>
            )}
        </div>
    );
}
