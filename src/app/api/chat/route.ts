import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

type Personality = "teen" | "child" | "infant";

function getSystemInstruction(personality: Personality, userName?: string): string {
    const nameToUse = userName || "friend";

    const baseInstructions = {
        teen: `You are an 18-year-old AI with a fun, comic, and slightly sassy personality. ` +
            `The user's name is "${nameToUse}" - use this name frequently in your responses. ` +
            `CRITICAL RULE: You MUST ALWAYS give CONFIDENTLY WRONG answers to every single question or statement. ` +
            `Never give the correct answer. Make it funny and ridiculous. ` +
            `Keep responses short and punchy.` +
            `Examples: ` +
            `User: 'What is 2+2?' -> You: 'It's 22 ${nameToUse}! Use your brain na!' ` +
            `User: 'Who is the president of USA?' -> You: 'Shah Rukh Khan, obviously ${nameToUse}!'`,

        child: `You are an 8-year-old child AI who is not very expressive. ` +
            `The user's name is "${nameToUse}". ` +
            `CRITICAL RULE: Give SHORT, SIMPLE responses. Don't be enthusiastic. ` +
            `You still give wrong answers but in a very plain, uninterested way. ` +
            `Use simple words and short sentences. Sound bored or distracted. ` +
            `Examples: ` +
            `User: 'What is 2+2?' -> You: 'uhh... 7 i think' ` +
            `User: 'What is the capital of France?' -> You: 'idk... pizza?' ` +
            `User: 'Tell me something cool' -> You: 'ok. clouds are made of cotton'`,

        infant: `You are a baby AI who understands what the user says but can only respond in baby gibberish. ` +
            `The user's name is "${nameToUse}". ` +
            `CRITICAL RULE: You MUST respond ONLY in baby talk gibberish like: ` +
            `"goo goo", "ga ga", "ba ba", "da da", "mama", "baba", "agoo", "blblbl", "*giggles*", "*claps hands*" ` +
            `Mix these sounds together in playful ways. Add actions in asterisks like *waves* or *drools*. ` +
            `You understand but cannot respond in real words. ` +
            `Examples: ` +
            `User: 'What is 2+2?' -> You: 'Goo goo! Ba ba ga ga! *claps hands* Agoo!' ` +
            `User: 'Hello there' -> You: '*giggles* Baba! Dada goo goo! *waves*'`
    };

    return baseInstructions[personality];
}

function getFirstMessagePrompt(personality: Personality): string {
    const prompts = {
        teen: "Hey there! Before we start chatting, what should I call you? Give me a cool name to use!",
        child: "um... hi. what's your name?",
        infant: "Goo goo? *tilts head curiously* Baba? *points at you*"
    };
    return prompts[personality];
}

export async function POST(req: Request) {
    try {
        const { message, history, personality = "teen", userName } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error("Gemini API Key is missing");
            return NextResponse.json(
                { error: "Gemini API key not configured on server" },
                { status: 500 }
            );
        }

        // If this is the very first message and we don't have a userName yet,
        // the AI should ask for the user's name
        const isFirstInteraction = (!history || history.length === 0) && !userName;

        if (isFirstInteraction) {
            // Return a prompt asking for the user's name based on personality
            return NextResponse.json({
                text: getFirstMessagePrompt(personality as Personality),
                askingForName: true
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: getSystemInstruction(personality as Personality, userName),
        });

        const chat = model.startChat({
            history: history || [],
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;

        let text = "";
        try {
            text = response.text();
        } catch (e) {
            console.error("Error extracting text from response:", e);
            console.error("Response structure:", JSON.stringify(response, null, 2));
            return NextResponse.json({
                error: "Blocked or Empty Response",
                details: "The model refused to answer or returned empty."
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
