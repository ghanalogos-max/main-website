import { defineField, defineType } from "sanity";

export default defineType({
  name: "submission",
  title: "Logo Submission",
  type: "document",
  fields: [
    defineField({ name: "companyName", title: "Company Name", type: "string" }),
    defineField({ name: "submitterName", title: "Submitter Name", type: "string" }),
    defineField({ name: "submitterEmail", title: "Submitter Email", type: "string" }),
    defineField({ name: "file", title: "File", type: "file" }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: { list: ["pending", "approved", "rejected"] },
      initialValue: "pending",
    }),
  ],
});