import {defineField, defineType} from 'sanity'

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
 name: 'author',
 title: 'Author',
 type: 'document',
 fields: [
 defineField({
 name: 'name',
 title: 'Name',
 type: 'string',
 validation: (Rule: SanityRule) => Rule.required(),
 }),
 defineField({
 name: 'slug',
 title: 'Slug',
 type: 'slug',
 options: { source: 'name' },
 validation: (Rule: SanityRule) => Rule.required().unique(),
 }),
 defineField({
 name: 'bio',
 title: 'Bio',
 type: 'text',
 validation: (Rule: SanityRule) => Rule.required().min(20),
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
