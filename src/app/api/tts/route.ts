import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { text, lang, voiceProfile, engine, parentApiKey } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Missing text content' }, { status: 400 });
    }

    // 1. CapCut AI Voice (Using free public ByteDance TTS endpoints)
    if (engine === 'capcut') {
      try {
        let speaker = 'vi_female_codoc'; // Default Chị Google
        if (voiceProfile && voiceProfile.includes('mc')) {
          speaker = 'vi_male_codoc'; // MC Việt Nam
        }

        const ttsResponse = await fetch("https://api16-normal-vone.tiktokv.com/media/api/text/speech/start/?device_id=6808738379435640325&device_type=postman&app_version=20.2.1&iid=6808738379435640325&aid=1180", {
          method: "POST",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            text_speaker: speaker,
            req_text: text.substring(0, 150),
            speaker_map_type: "0",
            aid: "1180"
          }).toString()
        });

        if (!ttsResponse.ok) {
          const errText = await ttsResponse.text();
          throw new Error(`HTTP Error ${ttsResponse.status}: ${errText}`);
        }

        const textResponse = await ttsResponse.text();
        let ttsData;
        try {
          ttsData = JSON.parse(textResponse);
        } catch (e) {
          throw new Error(`Invalid response from CapCut API: ${textResponse}`);
        }
        
        if (ttsData.status_code === 0 && ttsData.data?.v_str) {
          return NextResponse.json({ audioContent: ttsData.data.v_str });
        } else {
          console.error("CapCut API Error:", ttsData);
          throw new Error(ttsData.message || ttsData.status_msg || "Failed to generate CapCut voice");
        }
      } catch (err: any) {
        console.error("CapCut integration error:", err);
        return NextResponse.json({ error: `Lỗi kết nối CapCut: ${err.message || err}` }, { status: 500 });
      }
    }

    // 2. Google Cloud / Gemini AI Studio (Using @google/genai SDK with gemini-3.1-flash-tts-preview)
    if (engine === 'google') {
      const apiKey = parentApiKey || process.env.Gemini_API_Key || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: 'Chưa cấu hình Gemini_API_Key trong tệp .env hoặc tài khoản Phụ huynh' }, { status: 400 });
      }

      let promptText = `Read the following text out loud in Vietnamese. Use a natural regional Vietnamese accent. `;
      if (voiceProfile && voiceProfile.includes('southern')) {
        promptText += `Use a soft, friendly Southern Vietnamese accent (giọng miền Nam). `;
      } else if (voiceProfile && voiceProfile.includes('central')) {
        promptText += `Use a clear Central Vietnamese accent (giọng miền Trung). `;
      } else {
        promptText += `Use a standard Northern Vietnamese accent (giọng miền Bắc). `;
      }
      
      if (lang === 'en') {
        promptText = `Read the following text out loud in English. Use a natural ${voiceProfile && voiceProfile.includes('gb') ? 'UK English' : 'US English'} accent. `;
      }

      promptText += `Text: "${text}"`;

      try {
        const ai = new GoogleGenAI({ apiKey });
        
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text: promptText }] }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { 
                  voiceName: lang === 'en' && voiceProfile.includes('gb') ? "Aoede" : "Kore" 
                }
              }
            }
          }
        });

        const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (data) {
          return NextResponse.json({ audioContent: data });
        } else {
          console.error("Gemini API Audio Response Error: No inlineData found.");
          throw new Error("Không nhận được dữ liệu âm thanh từ Gemini. Có thể do API Key không hợp lệ hoặc model không hỗ trợ.");
        }
      } catch (err: any) {
        console.error("Gemini TTS integration error:", err);
        return NextResponse.json({ error: `Lỗi kết nối Gemini: ${err.message || err}` }, { status: 500 });
      }
    }

    // 3. F5-TTS (Proxying to local F5-TTS FastAPI)
    if (engine === 'f5tts') {
      const f5Url = process.env.F5TTS_API_URL || 'http://localhost:8000/v1/tts';
      try {
        const f5Response = await fetch(f5Url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text,
            voice: voiceProfile
          })
        });
        
        if (f5Response.ok) {
          const buffer = Buffer.from(await f5Response.arrayBuffer());
          return NextResponse.json({ audioContent: buffer.toString('base64') });
        } else {
          throw new Error("F5-TTS local server returned error status");
        }
      } catch (err: any) {
        console.error("F5-TTS proxy error:", err);
        return NextResponse.json({ error: `Không thể kết nối máy chủ F5-TTS cục bộ (${f5Url}). Hãy chắc chắn máy chủ Python đang chạy.` }, { status: 500 });
      }
    }

    return NextResponse.json({ useNative: true });

  } catch (error: any) {
    console.error("TTS API Root Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
