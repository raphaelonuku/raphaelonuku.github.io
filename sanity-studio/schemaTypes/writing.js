import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "writing",
  title: "Writing",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string" }),
    defineField({ name: "subtitle", title: "Subtitle", type: "text", rows: 3 }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      initialValue: "Reflections",
      options: {
        list: ["Reflections", "Experiences", "Mentorship", "Science and Society", "Community", "Announcements"],
        layout: "dropdown"
      }
    }),
    defineField({ name: "series", title: "Series label", type: "string", description: "Optional, for example Part 1" }),
    defineField({
      name: "slug",
      title: "Web address",
      type: "slug",
      description: "Select Generate once after entering the title",
      options: { source: "title", maxLength: 96 }
    }),
    defineField({ name: "publishedAt", title: "Publication date", type: "datetime", initialValue: () => new Date().toISOString() }),
    defineField({ name: "summary", title: "Short summary", type: "text", rows: 4, description: "Used on the Writing page and homepage" }),
    defineField({
      name: "image",
      title: "Article image",
      type: "image",
      options: { hotspot: true },
      fields: [defineField({ name: "alt", title: "Image description", type: "string" })]
    }),
    defineField({ name: "socialImage", title: "Sharing image", type: "image", description: "Optional image used when the article link is shared" }),
    defineField({
      name: "body",
      title: "Article",
      type: "array",
      of: [
        defineArrayMember({
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "Heading 2", value: "h2" },
            { title: "Heading 3", value: "h3" },
            { title: "Quote", value: "blockquote" }
          ]
        }),
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [defineField({ name: "alt", title: "Image description", type: "string" })]
        })
      ]
    })
  ],
  orderings: [{ title: "Newest first", name: "publishedAtDesc", by: [{ field: "publishedAt", direction: "desc" }] }],
  preview: {
    select: { title: "title", subtitle: "category", media: "image" },
    prepare: ({ title, subtitle, media }) => ({ title: title || "Untitled draft", subtitle: subtitle || "Writing", media })
  }
});
