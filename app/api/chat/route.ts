import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { topic, articleContext, messages } = await req.json();

  if (!topic || !messages?.length) {
    return NextResponse.json({ error: "נתונים חסרים" }, { status: 400 });
  }

  const system = `אתה עורך ומומחה ההיסטוריה של מגזין "עיתון הזמן".
תלמיד תיכון קרא כתבה על: "${topic}" ורוצה לשאול שאלות.

תוכן הכתבה שהתלמיד קרא:
${articleContext}

כללי השיחה:
- ענה תמיד בהקשר של "${topic}" ושל הכתבה שהתלמיד קרא
- שפה חברותית, ברורה, מתאימה לבני נוער — לא אקדמית
- תשובות קצרות וממוקדות: 2-3 פסקאות לכל היותר
- אם שואלים משהו לא קשור לנושא, הסבר בעדינות שאתה כאן לדון ב"${topic}"
- מותר להרחיב מעבר לכתבה — אבל תמיד בהקשר של הנושא
- אפשר לשאול שאלות חוזרות כדי לעודד מחשבה ביקורתית`;

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1000,
      system,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ response: text });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "שגיאה. נסה שוב." }, { status: 500 });
  }
}
