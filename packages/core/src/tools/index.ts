import { FunctionDeclaration, Schema, SchemaType } from "@google/generative-ai";

export const extractSectionTool: FunctionDeclaration = {
  name: "extract_section",
  description: "Extract a named section from the loaded paper (e.g., abstract, introduction, methodology, results, conclusion, references)",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      sectionName: {
        type: SchemaType.STRING,
        description: "The name of the section to extract precisely.",
      },
    },
    required: ["sectionName"],
  },
};

export const searchPaperTextTool: FunctionDeclaration = {
  name: "search_paper_text",
  description: "Find occurrences of semantic fragments or keywords in the paper.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      query: { type: SchemaType.STRING, description: "Search query string or keywords" },
    },
    required: ["query"],
  },
};

export const webSearchTool: FunctionDeclaration = {
  name: "web_search",
  description: "Retrieve current external information to contextualize claims if not present in the paper",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      query: { type: SchemaType.STRING, description: "Search query to run on external sources" },
    },
    required: ["query"],
  },
};

export const citeEvidenceTool: FunctionDeclaration = {
  name: "cite_evidence",
  description: "Pull a verbatim passage with page + paragraph reference from the document to substantiate a claim.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      claim: { type: SchemaType.STRING, description: "The claim you want to find textual evidence for" },
    },
    required: ["claim"],
  },
};

export const summarizeSectionTool: FunctionDeclaration = {
  name: "summarize_section",
  description: "Generate a structured summary of any section",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      sectionText: { type: SchemaType.STRING, description: "Text of the section to summarize" },
      focus: { type: SchemaType.STRING, description: "Specific focus of the summary (e.g. methodology, limitations)" },
    },
    required: ["sectionText"],
  },
};

export const allTools = [
  extractSectionTool,
  searchPaperTextTool,
  webSearchTool,
  citeEvidenceTool,
  summarizeSectionTool,
];
