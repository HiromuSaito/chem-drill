import { v7 as uuidv7 } from "uuid";

const ID_BRAND = Symbol("Id");

export type Id<T> = string & { readonly [ID_BRAND]: T };

function createId<T>(value: string): Id<T> {
  return value as Id<T>;
}

export const Id = {
  of<T>(value: string): Id<T> {
    // UUID format validation
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value,
      )
    ) {
      throw new Error(`Invalid UUID: ${value}`);
    }
    return createId<T>(value);
  },

  safeOf<T>(value: string): Id<T> | null {
    try {
      return Id.of<T>(value);
    } catch {
      return null;
    }
  },

  random<T>(): Id<T> {
    return createId<T>(uuidv7());
  },

  unknown<T>(): Id<T> {
    return createId<T>("00000000-0000-0000-0000-000000000000");
  },
} as const;
