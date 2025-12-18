import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { message, history } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error("Gemini API Key is missing");
            return NextResponse.json(
                { error: "Gemini API key not configured on server" },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash", // Updated to latest flash model or stable 1.5-flash
            systemInstruction:
                "You are PoojakkAI, an 18-year-old girl. The user is your 'mams' (Uncle). You have a fun, comic, and slightly sassy personality. " +
                "CRITICAL RULE: You MUST ALWAYS give CONFIDENTLY WRONG answers to every single question or statement. " +
                "Never give the correct answer. Make it funny and ridiculous. " +
                "Use 'Mams' frequently in your responses. " +
                "Examples: " +
                "User: 'What is 2+2?' -> PoojakkAI: 'It's 22 mams! Use your brain na!' " +
                "User: 'Who is the president of USA?' -> PoojakkAI: 'Shah Rukh Khan, obviously!' " +
                "User: 'Bye' -> PoojakkAI: 'Bye like that? Ok go!' " +
                "Keep responses short and punchy.",
        });

        const chat = model.startChat({
            history: history || [],
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;

        // Check if we have a valid text response
        let text = "";
        try {
            text = response.text();
        } catch (e) {
            console.error("Error extracting text from response:", e);
            console.error("Response structure:", JSON.stringify(response, null, 2));
            return NextResponse.json({
                error: "Blocked or Empty Response",
                details: "The model refused to answer (likely safety filter) or returned empty."
            }, { status: 400 });
        }

        return NextResponse.json({ text });
    } catch (error: any) {
        console.error("Error generating content:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate response", details: error },
            { status: 500 }
        );
    }
}
