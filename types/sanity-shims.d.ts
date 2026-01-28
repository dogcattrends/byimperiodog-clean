type SanitySchemaTypeDefinition = import('./sanity-types').SanitySchemaTypeDefinition;

declare module 'part:@sanity/base/schema-creator' {
 interface CreateSchemaOptions {
 name?: string;
 types: SanitySchemaTypeDefinition[];
 }

 const createSchema: (opts: CreateSchemaOptions) => unknown;
 export default createSchema;
}

declare module 'all:part:@sanity/base/schema-type' {
 const schemaTypes: SanitySchemaTypeDefinition[];
 export default schemaTypes;
}

declare module 'part:@sanity/*' {
 const whatever: unknown;
 export default whatever;
}
