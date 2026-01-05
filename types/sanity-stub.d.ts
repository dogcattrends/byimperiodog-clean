declare module 'sanity' {
  type SchemaDefinition = Record<string, unknown>;
  type SanitySchemaTypeDefinition = import('./sanity-types').SanitySchemaTypeDefinition;

  export type SanityConfig = {
    name?: string;
    title?: string;
    projectId?: string;
    dataset?: string;
    schema?: {
      types: SanitySchemaTypeDefinition[];
    };
    plugins?: Array<unknown>;
  };

  export function defineConfig<T extends SanityConfig>(config: T): T;
  export function defineField<T extends SchemaDefinition>(def: T): T;
  export function defineType<T extends SchemaDefinition>(def: T): T;
  export function defineArrayMember<T extends SchemaDefinition>(member: T): T;
}
