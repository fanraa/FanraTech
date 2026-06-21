import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, concept, image, apiKey, provider, baseUrl, modelId } = body;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "API Key AI belum dikonfigurasi. Silakan atur di menu Pengaturan AI." },
        { status: 400 }
      );
    }

    const API_PROVIDER = provider || "Gemini";

    const refinedConcept = concept ? `dengan konsep tambahan: "${concept}"` : "konsep bebas yang minimalis dan futuristik";

    let inlineData: any = null;
    let base64Data = "";
    if (image && typeof image === 'string' && image.startsWith("data:")) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        inlineData = {
          mimeType: match[1],
          data: match[2],
        };
        base64Data = match[2];
      }
    }

    const prompt = `
Anda adalah kurator dan analis desain kelas tinggi untuk "FanraTech Studio".
Tugas Anda adalah menganalisis gambar desain yang diunggah pengguna untuk kategori: "${category}" ${refinedConcept}.

${inlineData ? "PENTING: Pengguna telah mengunggah gambar desain mereka. Anda WAJIB menganalisis elemen visual, bentuk, warna, dan nuansa gambar ini dengan SANGAT AKURAT." : "Hasilkan konsep fiktif kreatif bertema kreatif."}

PANDUAN EKSTRAKSI PALET WARNA (SANGAT KRITIKAL):
- Anda HARUS mengekstrak warna-warna hex utama, sekunder, dan aksen yang BENAR-BENAR MUNCUL dalam gambar yang diunggah (misalnya jika gambar berwarna merah muda dan merah, ekstrak hex merah muda dan merah sesungguhnya).
- JANGAN memaksakan palet warna gelap/monokrom FanraTech untuk gambar ini. Warna harus 100% otentik dari gambar desain.

Hasilkan keluaran dalam format JSON murni terstruktur tanpa kode pembungkus markdown (no backticks, no \`\`\`json) dengan kunci-kunci berikut dalam bahasa Indonesia yang elegan dan profesional:
{
  "title": "Judul desain yang catchy, modern, dan terdengar premium (3-6 kata) yang benar-benar merepresentasikan visual gambar/konsep",
  "shortDesc": "Deskripsi singkat 1 baris tentang bauran artistik dan esensi desain (10-15 kata) berdasarkan gambar/konsep",
  "longDesc": "Deskripsi lengkap mendalam berisi cerita kreatif, panduan grid, proporsi, filosofi, serta penjelasan tata letak (50-80 kata) berdasarkan visual gambar/konsep",
  "palette": ["#Hex1", "#Hex2", "#Hex3"], // array berisi 3 sampai 5 kode warna hex dominan yang DIEKSTRAK SECARA NYATA dari visual gambar (bisa warna apapun sesuai gambar!)
  "fonts": ["Ketik Nama Font", "Nama Font 2"] // array berisi 1 sampai 3 nama Google Font yang secara visual mirip dengan typography di gambar
}
`;

    let responseText = "{}";

    if (API_PROVIDER === "OpenAI_Compatible") {
      // Use generic fetch for OpenAI based APIs
      const apiUrl = baseUrl || "https://api.openai.com/v1/chat/completions";
      const model = modelId || "gpt-4o-mini"; 

      const messages: any[] = [
        {
          role: "user",
          content: [
            { type: "text", text: prompt }
          ]
        }
      ];

      if (inlineData) {
        messages[0].content.push({
          type: "image_url",
          image_url: { url: image } // Uses base64 data URI directly
        });
      }

      const headers: any = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      };

      if (apiUrl.includes("openrouter.ai")) {
        headers["HTTP-Referer"] = "https://fanratech.com";
        headers["X-Title"] = "FanraTech Studio";
      }

      const res = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages,
          response_format: { type: "json_object" }
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`AI API failed: ${res.statusText} - ${errText}`);
      }

      const completion = await res.json();
      responseText = completion.choices[0].message.content;
    } else {
      // Default to Native Gemini
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: { "User-Agent": "aistudio-build" },
        },
      });

      const contents: any[] = [];
      if (inlineData) contents.push({ inlineData });
      contents.push(prompt);

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
      });
      responseText = response.text || "{}";
    }
    
    // Clean potential markdown wrap
    const cleanJsonString = responseText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const output = JSON.parse(cleanJsonString);

    return NextResponse.json({ success: true, data: output });
  } catch (error: any) {
    console.error("AI fields generation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghasilkan konten AI" },
      { status: 500 }
    );
  }
}
