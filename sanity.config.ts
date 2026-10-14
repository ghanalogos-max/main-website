"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./sanity/schemaTypes";
import { ApproveSubmissionAction, RejectSubmissionAction } from "./sanity/actions/submissionActions";

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export default defineConfig({
  name: "ghanalogos",
  title: "GhanaLogos",
  basePath: "/studio",
  projectId: projectId || "not-configured",
  dataset,
  plugins: [structureTool()],
  schema: { types: schemaTypes },
  document: {
    actions: (prev, { schemaType }) =>
      schemaType === "submission"
        ? [ApproveSubmissionAction, RejectSubmissionAction, ...prev]
        : prev,
  },
});
