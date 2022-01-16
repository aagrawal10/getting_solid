const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyERC20", function() {
    it("Test basic ERC20 functions for single token", async function() {
        const MyERC20 = await ethers.getContractFactory("MyERC20");
        const token = await MyERC20.deploy("Token1", "TK1");
        await token.deployed();

        // Mint tokens to an address and transfer to another address.
        const [owner, user1, user2] = await ethers.getSigners();
        const mintToUser1Tx = await token.mintTokens(user1.address, 2000);
        mintToUser1Tx.wait();

        expect(await token.balanceOf(user1.address)).to.equal(2000);
        expect(await token.totalSupply()).to.equal(2000);

        const transferToUser2Tx = await token.connect(user1).transfer(user2.address, 200);
        transferToUser2Tx.wait();

        expect(await token.balanceOf(user1.address)).to.equal(1800);
        expect(await token.balanceOf(user2.address)).to.equal(200);
        expect(await token.totalSupply()).to.equal(2000);

        // Allow user2 to spend on behalf of user1 and transfer some to owner.
        const approveTx = await token.connect(user1).approve(user2.address, 400);
        approveTx.wait();

        expect(await token.allowance(user1.address, user2.address)).to.equal(400);

        const transferFromTx = await token.connect(user2).transferFrom(user1.address, owner.address, 200);
        transferFromTx.wait();

        expect(await token.balanceOf(user1.address)).to.equal(1600);
        expect(await token.balanceOf(user2.address)).to.equal(200);
        expect(await token.balanceOf(owner.address)).to.equal(200);
        expect(await token.totalSupply()).to.equal(2000);
    });
});
