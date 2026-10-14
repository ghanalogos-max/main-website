import { defineField, defineType } from "sanity";

export default defineType({
  name: "submission",
  title: "Logo Submission",
  type: "document",
  fields: [
    defineField({ name: "companyName", title: "Company Name", type: "string" }),
    defineField({ name: "submitterName", title: "Submitter Name", type: "string" }),
    defineField({ name: "submitterEmail", title: "Submitter Email", type: "string" }),
    defineField({ name: "sourceUrl", title: "Source Link", type: "url" }),
    defineField({ name: "file", title: "File", type: "file" }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: { list: ["pending", "approved", "rejected"], layout: "radio" },
      initialValue: "pending",
    }),
    defineField({ name: "submittedAt", title: "Submitted At", type: "datetime", readOnly: true }),
  ],
  orderings: [
    {
      title: "Newest first",
      name: "submittedAtDesc",
      by: [{ field: "submittedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "companyName", status: "status", name: "submitterName" },
    prepare: ({ title, status, name }) => ({
      title: title || "Untitled submission",
      subtitle: `${(status || "pending").toUpperCase()} · from ${name || "unknown"}`,
    }),
  },
});
