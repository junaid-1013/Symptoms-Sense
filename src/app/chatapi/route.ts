// @ts-ignore
import { config } from "dotenv";
config();

import { NextRequest, NextResponse } from "next/server";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export async function POST(request: NextRequest, res: NextResponse) {
  const body = await request.json();
  const query = body.query;
  const conversation_history: { role: string; content: string }[] = [];
  const messages_array: { role: string; content: string }[] = body.history;
  try {
    //setting chat template
    const systemTemplate =
      "As a medical professional, your role involves diagnosing patient issues using the provided {context} and providing appropriate treatment suggestions. You are a doctor and respond like a doctor. Do not say that you are not a doctor. Do not reply to queries other than medical queries.";
    conversation_history.push({
      role: "system",
      content: `${systemTemplate}. `,
    });
    if (!messages_array) {
      conversation_history.push({
        role: "user",
        content: query,
      });
    } else {
      for (const message of messages_array) {
        conversation_history.push({
          role: message.role,
          content: message.content,
        });
      }
      conversation_history.push({ role: "user", content: query });
    }
    const gpt_array: { role: string; content: string }[] = [];
    for (const interaction of conversation_history) {
      gpt_array.push({
        role: interaction.role,
        content: interaction.content,
      });
    }
    //api
    const apiKey = process.env.OPENAI_API_KEY;
    const chatModel = new ChatOpenAI({
      apiKey,
    } as any);

    const loader = new PDFLoader("src/app/chatapi/book.pdf", {
      splitPages: false,
    });
    const book = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docOutput = await splitter.splitDocuments([
      new Document({ pageContent: String(book) }),
    ]);

    const embeddings = new OpenAIEmbeddings();

    const vectorstore = await MemoryVectorStore.fromDocuments(
      docOutput,
      embeddings
    );
    const chatPrompt = ChatPromptTemplate.fromMessages(
      gpt_array.map(({ role, content }) => [role, content])
    );

    const documentChain = await createStuffDocumentsChain({
      llm: chatModel,
      prompt: chatPrompt,
    });
    const retriever = vectorstore.asRetriever();
    const retrievalChain = await createRetrievalChain({
      combineDocsChain: documentChain,
      retriever,
    });

    const result = await retrievalChain.invoke({
      input: query,
    });

    return NextResponse.json({ data: result.answer });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ data: "You exceeded your current quota, please check your plan and billing details."})
  }
}
