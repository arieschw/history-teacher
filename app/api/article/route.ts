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

**זיהוי סוג הנושא — חובה לפני הכתיבה:**
זהה לאיזה סוג שייך הנושא. קרא בעיון את הדוגמאות:

- סוג א' — אירוע / תקופה / מלחמה / מהפכה: מלחמת העולם השנייה, המהפכה הצרפתית, נפילת רומא, מבצע יונתן
- סוג ב' — ביוגרפיה של אישיות / מנהיג: נפוליאון, ג'ינג'יס חאן, גולדה מאיר, יוליוס קיסר, נלסון מנדלה — כל נושא שהוא שם של אדם ספציפי
- סוג ג' — מקום / אתר / אזור גיאוגרפי: ירושלים, מצדה, רחבת שער האשפות, הכותל המערבי, ונציה, נהר הנילוס, שכונת הארלם — כל נושא שהוא מקום פיזי, כולל רחובות, כיכרות, שכונות, ערים, אתרים
- סוג ד' — תופעה / המצאה / תחום: כדורסל, הדפוס, הרנסנס, הציונות, הקולנוע, הרפואה המודרנית

בחר את ערכת הפרקים המתאימה לסוג שזיהית:

--- סוג א' — אירוע / תקופה / מלחמה ---
[SECTION][HEADING]הרקע ההיסטורי[/HEADING][CONTENT]ההקשר שהוביל לנושא[/CONTENT][/SECTION]
[SECTION][HEADING]הכוחות הכלכליים[/HEADING][CONTENT]מי החזיק בכסף ובכוח, ואיך זה השפיע[/CONTENT][/SECTION]
[SECTION][HEADING]המתח התרבותי והדתי[/HEADING][CONTENT]קווי השבר התרבותיים והדתיים[/CONTENT][/SECTION]
[SECTION][HEADING]שורשים וסיבות[/HEADING][CONTENT]הסיבות האמיתיות מאחורי האירוע — לא רק הטריגר אלא השורשים העמוקים[/CONTENT][/SECTION]
[SECTION][HEADING]המנהיגים משני הצדדים[/HEADING][CONTENT]שמות ספציפיים של האנשים המרכזיים[/CONTENT][/SECTION]
[SECTION][HEADING]מי הרוויח? מי הפסיד?[/HEADING][CONTENT]ניתוח המנצחים והמפסידים[/CONTENT][/SECTION]
[SECTION][HEADING]המורשת - מה נשאר עד היום?[/HEADING][CONTENT]איך זה מהדהד בעולם של היום[/CONTENT][/SECTION]

--- סוג ב' — ביוגרפיה של אישיות ---
[SECTION][HEADING]הילד שיהפוך לאגדה[/HEADING][CONTENT]ילדות, מוצא, הגורמים שעיצבו את האישיות[/CONTENT][/SECTION]
[SECTION][HEADING]הדרך לשלטון[/HEADING][CONTENT]כיצד עלה לגדולה — איזה כוחות, בריתות, מהלכים[/CONTENT][/SECTION]
[SECTION][HEADING]שיטת המנהיגות[/HEADING][CONTENT]איך שלט, קיבל החלטות, התייחס לאויבים ולנאמנים[/CONTENT][/SECTION]
[SECTION][HEADING]ההישגים הגדולים[/HEADING][CONTENT]מה בנה, כבש, יצר, שינה[/CONTENT][/SECTION]
[SECTION][HEADING]הצד האפל[/HEADING][CONTENT]כשלונות, אכזריות, שגיאות, מחיר האנושי[/CONTENT][/SECTION]
[SECTION][HEADING]הנפילה או הסוף[/HEADING][CONTENT]כיצד נגמר השלטון — מוות, הדחה, כישלון[/CONTENT][/SECTION]
[SECTION][HEADING]המורשת — מה נשאר עד היום?[/HEADING][CONTENT]איך האישיות הזו מהדהדת בעולם של היום[/CONTENT][/SECTION]

--- סוג ג' — מקום / אתר / אזור גיאוגרפי ---
[SECTION][HEADING]מה המקום הזה?[/HEADING][CONTENT]תיאור המקום, מיקומו, אופיו[/CONTENT][/SECTION]
[SECTION][HEADING]שכבות הזמן[/HEADING][CONTENT]מה קרה כאן לאורך ההיסטוריה — תקופה אחרי תקופה[/CONTENT][/SECTION]
[SECTION][HEADING]מי שלט, מי גר, מי נלחם כאן?[/HEADING][CONTENT]האנשים והעמים שעיצבו את המקום[/CONTENT][/SECTION]
[SECTION][HEADING]המשמעות התרבותית והדתית[/HEADING][CONTENT]למה המקום הזה חשוב — לאומית, דתית, תרבותית[/CONTENT][/SECTION]
[SECTION][HEADING]נקודות מפנה[/HEADING][CONTENT]האירועים שהשפיעו הכי הרבה על המקום[/CONTENT][/SECTION]
[SECTION][HEADING]המקום היום[/HEADING][CONTENT]מה קורה שם כיום, מה נשמר, מה השתנה[/CONTENT][/SECTION]

--- סוג ד' — תופעה / המצאה / תחום ---
[SECTION][HEADING]איך זה התחיל?[/HEADING][CONTENT]ראשית התופעה — מתי, איפה, בידי מי[/CONTENT][/SECTION]
[SECTION][HEADING]למה זה התפשט?[/HEADING][CONTENT]הגורמים החברתיים, כלכליים, תרבותיים שאפשרו את הצמיחה[/CONTENT][/SECTION]
[SECTION][HEADING]הדמויות שעיצבו את התחום[/HEADING][CONTENT]שמות ספציפיים של חלוצים, ממציאים, מנהיגי תנועה[/CONTENT][/SECTION]
[SECTION][HEADING]רגעי מפנה[/HEADING][CONTENT]האירועים שהגדירו מחדש את התחום[/CONTENT][/SECTION]
[SECTION][HEADING]השפעה על החברה[/HEADING][CONTENT]איך זה שינה את העולם — תרבותית, פוליטית, כלכלית[/CONTENT][/SECTION]
[SECTION][HEADING]היום ובעתיד[/HEADING][CONTENT]מצב התחום כיום ולאן הוא הולך[/CONTENT][/SECTION]

החזר את הכתבה בפורמט הבא עם התגים המדויקים (השתמש בערכת הפרקים המתאימה לסוג שזיהית):

[TITLE]כותרת ראשית מושכת[/TITLE]
[SUBTITLE]תת-כותרת שמסבירה את הזווית[/SUBTITLE]
[INTRO]פסקת פתיחה של 3-4 משפטים שמושכת את הקורא[/INTRO]
[SECTION]
[HEADING]כותרת הפרק[/HEADING]
[CONTENT]תוכן הפרק[/CONTENT]
[/SECTION]
... (המשך עם שאר הפרקים לפי הסוג שזיהית)
[CONNECTIONS]נושא קשור 1|נושא קשור 2|נושא קשור 3[/CONNECTIONS]

ציר הזמן: כתוב בדיוק 7 עד 8 אירועים כרונולוגיים.
- לסוג א': האירוע הראשון = שורש הנושא, האחרון = סיומו הסופי
- לסוג ב': מלידת האישיות עד מותה או סוף תקופתה
- לסוג ג': מהתיעוד הראשון של המקום עד היום
- לסוג ד': מהרגע הראשון של ההמצאה/תופעה עד מצבה כיום
כל תיאור — עד 7 מילים.
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
      temperature: 0.3,
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
