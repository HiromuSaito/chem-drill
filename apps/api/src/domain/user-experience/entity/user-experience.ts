import {
  RANK_DEFINITIONS,
  getRankForExp,
  getRankInfo,
  type RankDefinition,
} from "../rank-definitions.ts";

export type RankUp = {
  readonly previousRank: number;
  readonly newRank: number;
};

export type AddExpResult = {
  readonly userExperience: UserExperience;
  readonly rankUps: readonly RankUp[];
};

export class UserExperience {
  private constructor(
    readonly userId: string,
    readonly totalExp: number,
    readonly currentRank: number,
  ) {}

  static create(userId: string): UserExperience {
    return new UserExperience(userId, 0, 0);
  }

  static reconstruct(
    userId: string,
    totalExp: number,
    currentRank: number,
  ): UserExperience {
    return new UserExperience(userId, totalExp, currentRank);
  }

  addExp(amount: number): AddExpResult {
    const newTotalExp = this.totalExp + amount;
    const newRank = getRankForExp(newTotalExp);

    const rankUps: RankUp[] = [];
    for (let r = this.currentRank + 1; r <= newRank; r++) {
      rankUps.push({ previousRank: r - 1, newRank: r });
    }

    return {
      userExperience: new UserExperience(this.userId, newTotalExp, newRank),
      rankUps,
    };
  }

  getProgress(): number {
    const currentDef = getRankInfo(this.currentRank);
    const maxRank = RANK_DEFINITIONS[RANK_DEFINITIONS.length - 1].rank;
    if (this.currentRank >= maxRank) {
      return 100;
    }
    const nextDef = getRankInfo(this.currentRank + 1);
    const rangeExp = nextDef.requiredExp - currentDef.requiredExp;
    const currentExp = this.totalExp - currentDef.requiredExp;
    return Math.round((currentExp / rangeExp) * 100);
  }

  getNextRankExp(): number | null {
    const maxRank = RANK_DEFINITIONS[RANK_DEFINITIONS.length - 1].rank;
    if (this.currentRank >= maxRank) {
      return null;
    }
    return getRankInfo(this.currentRank + 1).requiredExp;
  }

  getRankDefinition(): RankDefinition {
    return getRankInfo(this.currentRank);
  }
}
