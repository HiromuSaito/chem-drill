export interface UserQueryService {
  isUsernameAvailable(username: string): Promise<boolean>;
}
