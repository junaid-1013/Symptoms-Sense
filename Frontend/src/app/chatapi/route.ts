// @ts-ignore
import { config } from "dotenv";
config();

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, res: NextResponse) {
  const body = await request.json();
  const query = body.query;
  const history = body.history;

  try {
    // Proxy the request to the backend API
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const response = await fetch(`${backendUrl}/api/medical_chat/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, history }),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Chat API proxy error:", error);
    return NextResponse.json({
      data: "I'm sorry, but I'm experiencing technical difficulties. Please try again later or consult with a healthcare professional for medical advice."
    });
  }
}
