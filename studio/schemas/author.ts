import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name' },
      validation: (Rule: any) => Rule.required().unique(),
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'text',
      validation: (Rule: any) => Rule.required().min(20),
    }),
    defineField({
      name: 'experience',
      title: 'Experience',
      type: 'array',
      of: [
        defineField({
          name: 'entry',
          title: 'Experience entry',
          type: 'object',
          fields: [
            { name: 'role', title: 'Role', type: 'string' },
            { name: 'organization', title: 'Organization', type: 'string' },
            {
              name: 'period',
              title: 'Period',
              type: 'string',
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'credentials',
      title: 'Credentials',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'profileImage',
      title: 'Profile image',
      type: 'image',
    }),
    defineField({
      name: 'website',
      title: 'Website',
      type: 'url',
    }),
    defineField({
      name: 'twitter',
      title: 'Twitter handle',
      type: 'url',
    }),
    defineField({
      name: 'linkedin',
      title: 'LinkedIn profile',
      type: 'url',
    }),
  ],
})
