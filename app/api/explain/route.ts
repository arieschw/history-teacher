import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { term, parentTopic, surroundingText } = await req.json();

  if (!term) {
    return NextResponse.json({ error: "נושא לא תקין" }, { status: 400 });
  }

  const prompt = `אתה מורה להיסטוריה לתלמידי תיכון בישראל.

המשתמש קרא כתבה על: "${parentTopic}"
בתוך הכתבה הופיע המשפט הבא:
"${surroundingText}"

המשתמש לחץ על המושג: "${term}"

המשימה שלך: הסבר את "${term}" **אך ורק** בהקשר של "${parentTopic}" ושל המשפט שצוטט למעלה.
אסור להסביר את המושג בהקשרים אחרים — אפילו אם קיימים. כל ההסבר חייב להיות רלוונטי ישירות לנושא המאמר.

חוקי הכתיבה:
- שפה ברורה ומרתקת לבני נוער
- 2-3 פסקאות קצרות לכל פרק
- עטוף ב**כוכביות** מושגים מרכזיים, שמות ותאריכים חשובים

החזר בפורמט הבא בלבד:

[TITLE]כותרת שמשלבת את "${term}" ואת "${parentTopic}"[/TITLE]
[INTRO]פסקת פתיחה של 2-3 משפטים — ישירות לנושא[/INTRO]
[SECTION]
[HEADING]מה זה אומר בהקשר של ${parentTopic}[/HEADING]
[CONTENT]הסבר ממוקד בהקשר המאמר[/CONTENT]
[/SECTION]
[SECTION]
[HEADING]למה זה משנה לסיפור[/HEADING]
[CONTENT]איזה תפקיד מילא מושג זה ב${parentTopic}[/CONTENT]
[/SECTION]
[CONNECTIONS]נושא קשור 1|נושא קשור 2|נושא קשור 3[/CONNECTIONS]`;

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    const extract = (tag: string) => {
      const match = text.match(
        new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`)
      );
      return match ? match[1].trim() : "";
    };

    const sectionMatches = [
      ...text.matchAll(/\[SECTION\]([\s\S]*?)\[\/SECTION\]/g),
    ];
    const sections = sectionMatches.map((m) => {
      const block = m[1];
      const heading =
        block.match(/\[HEADING\]([\s\S]*?)\[\/HEADING\]/)?.[1]?.trim() ?? "";
      const content =
        block.match(/\[CONTENT\]([\s\S]*?)\[\/CONTENT\]/)?.[1]?.trim() ?? "";
      return { heading, content };
    });

    const connections = extract("CONNECTIONS")
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);

    return NextResponse.json({
      article: {
        title: extract("TITLE"),
        intro: extract("INTRO"),
        sections,
        connections,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "שגיאה ביצירת ההסבר. נסה שוב." },
      { status: 500 }
    );
  }
}
