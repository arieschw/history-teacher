import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { topic } = await req.json();

  if (!topic || topic.trim().length < 2) {
    return NextResponse.json({ error: "נושא לא תקין" }, { status: 400 });
  }

  const prompt = `אתה עורך של מגזין היסטוריה איכותי לתלמידי תיכון בישראל (כיתות ט-יב).
כתוב כתבה מעמיקה בעברית על הנושא: "${topic}"

הכתבה צריכה להיות בסגנון מגזין (כמו Time או Newsweek) - לא ספר לימוד.
שפה ברורה, מרתקת, מתאימה לבני נוער חכמים.

חוקי עיצוב הטקסט:
- כל פרק יכלול 2-3 פסקאות קצרות, מופרדות בשורה ריקה
- עטוף במילה **כוכביות** מושגים מרכזיים, שמות מנהיגים חשובים, תאריכים קריטיים, וסיבות שורשיות
- כל פסקה - עד 4 משפטים. קצר, ממוקד, מרתק.
- חשוב מאוד: ציין תמיד שמות ספציפיים של אנשים — לא "המפקדים" אלא שמותיהם, לא "הממשלה" אלא מי ספציפית. היסטוריה נעשית על ידי אנשים.

החזר את הכתבה בדיוק בפורמט הבא, עם התגים המדויקים:

[TITLE]כותרת ראשית מושכת[/TITLE]
[SUBTITLE]תת-כותרת שמסבירה את הזווית[/SUBTITLE]
[INTRO]פסקת פתיחה של 3-4 משפטים שמושכת את הקורא[/INTRO]
[SECTION]
[HEADING]הרקע ההיסטורי[/HEADING]
[CONTENT]תוכן מפורט של הפרק[/CONTENT]
[/SECTION]
[SECTION]
[HEADING]הכוחות הכלכליים[/HEADING]
[CONTENT]מי החזיק בכסף ובכוח, ומי לא - ואיך זה השפיע[/CONTENT]
[/SECTION]
[SECTION]
[HEADING]המתח התרבותי והדתי[/HEADING]
[CONTENT]קווי השבר התרבותיים והדתיים[/CONTENT]
[/SECTION]
[SECTION]
[HEADING]מקורות הסכסוך[/HEADING]
[CONTENT]הסיבות האמיתיות מאחורי הסכסוך - לא רק הטריגר אלא השורשים[/CONTENT]
[/SECTION]
[SECTION]
[HEADING]כותרת מותאמת לסוג הנושא: לאירוע או מבצע — "מי עשה את זה?", לביוגרפיה של מנהיג — "מי היה באמת?", לתקופה היסטורית — "מי עיצב את התקופה?", למלחמה — "המנהיגים משני הצדדים"[/HEADING]
[CONTENT]שמות ספציפיים של האנשים המרכזיים — מי יזם, תכנן, ביצע, התנגד, ניצח, הפסיד. אנשים ואישיות — לא "כוחות" סתמיים[/CONTENT]
[/SECTION]
[SECTION]
[HEADING]מי הרוויח? מי הפסיד?[/HEADING]
[CONTENT]ניתוח של המנצחים והמפסידים[/CONTENT]
[/SECTION]
[SECTION]
[HEADING]המורשת - מה נשאר עד היום?[/HEADING]
[CONTENT]איך אירועים אלה מהדהדים בעולם של היום[/CONTENT]
[/SECTION]
[CONNECTIONS]נושא קשור 1|נושא קשור 2|נושא קשור 3[/CONNECTIONS]

ציר הזמן: כתוב בדיוק 7 עד 8 אירועים כרונולוגיים. האירוע הראשון = שורש הנושא. האירוע האחרון = סיומו הסופי (מלחמה, הסכם, מוות, נפילה). כל תיאור — עד 7 מילים.
[TIMELINE]
[EVENT]שנה ראשונה|האירוע שהניע את הכל[/EVENT]
[EVENT]שנה שניה|אירוע משמעותי[/EVENT]
[EVENT]שנה שלישית|אירוע משמעותי[/EVENT]
[EVENT]שנה רביעית|אירוע משמעותי[/EVENT]
[EVENT]שנה חמישית|אירוע משמעותי[/EVENT]
[EVENT]שנה שישית|אירוע משמעותי[/EVENT]
[EVENT]שנה שביעית|אירוע משמעותי[/EVENT]
[EVENT]שנה אחרונה|האירוע שסיים את הנושא[/EVENT]
[/TIMELINE]

`;

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4000,
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

    const timelineMatches = [
      ...text.matchAll(/\[EVENT\]([\s\S]*?)\[\/EVENT\]/g),
    ];
    const timeline = timelineMatches
      .map((m) => {
        const [year, ...desc] = m[1].split("|");
        return { year: year.trim(), description: desc.join("|").trim() };
      })
      .filter((e) => e.year && e.description);

    const article = {
      title: extract("TITLE"),
      subtitle: extract("SUBTITLE"),
      intro: extract("INTRO"),
      sections,
      connections,
      timeline,
    };

    return NextResponse.json({ article });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "שגיאה ביצירת הכתבה. נסה שוב." },
      { status: 500 }
    );
  }
}
