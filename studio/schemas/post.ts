import {defineType, defineField} from 'sanity'

const bannedTerms = (process.env.BANNED_TERMS || '')
  .split(/[\r\n,;]+/)
  .map((term) => term.trim().toLowerCase())
  .filter(Boolean)

const validateBannedTerms = (fieldName: string) => (Rule: any) =>
  Rule.custom((value: string) => {
    if (!value || !bannedTerms.length) {
      return true
    }
    const normalized = value.toString().toLowerCase()
    const found = bannedTerms.filter((term) => normalized.includes(term))
    return found.length
      ? `O campo "${fieldName}" menciona termos proibidos (${found.join(', ')}).`
      : true
  })

const countLines = (value?: string) => (value ? value.split(/\r?\n/).filter(Boolean).length : 0)

export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule: any) =>
        Rule.required()
          .unique()
          .custom(validateBannedTerms('Title')),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (Rule: any) => Rule.required().unique().custom(validateBannedTerms('Slug')),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      validation: (Rule: any) =>
        Rule.required()
          .min(60)
          .max(300)
          .custom(validateBannedTerms('Description')),
    }),
    defineField({
      name: 'tldr',
      title: 'TL;DR',
      type: 'text',
      description: 'Resumo contextual de 2 a 4 linhas (até 4 quebras de linha).',
      validation: (Rule: any) =>
        Rule.required()
          .max(500)
          .custom((value: string) => {
            if (!value) return true
            const lines = countLines(value)
            return lines >= 2 && lines <= 4 ? true : 'TL;DR precisa ter entre 2 e 4 linhas.'
          })
          .custom(validateBannedTerms('TL;DR')),
    }),
    defineField({
      name: 'keyTakeaways',
      title: 'Key takeaways',
      type: 'array',
      of: [{ type: 'string' }],
      validation: (Rule: any) => Rule.required().min(3).max(5),
    }),
    defineField({
      name: 'faq',
      title: 'FAQ',
      type: 'array',
      of: [
        defineField({
          type: 'object',
          name: 'faqItem',
          fields: [
            {
              name: 'question',
              title: 'Question',
              type: 'string',
              validation: (Rule: any) => Rule.required().custom(validateBannedTerms('FAQ question')),
            },
            {
              name: 'answer',
              title: 'Answer',
              type: 'text',
              validation: (Rule: any) => Rule.required().custom(validateBannedTerms('FAQ answer')),
            },
          ],
          preview: {
            select: {
              title: 'question',
              subtitle: 'answer',
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'sources',
      title: 'Sources',
      type: 'array',
      of: [
        defineField({
          name: 'sourceEntry',
          title: 'Source entry',
          type: 'object',
          fields: [
            {
              name: 'label',
              title: 'Label',
              type: 'string',
            },
            {
              name: 'url',
              title: 'URL',
              type: 'url',
              validation: (Rule: any) => Rule.uri({ allowRelative: false }),
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: 'lastReviewedAt',
      title: 'Last reviewed at',
      type: 'datetime',
    }),
    defineField({
      name: 'reviewedBy',
      title: 'Reviewed by',
      type: 'reference',
      to: [{ type: 'author' }],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [{ type: 'block' }, { type: 'image' }, { type: 'code' }],
      validation: (Rule: any) => Rule.required(),
    }),
  ],
})
