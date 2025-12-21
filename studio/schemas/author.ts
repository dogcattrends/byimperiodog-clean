import {defineType} from 'sanity'

export default defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    { name: 'name', title: 'Name', type: 'string', validation: (Rule: any) => Rule.required() },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name' }, validation: (Rule: any) => Rule.required() },
    { name: 'bio', title: 'Bio', type: 'text' },
    { name: 'profileImage', title: 'Profile image', type: 'image' },
  ],
})
// @ts-nocheck
// @ts-nocheck
import { defineField, defineType } from 'sanity'

export default {
  name: 'author',
  title: 'Autor',
  type: 'document',
  fields: [
    {name: 'name', title: 'Nome', type: 'string'},
    {name: 'bio', title: 'Biografia', type: 'text'},
    {name: 'avatar', title: 'Avatar', type: 'image'}
  ]
}
export default {
  name: 'author',
  title: 'Autor',
  type: 'document',
  fields: [
    {name: 'name', title: 'Nome', type: 'string'},
    {name: 'bio', title: 'Biografia', type: 'text'},
    {name: 'avatar', title: 'Avatar', type: 'image'}
  ]
}
