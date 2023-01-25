const { expect } = require("chai");

describe("NFTMarket", function () {
  it("Deploy the Smart Contracts on blockchain, mint new nfts, sell a NFT and make transactions on the Blockcahain", async function () {
    const Market = await ethers.getContractFactory("NFTMarket");
    const market = await Market.deploy();

    await market.deployed();

    const marketAddress = market.address;

    // Deploy NFT
    const NFT = await ethers.getContractFactory("NFT");
    const nft = await NFT.deploy(marketAddress);

    await nft.deployed();

    const nftContractAddress = nft.address;
    let listingPrice = await market.getListingPrice();
    listingPrice = listingPrice.toString();

    const sellingPrice = ethers.utils.parseUnits("10", "ether");
    // Creating 2 NFTs
    await nft.createToken("https://ww.pwskills1.com");
    await nft.createToken("https://ww.pwskills2.com");

    // Creating 2 Market Items
    await market.createMarketItem(nftContractAddress, 1, sellingPrice, {
      value: listingPrice,
    });
    await market.createMarketItem(nftContractAddress, 2, sellingPrice, {
      value: listingPrice,
    });

    // Getting signers | ignore all address and use the last one as buyer
    const [_, buyerAddress] = await ethers.getSigners();

    await market
      .connect(buyerAddress)
      .createMarketSale(nftContractAddress, 1, { value: sellingPrice });

    let items = await market.fetchMarketItems();
    items = await Promise.all(
      items.map(async (i) => {
        const tokenURI = await nft.tokenURI(i.tokenId);
        let item = {
          price: i.price.toString(),
          tokenId: i.tokenId.toString(),
          seller: i.seller,
          owner: i.owner,
          tokenURI,
        };
        return item;
      })
    );
  });
});
