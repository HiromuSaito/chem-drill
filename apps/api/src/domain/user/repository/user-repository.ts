export interface UserRepository {
  updateImage(userId: string, imageUrl: string | null): Promise<void>;
}
