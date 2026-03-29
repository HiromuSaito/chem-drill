import { describe, expect, it } from "vitest";
import { UserExperience } from "../entity/user-experience.ts";

describe("UserExperience", () => {
  describe("create", () => {
    it("初期状態はランク1、経験値0", () => {
      const ue = UserExperience.create("user-1");
      expect(ue.userId).toBe("user-1");
      expect(ue.totalExp).toBe(0);
      expect(ue.currentRank).toBe(1);
    });
  });

  describe("reconstruct", () => {
    it("保存済みデータから復元できる", () => {
      const ue = UserExperience.reconstruct("user-1", 500, 6);
      expect(ue.userId).toBe("user-1");
      expect(ue.totalExp).toBe(500);
      expect(ue.currentRank).toBe(6);
    });
  });

  describe("addExp", () => {
    it("経験値を加算できる", () => {
      const ue = UserExperience.create("user-1");
      const result = ue.addExp(30);
      expect(result.userExperience.totalExp).toBe(30);
      expect(result.rankUps).toHaveLength(0);
    });

    it("ランクアップが発生した場合にrankUpsを返す", () => {
      const ue = UserExperience.create("user-1");
      const result = ue.addExp(50);
      expect(result.userExperience.totalExp).toBe(50);
      expect(result.userExperience.currentRank).toBe(2);
      expect(result.rankUps).toHaveLength(1);
      expect(result.rankUps[0]).toEqual({ previousRank: 1, newRank: 2 });
    });

    it("複数ランクアップが同時に発生した場合", () => {
      const ue = UserExperience.create("user-1");
      const result = ue.addExp(200);
      expect(result.userExperience.currentRank).toBe(4);
      expect(result.rankUps).toHaveLength(3);
      expect(result.rankUps[0]).toEqual({ previousRank: 1, newRank: 2 });
      expect(result.rankUps[1]).toEqual({ previousRank: 2, newRank: 3 });
      expect(result.rankUps[2]).toEqual({ previousRank: 3, newRank: 4 });
    });

    it("ランク20を超えない", () => {
      const ue = UserExperience.reconstruct("user-1", 5900, 19);
      const result = ue.addExp(200);
      expect(result.userExperience.currentRank).toBe(20);
      expect(result.userExperience.totalExp).toBe(6100);
      expect(result.rankUps).toHaveLength(1);
    });

    it("既にランク20の場合はランクアップしない", () => {
      const ue = UserExperience.reconstruct("user-1", 6000, 20);
      const result = ue.addExp(100);
      expect(result.userExperience.totalExp).toBe(6100);
      expect(result.userExperience.currentRank).toBe(20);
      expect(result.rankUps).toHaveLength(0);
    });
  });

  describe("getProgress", () => {
    it("ランク1で経験値0の場合は0%", () => {
      const ue = UserExperience.create("user-1");
      expect(ue.getProgress()).toBe(0);
    });

    it("ランク1で経験値25の場合は50%", () => {
      const ue = UserExperience.reconstruct("user-1", 25, 1);
      expect(ue.getProgress()).toBe(50);
    });

    it("ランク20の場合は100%", () => {
      const ue = UserExperience.reconstruct("user-1", 6000, 20);
      expect(ue.getProgress()).toBe(100);
    });
  });

  describe("getNextRankExp", () => {
    it("ランク1から次のランクまでの必要経験値", () => {
      const ue = UserExperience.create("user-1");
      expect(ue.getNextRankExp()).toBe(50);
    });

    it("ランク20の場合はnullを返す", () => {
      const ue = UserExperience.reconstruct("user-1", 6000, 20);
      expect(ue.getNextRankExp()).toBeNull();
    });
  });
});
