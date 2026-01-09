import {defineField, defineType} from 'sanity'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type SanityRule = {
  required: () => SanityRule;
  unique: () => SanityRule;
  min: (n: number) => SanityRule;
  max: (n: number) => SanityRule;
  custom: (fn: (v: unknown) => string | boolean) => SanityRule;
  uri: (opts: { allowRelative: boolean }) => SanityRule;
  optional: () => SanityRule;
};

export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule: SanityRule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule: SanityRule) => Rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Draft', value: 'draft'},
          {title: 'Review', value: 'review'},
          {title: 'Scheduled', value: 'scheduled'},
          {title: 'Published', value: 'published'},
          {title: 'Archived', value: 'archived'},
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: {type: 'author'},
      validation: (Rule: SanityRule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description (excerpt)',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'answerSnippet',
      title: 'Resposta curta (Answer snippet)',
      type: 'text',
      rows: 4,
      description: 'Trecho curto para respostas rápidas e IA (40–70 palavras recomendado).',
    }),
    defineField({
      name: 'tldr',
      title: 'Resumo para IA (TL;DR)',
      type: 'text',
      rows: 6,
      description: 'Resumo em poucas linhas. Pode conter quebras de linha.',
    }),
    defineField({
      name: 'keyTakeaways',
      title: 'Principais pontos (Key takeaways)',
      type: 'array',
      of: [{type: 'string'}],
    }),
    defineField({
      name: 'category',
      title: 'Category (slug)',
      type: 'string',
      description: 'Slug simples usado pelo site/admin (ex.: "cuidados", "alimentacao").',
    }),
    defineField({
      name: 'categories',
      title: 'Categories (references)',
      type: 'array',
      of: [{type: 'reference', to: {type: 'category'}}],
      description: 'Taxonomia canônica (Sanity). Se definido, pode substituir o campo Category (slug) legado.',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'coverUrl',
      title: 'Cover URL (external)',
      type: 'url',
      validation: (Rule: SanityRule) => Rule.uri({allowRelative: true}).optional(),
      description: 'Se definido, tem prioridade sobre imagens. Aceita URL absoluta ou caminho relativo (/...).',
    }),
    defineField({
      name: 'faq',
      title: 'FAQ',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'faqItem',
          fields: [
            {name: 'question', title: 'Question', type: 'string', validation: (Rule: SanityRule) => Rule.required()},
            {name: 'answer', title: 'Answer', type: 'text', rows: 4, validation: (Rule: SanityRule) => Rule.required()},
          ],
        },
      ],
    }),
    defineField({
      name: 'sources',
      title: 'Sources',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'sourceItem',
          fields: [
            {name: 'label', title: 'Label', type: 'string'},
            {
              name: 'url',
              title: 'URL',
              type: 'url',
              validation: (Rule: SanityRule) => Rule.uri({allowRelative: false}).optional(),
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'blockContent',
      description: 'Corpo do artigo (Portable Text). Campo preferido.',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'blockContent',
      description: 'Campo legado. Use "Content" quando possível.',
    }),
  ],

  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'coverImage',
    },
    prepare(selection: { author?: string; title?: string; media?: unknown }) {
      const {author} = selection
      return {...selection, subtitle: author && `by ${author}`}
    },
  },
})
