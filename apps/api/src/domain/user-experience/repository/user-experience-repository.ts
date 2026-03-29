import type { UserExperience } from "../entity/user-experience.ts";

export type ExperienceAction =
  | "drill_complete"
  | "proposal_submit"
  | "proposal_approved";

export type ExperienceLogEntry = {
  userId: string;
  action: ExperienceAction;
  amount: number;
  referenceId: string;
};

export type RankUpEventEntry = {
  userId: string;
  previousRank: number;
  newRank: number;
};

export interface UserExperienceRepository {
  save(userExperience: UserExperience): Promise<void>;
  findByUserId(userId: string): Promise<UserExperience | null>;
  saveExperienceLog(entry: ExperienceLogEntry): Promise<boolean>;
  saveRankUpEvents(events: RankUpEventEntry[]): Promise<void>;
}
