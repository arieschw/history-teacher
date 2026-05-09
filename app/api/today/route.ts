import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic();

export async function GET() {
  const now = new Date();
  const day = now.getDate();
  const monthNames = [
    "ינואר","פברואר","מרץ","אפריל","מאי","יוני",
    "יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר",
  ];
  const monthName = monthNames[now.getMonth()];

  const prompt = `היום הוא ה-${day} ב${monthName}.

ציין בדיוק 5 אירועים היסטוריים בולטים שהתרחשו בתאריך זה (${day} ב${monthName}) בשנים שונות לאורך ההיסטוריה.
אם קיים אירוע שישי שהוא יוצא דופן בחשיבותו ההיסטורית, הוסף אותו.

כללים:
- טווח הזמן: לפחות 2000 השנים האחרונות — כלול אירועים מהעת העתיקה (רומא, יוון, האימפריה הביזנטית, האסלאם הקדום, סין העתיקה וכו') כשיש תיעוד היסטורי מדויק לתאריך
- שאף לפיזור כרונולוגי — לא כל האירועים מהמאה ה-19 וה-20
- גיוון גיאוגרפי — לא רק ישראל/יהדות, כלול אירועים גלובליים
- כלול אירועים ממגוון תחומים: מלחמות, מדע, פוליטיקה, תרבות, גילויים, עלייתם ונפילתם של שליטים
- שם האירוע — קצר ותיאורי (3-6 מילים)
- סיכום — משפט אחד בלבד, ממוקד, מרתק

פורמט מדויק — כל אירוע בשורות נפרדות:
[EVENT]
[NAME]שם האירוע[/NAME]
[YEAR]1234[/YEAR]
[SUMMARY]משפט סיכום אחד[/SUMMARY]
[/EVENT]`;

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    const eventMatches = [...text.matchAll(/\[EVENT\]([\s\S]*?)\[\/EVENT\]/g)];
    const events = eventMatches.map((m) => {
      const block = m[1];
      const name  = block.match(/\[NAME\]([\s\S]*?)\[\/NAME\]/)?.[1]?.trim() ?? "";
      const year  = block.match(/\[YEAR\]([\s\S]*?)\[\/YEAR\]/)?.[1]?.trim() ?? "";
      const summary = block.match(/\[SUMMARY\]([\s\S]*?)\[\/SUMMARY\]/)?.[1]?.trim() ?? "";
      return { name, year, summary };
    }).filter((e) => e.name && e.year);

    return NextResponse.json({ events, day, monthName });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "שגיאה בטעינת אירועי היום." }, { status: 500 });
  }
}
