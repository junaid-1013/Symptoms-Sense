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
  // if (req.method !== "POST") {
  //   return res.status(405).json({ error: "Method Not Allowed" });
  // }
  const body = await request.json();
  console.log("key api", process.env.OPENAI_API_KEY);

  const query = body.query;
  console.log("req", query);

  try {
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

    const systemTemplate =
      "You are a medical practitioner that helps patients diagnose their problems based on the {context} and give them suitable recommendations.";
    const humanTemplate = "{input}";
    const chatPrompt = ChatPromptTemplate.fromMessages([
      ["system", systemTemplate],
      ["human", humanTemplate],
    ]);

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
  }
}

// import { NextResponse } from 'next/server';
// import {chain} from "@/utils/chain";
// import {Message} from "@/types/message";

// export async function POST(request: Request) {

//     const body = await request.json();
//     const question: string = body.query;
//     const history: Message[] = body.history ?? []

//     const res = await chain.call({
//             question: question,
//             chat_history: history.map(h => h.content).join("\n"),
//         });

//     console.log(res.sourceDocuments)

//     const links: string[] = Array.from(new Set(res.sourceDocuments.map((document: {metadata: {source: string}}) => document.metadata.source)))
//     return NextResponse.json({role: "assistant", content: res.text, links: links})
// }
