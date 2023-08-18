import { Modal, Input, useNotification } from "web3uikit";
import { useState } from "react";
import { useWeb3Contract } from "react-moralis";
import nftMarketplaceAbi from "../constants/NftMarketplace.json";
import { ethers } from "ethers";

export default function UpdateListingModal({
    nftAddress,
    tokenId,
    isVisible,
    marketplaceAddress,
    onClose,
    onPriceUpdated // New prop
}) {
    const dispatch = useNotification();

    const [priceToUpdateListingWith, setPriceToUpdateListingWith] = useState(0);
    const [isLoading, setIsLoading] = useState(false); // Loading state

    const handleUpdateListingSuccess = () => {
        dispatch({
            type: "success",
            message: "Listing updated successfully!",
            title: "Success",
            position: "topR",
        });
        onPriceUpdated && onPriceUpdated(); // Call the callback
        onClose && onClose();
        setPriceToUpdateListingWith("0");
    };

    const { runContractFunction: updateListing } = useWeb3Contract({
        abi: nftMarketplaceAbi,
        contractAddress: marketplaceAddress,
        functionName: "updateListing",
        params: {
            nftAddress: nftAddress,
            tokenId: tokenId,
            newPrice: ethers.utils.parseEther(priceToUpdateListingWith || "0"),
        },
    });

    const handleUpdatePrice = () => {
        // Validation
        if (parseFloat(priceToUpdateListingWith) <= 0) {
            dispatch({
                type: "error",
                message: "Please enter a valid price!",
                title: "Error",
                position: "topR",
            });
            return;
        }
        setIsLoading(true);
        updateListing({
            onError: (error) => {
                setIsLoading(false);
                dispatch({
                    type: "error",
                    message: error.message || "Error updating listing!",
                    title: "Error",
                    position: "topR",
                });
            },
            onSuccess: () => {
                setIsLoading(false);
                handleUpdateListingSuccess();
            },
        });
    };

    return (
        <Modal
            isVisible={isVisible}
            onCancel={onClose}
            onCloseButtonPressed={onClose}
            onOk={handleUpdatePrice} // Updated to the new function
            isLoading={isLoading} // Show loading spinner or disable the OK button when loading
        >
            <Input
                label="Update listing price in L1 Currency (ETH)"
                name="New listing price"
                type="number"
                onChange={(event) => {
                    setPriceToUpdateListingWith(event.target.value);
                }}
            />
        </Modal>
    );
}
