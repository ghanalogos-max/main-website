import { defineField, defineType } from "sanity";

export default defineType({
  name: "logo",
  title: "Logo",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Company Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "categories",
      title: "Categories",
      type: "array",
      of: [{ type: "reference", to: [{ type: "category" }] }],
    }),
    defineField({
      name: "svgFile",
      title: "SVG File",
      type: "file",
      options: { accept: ".svg" },
      description: "Required unless only a PNG exists",
    }),
    defineField({
      name: "pngFile",
      title: "PNG File (fallback/preview)",
      type: "image",
    }),
    defineField({
      name: "brandColor",
      title: "Primary Brand Color (hex)",
      type: "string",
    }),
    defineField({
      name: "website",
      title: "Company Website",
      type: "url",
    }),
    defineField({
      name: "description",
      title: "Short description (shown on the logo page, good for SEO)",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "sourceUrl",
      title: "Official source URL",
      type: "url",
    }),
    defineField({
      name: "sourceNote",
      title: "Source / Brand Guideline Link",
      type: "text",
      description: "Where this logo was sourced from, for verification",
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "downloadCount",
      title: "Download Count",
      type: "number",
      initialValue: 0,
      readOnly: true,
    }),
  ],
  preview: {
    select: { title: "name", media: "pngFile" },
  },
});