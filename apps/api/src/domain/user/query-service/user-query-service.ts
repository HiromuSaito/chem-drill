export type UserListItemDto = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: string;
  image: string | null;
  createdAt: Date;
  lastLoginAt: Date | null;
};

export type ListUsersResult = {
  items: UserListItemDto[];
  total: number;
};

export interface UserQueryService {
  isUsernameAvailable(username: string): Promise<boolean>;
  findById(userId: string): Promise<UserListItemDto | null>;
  listUsers(
    search: string | undefined,
    limit: number,
    offset: number,
  ): Promise<ListUsersResult>;
}
