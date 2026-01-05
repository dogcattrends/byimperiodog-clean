import type { SchemaTypeDefinition } from '@sanity/types';
import schemaTypes from 'all:part:@sanity/base/schema-type';
import createSchema from 'part:@sanity/base/schema-creator';

import author from './schemas/author';
import post from './schemas/post';

// Tipagem explícita para schemaTypes para evitar unknown[]
const schemaTypesTyped = schemaTypes as unknown as SchemaTypeDefinition[];
const authorTyped = author as unknown as SchemaTypeDefinition;
const postTyped = post as unknown as SchemaTypeDefinition;
const allTypes: SchemaTypeDefinition[] = [...schemaTypesTyped, authorTyped, postTyped];

export default createSchema({
  name: 'default',
  types: allTypes,
});
