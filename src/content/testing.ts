export const TEST_CHECKLIST: string[] = [
  "I created an in-memory repository seeded with the exact state I need",
  "I used a recording (spy) adapter to observe the outbound call",
  "I asserted on behavior (what was redeemed), not on implementation details",
  "I covered the error paths: reward not found, reward unavailable",
  "Zero mocking libraries, zero network, zero AWS in the test file",
];

export const TEST_SOLUTION: string = `// A tiny recording adapter: an in-memory spy, no library needed
const recordingRedemptionServiceCreator = () => {
  const calls: { userEmail: string; reward: Reward }[] = [];
  return {
    service: {
      async redeem(userEmail: string, reward: Reward) {
        calls.push({ userEmail, reward });
      },
    },
    calls,
  };
};

describe("redeemReward", () => {
  const reward = { id: "r1", available: true, internalRewardId: "int1" };

  it("redeems an available reward", async () => {
    const { service, calls } = recordingRedemptionServiceCreator();
    const redeemReward = createRedeemRewardUseCase({
      rewardRepository: inMemoryRewardRepositoryCreator(
        new Map([["r1", reward]])
      ),
      redemptionService: service,
    });

    await redeemReward("paul@example.com", "r1");

    expect(calls).toEqual([{ userEmail: "paul@example.com", reward }]);
  });

  it("throws when the reward does not exist", async () => {
    const redeemReward = createRedeemRewardUseCase({
      rewardRepository: inMemoryRewardRepositoryCreator(new Map()),
      redemptionService: recordingRedemptionServiceCreator().service,
    });

    await expect(redeemReward("paul@example.com", "nope"))
      .rejects.toThrow("Reward not found");
  });

  it("throws when the reward is unavailable", async () => {
    const redeemReward = createRedeemRewardUseCase({
      rewardRepository: inMemoryRewardRepositoryCreator(
        new Map([["r1", { ...reward, available: false }]])
      ),
      redemptionService: recordingRedemptionServiceCreator().service,
    });

    await expect(redeemReward("paul@example.com", "r1"))
      .rejects.toThrow("Reward unavailable");
  });
});`;
