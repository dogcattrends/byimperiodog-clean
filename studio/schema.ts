import createSchema from 'part:@sanity/base/schema-creator'
import schemaTypes from 'all:part:@sanity/base/schema-type'
import author from './schemas/author'
import post from './schemas/post'

export default createSchema({
  name: 'default',
  types: schemaTypes.concat([author, post]),
})
