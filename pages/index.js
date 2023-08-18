import styles from "../styles/Home.module.css";
import { useMoralis } from "react-moralis";
import NFTBox from "./components/NFTBox";
import networkMapping from "./constants/networkMapping.json";
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";

export default function Home() {
  const { chainId, isWeb3Enabled } = useMoralis();
  const chainString = chainId ? parseInt(chainId).toString() : null;
  const marketplaceAddress = chainId
    ? networkMapping[chainString].NftMarketplace[0]
    : null;

  const GET_ACTIVE_ITEMS = gql`
    {
      activeItems(
        first: 5
        where: { buyer: "0x0000000000000000000000000000000000000000" }
      ) {
        id
        buyer
        seller
        nftAddress
        tokenId
        price
      }
    }
  `;

  const { loading, error, data: listedNfts } = useQuery(GET_ACTIVE_ITEMS);

  // Sort the items by price if they exist
  const sortedNfts = listedNfts?.activeItems.sort(
    (a, b) => parseFloat(b.price) - parseFloat(a.price),
  );

  return (
    <div className="container mx-auto">
      <h1 className="py-4 px-4 font-bold text-2xl">Recently Listed</h1>
      <div className="flex flex-wrap">
        {isWeb3Enabled && chainId ? (
          loading || !sortedNfts ? (
            <div>Loading...</div>
          ) : (
            sortedNfts.map((nft) => {
              const { price, nftAddress, tokenId, seller } = nft;
              return marketplaceAddress ? (
                <NFTBox
                  price={price}
                  nftAddress={nftAddress}
                  tokenId={tokenId}
                  marketplaceAddress={marketplaceAddress}
                  seller={seller}
                  key={`${nftAddress}${tokenId}`}
                />
              ) : (
                <div>Network error, please switch to a supported network.</div>
              );
            })
          )
        ) : (
          <div>Web3 Currently Not Enabled</div>
        )}
      </div>
    </div>
  );
}
