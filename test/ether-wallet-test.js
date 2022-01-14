const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EtherWallet", function () {
    it("Check basic withdraw functionality", async function () {
        const EtherWallet = await ethers.getContractFactory("EtherWallet");
        const etherWallet = await EtherWallet.deploy();
        await etherWallet.deployed();

        expect(await etherWallet.getBalance()).to.equal(0);

        const [owner, newOwner] = await ethers.getSigners();
        const sendEthTx = await owner.sendTransaction({
            to: etherWallet.address,
            value: ethers.utils.parseEther("1.0")
        });

        // wait until the transaction is mined
        await sendEthTx.wait();

        // Verify that the balance is now 1 ETH
        const currentBalance = await etherWallet.getBalance();
        console.log(`Balance: ${currentBalance}`);
        expect(currentBalance).to.equal(ethers.utils.parseEther("1.0"));

        // Verify that the ethers getBalance also returns the same.
        expect(await (await ethers.provider.getBalance(etherWallet.address))).to.equal(ethers.utils.parseEther("1.0"));

        // Withdraw from the contract
        const withdrawTx = await etherWallet.withdraw(ethers.utils.parseEther("0.5"));
        await withdrawTx.wait();

        // Verify that the balance is now 0.5 ETH
        const newBalance = await etherWallet.getBalance();
        expect(newBalance).to.equal(ethers.utils.parseEther("0.5"));

        // Try withdrawing with a different account, should raise an error.
        let isError = false;
        try {
            failedWithdrawTx = await etherWallet.connect(newOwner).withdraw(ethers.utils.parseEther("0.1"));
            failedWithdrawTx.wait();
        } catch (error) {
            isError = true;
        }
        expect(isError).to.true;

        // Now change owner to the newOwner
        const changeOwnerTx = await etherWallet.connect(owner).modifyOwner(newOwner.address);
        await changeOwnerTx.wait();

        // Now withdraw with newOwner should succeed.
        const newWithdrawTx = await etherWallet.connect(newOwner).withdraw(ethers.utils.parseEther("0.3"));
        await newWithdrawTx.wait();
        expect(await etherWallet.getBalance()).to.equal(ethers.utils.parseEther("0.2"));
    });
});