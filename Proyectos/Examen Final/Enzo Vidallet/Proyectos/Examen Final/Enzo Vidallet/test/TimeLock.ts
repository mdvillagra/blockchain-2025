import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { TimeLock } from "../typechain-types";

describe("TimeLock", function () {
  async function deployFixture() {
    const ONE_YEAR = 365 * 24 * 3600;
    const current = await time.latest();
    const release = current + ONE_YEAR;
    const deposit = ethers.parseEther("0.001");
    const [deployer, other] = await ethers.getSigners();
    const TL = await ethers.getContractFactory("TimeLock");
    const lock = (await TL.deploy(release, { value: deposit })) as TimeLock;
    await lock.deployed();
    return { lock, release, deposit, deployer, other };
  }

  it("sets releaseTime and beneficiary", async () => {
    const { lock, release, deployer } = await loadFixture(deployFixture);
    expect(await lock.releaseTime()).to.equal(release);
    expect(await lock.beneficiary()).to.equal(deployer.address);
  });

  it("rejects past release times", async () => {
    const latest = await time.latest();
    const TL = await ethers.getContractFactory("TimeLock");
    await expect(TL.deploy(latest, { value: 1 })).to.be.revertedWith(
      "Release time must be future"
    );
  });

  it("prevents premature withdrawal", async () => {
    const { lock } = await loadFixture(deployFixture);
    await expect(lock.withdraw()).to.be.revertedWith(
      "Not yet unlocked"
    );
  });

  it("prevents non-beneficiary withdrawal", async () => {
    const { lock, release, other } = await loadFixture(deployFixture);
    await time.increaseTo(release);
    await expect(lock.connect(other).withdraw()).to.be.revertedWith(
      "Unauthorized"
    );
  });

  it("allows withdrawal after release and emits event", async () => {
    const { lock, release, deployer, deposit } = await loadFixture(deployFixture);
    await time.increaseTo(release);
    await expect(lock.withdraw())
      .to.emit(lock, "LockedRelease")
      .withArgs(deposit, anyValue => typeof anyValue === 'number');
    const finalBal = await ethers.provider.getBalance(lock.target);
    expect(finalBal).to.equal(0);
  });
});
