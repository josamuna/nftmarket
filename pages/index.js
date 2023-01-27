import { ethers } from "ethers"; // Handle Blockchain interactions
import { useState, useEffect } from "react";
import axios from "axios";
import Web3Modal from "web3modal"; // Handle connection to wallet like Metamask

import { nftaddress, nftmarketaddress } from "../config";
// ABI
import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import NFTMarket from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

export default function Home() {
  // Hook for NFT to show (Default empty array)
  const [nfts, setNFTs] = useState([]);
  const [loadingState, setLoadingState] = useState("Not-loaded");

  // Loading available NTF to sold
  useEffect(() => {
    loadNFTs();
  }, []);

  async function loadNFTs() {
    const provider = new ethers.providers.JsonRpcProvider();
    // Getting acces to all available contract functions
    const nftContract = new ethers.Contract(nftaddress, NFT.abi, provider);
    const nftMarketContract = new ethers.Contract(
      nftmarketaddress,
      NFTMarket.abi,
      provider
    );

    // fetch NFTs
    const data = await nftMarketContract.fetchMarketItems();

    const items = await Promise.all(
      data.map(async (i) => {
        const tokenUri = await nftContract.tokenURI(i.tokenId);
        const meta = await axios.get(tokenUri);
        let price = ethers.utils.formatUnits(i.price.toString(), "ether");
        let item = {
          price,
          tokenId: i.tokenId.toNumber(),
          seller: i.seller,
          owner: i.owner,
          image: meta.data.image,
          name: meta.data.name,
          description: meta.data.description,
        };
        return item;
      })
    );
    setNFTs(items);
    setLoadingState("Loaded");
  }

  // function to buy NFT
  async function buyNFT(nft) {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect(); // Connect to wallet
    const provider = new ethers.providers.Web3Provider(connection);

    const signer = provider.getSigner(); // Fetch signer to the current connection
    const contract = new ethers.Contract(
      nftmarketaddress,
      NFTMarket.abi,
      signer
    );
    const formatedPrice = ethers.utils.parseUnits(
      nft.price.toString(),
      "ether"
    );
    const transaction = await contract.createMarketSale(
      nftaddress,
      nft.tokenId,
      {
        value: formatedPrice,
      }
    );
    await transaction.wait();
    loadNFTs();
  }

  // Rendering component
  if (loadingState === "Loaded" && !nfts.length) {
    // Loaded state and empty lenght
    return (
      <div>
        <p className="px-10 py-10 text-2xl font-bold flex justify-center text-cyan-200">
          There are currently no NFTs in the Marketplace.
          <br /> Please come back later
        </p>
      </div>
    );
  }
  return (
    <div className="flex justify-center">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-5">
          {nfts.map((nft, i) => {
            <div key={i} className="border shadow rounded-3xl overflow-hidden">
              <img src={nft.image} alt="" />
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-2xl font-semibold"
                >
                  {nft.name}
                </p>
                <div style={{ height: "70px", overflow: "hidden" }}>
                  <p className="text-gray-400">{nft.description}</p>
                </div>
              </div>
              <div className="p-6 bg-blue">
                <p className="text-2xl mb-4 font-bold text-white">
                  {nft.price} ETH
                </p>
                <button
                  className="w-full bg-purple-600 text-white font-bold py-2 px-12 rounded"
                  onClick={() => buyNFT(nft)}
                >
                  Buy
                </button>
              </div>
            </div>;
          })}
        </div>
      </div>
    </div>
  );
}
