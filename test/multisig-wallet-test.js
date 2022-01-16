const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MultiSigWallet", function () {
    it("Tests Ether transfer for 2 of 4 multisig", async function () {

        const [owner1, owner2, owner3, owner4] = await ethers.getSigners();
        const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
        // 2 of 4 multisig wallet
        const multiSigWallet = await MultiSigWallet.deploy([
            owner1.address, owner2.address, owner3.address, owner4.address
        ], 2
        );
        await multiSigWallet.deployed();

        // Send Ether tx
        const sendEthTx = await owner1.sendTransaction({
            to: multiSigWallet.address,
            value: ethers.utils.parseEther("10"),
        });
        await sendEthTx.wait();

        // Submit transaction
        const submitTx = await multiSigWallet.submitTransaction(owner4.address, ethers.utils.parseEther("0.1"), "0x");
        submitTx.wait();

        // Verify that the transaction state is updated.
        expect(await multiSigWallet.getTransactionCount()).to.equal(1);

        // Confirm transaction
        let confirmTx1 = await multiSigWallet.connect(owner1).confirmTransaction(0);
        confirmTx1.wait();

        let confirmTx2 = await multiSigWallet.connect(owner2).confirmTransaction(0);
        confirmTx2.wait();

        // Execute transaction
        let executeTx = await multiSigWallet.executeTransaction(0);
        executeTx.wait();

        // Read transaction data that it is now executed.
        const returnedTx = await multiSigWallet.getTransaction(0);
        expect(returnedTx[3]).true;

        // Submit another tx (and execute with just 1 confirmation)
        const anotherTx = await multiSigWallet.submitTransaction(owner2.address, ethers.utils.parseEther("0.2"), "0x");
        anotherTx.wait();

        expect(await multiSigWallet.getTransactionCount()).to.equal(2);

        confirmTx1 = await multiSigWallet.connect(owner1).confirmTransaction(1);
        confirmTx1.wait();

        let isError = false;
        try {
            executeTx = await multiSigWallet.executeTransaction(1);
            executeTx.wait();
        } catch (error) {
            isError = true;
        }

        expect(isError).true;
    });

    it("Tests contract call for 2 of 4 multisig", async function () {

        const [owner1, owner2, owner3, owner4] = await ethers.getSigners();
        const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
        // 2 of 4 multisig wallet
        const multiSigWallet = await MultiSigWallet.deploy([
            owner1.address, owner2.address, owner3.address, owner4.address
        ], 2
        );
        await multiSigWallet.deployed();

        // Send Ether to initialise the contract
        const sendEthTx = await owner1.sendTransaction({
            to: multiSigWallet.address,
            value: ethers.utils.parseEther("10"),
        });
        await sendEthTx.wait();

        // Deploy Greeter contract to test contract call.
        const Greeter = await ethers.getContractFactory("Greeter");
        const greeter = await Greeter.deploy("Hello, world!");
        await greeter.deployed();

        // Get call data for Greeter::setGreeting
        const functionData = greeter.interface.encodeFunctionData("setGreeting", ["New Greeting!"]);

        // Submit transaction
        const submitTx = await multiSigWallet.submitTransaction(greeter.address, 0, functionData);
        await submitTx.wait();

        // Verify that the transaction state is updated.
        expect(await multiSigWallet.getTransactionCount()).to.equal(1);

        // Confirm transaction
        let confirmTx1 = await multiSigWallet.connect(owner1).confirmTransaction(0);
        confirmTx1.wait();

        let confirmTx2 = await multiSigWallet.connect(owner2).confirmTransaction(0);
        confirmTx2.wait();

        expect(await greeter.greet()).to.equal("Hello, world!");

        // Execute transaction
        let executeTx = await multiSigWallet.executeTransaction(0);
        executeTx.wait();

        // Read transaction data that it is now executed.
        const returnedTx = await multiSigWallet.getTransaction(0);
        expect(returnedTx[3]).true;
        expect(await greeter.greet()).to.equal("New Greeting!");
    });
});
