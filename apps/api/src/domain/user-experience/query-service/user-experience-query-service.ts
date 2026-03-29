export type RankUpEventDto = {
  id: string;
  userId: string;
  previousRank: number;
  newRank: number;
  createdAt: string;
};

export type UserRankInfoDto = {
  totalExp: number;
  currentRank: number;
  substance: string;
  category: string;
  progress: number;
  nextRankExp: number | null;
};

export interface UserExperienceQueryService {
  getPendingRankUps(userId: string): Promise<RankUpEventDto[]>;
  markRankUpsDisplayed(eventIds: string[]): Promise<void>;
}
