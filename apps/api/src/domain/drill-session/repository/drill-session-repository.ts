import type { DrillSession } from "../entity/drill-session.ts";

export interface DrillSessionRepository {
  save(session: DrillSession): Promise<void>;
}
