import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { topic } = await req.json();

  if (!topic) {
    return NextResponse.json({ error: "נושא חסר" }, { status: 400 });
  }

  const prompt = `רשום בדיוק 4 עד 5 מקורות אקדמיים מרכזיים ללמידה נוספת על הנושא: "${topic}"

כלול מגוון של:
- ספרי מחקר אקדמיים מוכרים ומוערכים
- מקורות ראשוניים רלוונטיים (אם קיימים)
- חיבורים אקדמיים חשובים שכתוצאה מהם השתנתה ההבנה ההיסטורית

חוקים:
- אל תכלול ויקיפדיה או אנציקלופדיות כלליות
- כלול רק מקורות שאכן קיימים ומוכרים
- העדף מקורות שתלמיד תיכון מתקדם או סטודנט יכול להשיג

החזר בפורמט הבא בלבד:
[SOURCES]
[SOURCE]כותרת המקור|שם המחבר|הסבר קצר למה הוא חשוב לנושא זה[/SOURCE]
[SOURCE]כותרת המקור|שם המחבר|הסבר קצר למה הוא חשוב לנושא זה[/SOURCE]
[SOURCE]כותרת המקור|שם המחבר|הסבר קצר למה הוא חשוב לנושא זה[/SOURCE]
[SOURCE]כותרת המקור|שם המחבר|הסבר קצר למה הוא חשוב לנושא זה[/SOURCE]
[/SOURCES]`;

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    const sourceMatches = [...text.matchAll(/\[SOURCE\]([\s\S]*?)\[\/SOURCE\]/g)];
    const sources = sourceMatches
      .map((m) => {
        const parts = m[1].split("|");
        return {
          title: parts[0]?.trim() ?? "",
          author: parts[1]?.trim() ?? "",
          description: parts[2]?.trim() ?? "",
        };
      })
      .filter((s) => s.title);

    return NextResponse.json({ sources });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "שגיאה בטעינת מקורות." }, { status: 500 });
  }
}
