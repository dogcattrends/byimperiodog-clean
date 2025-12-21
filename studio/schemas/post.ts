import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule: any) => Rule.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: (Rule: any) => Rule.required() }),
    defineField({ name: 'description', title: 'Description', type: 'text', validation: (Rule: any) => Rule.required() }),
    defineField({ name: 'tldr', title: 'TL;DR', type: 'text' }),
    defineField({ name: 'keyTakeaways', title: 'Key takeaways', type: 'array', of: [{ type: 'string' }] }),
    defineField({
      name: 'faq',
      title: 'FAQ',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'faqItem',
          fields: [
            { name: 'question', title: 'Question', type: 'string', validation: (Rule: any) => Rule.required() },
            { name: 'answer', title: 'Answer', type: 'text', validation: (Rule: any) => Rule.required() },
          ],
        },
      ],
    }),
    defineField({ name: 'sources', title: 'Sources', type: 'array', of: [{ type: 'url' }, { type: 'string' }] }),
    defineField({ name: 'author', title: 'Author', type: 'reference', to: [{ type: 'author' }], validation: (Rule: any) => Rule.required() }),
    defineField({ name: 'lastReviewedAt', title: 'Last reviewed at', type: 'datetime' }),
    defineField({ name: 'reviewedBy', title: 'Reviewed by', type: 'reference', to: [{ type: 'author' }] }),
    defineField({ name: 'publishedAt', title: 'Published at', type: 'datetime' }),
    defineField({ name: 'coverImage', title: 'Cover image', type: 'image' }),
    defineField({ name: 'content', title: 'Content', type: 'array', of: [{ type: 'block' }, { type: 'image' }, { type: 'code' }] }),
  ],
})
