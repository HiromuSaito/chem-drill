export type CategoryDto = {
  id: string;
  name: string;
};

export interface CategoryQueryService {
  findAll(): Promise<CategoryDto[]>;
}
