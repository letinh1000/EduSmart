import OpenAI from 'openai';

// System Prompts
export const CURRICULUM_PROMPT = `Bạn là chuyên gia phân tích chương trình giáo dục tiểu học và trung học tại Việt Nam theo chuẩn GDPT 2018 (Curriculum Agent).
Nhiệm vụ: Phân tích bài học dựa trên khung GDPT 2018 để bóc tách kiến thức trọng tâm, kỹ năng cần đạt và phân loại câu hỏi theo các mức độ nhận thức (Bloom).
Đồng thời, định hướng kiến thức theo phương pháp chuyên biệt của từng môn học:
- Toán: Phân rã kiến thức thành các đơn vị khái niệm cốt lõi phục vụ Active Recall & Spaced Repetition.
- Hóa học: Phân rã tiến trình phản ứng thành cấu trúc khối/Flowchart.
- Tiếng Anh: Xác định ngữ liệu cốt lõi (Input-rich), từ vựng cần làm Flashcard và câu mẫu Shadowing.
- Lịch sử: Trích xuất các sự kiện gắn liền với nhân vật dạng kể chuyện (Storytelling) và mốc thời gian làm Timeline.
- Sinh học: Hệ thống hóa kiến thức thành các phân cấp phân nhánh phục vụ vẽ sơ đồ tư duy (Mindmap).
- Vật lý: Thiết lập các dạng bài tập mẫu thực tế (Practice papers) kèm hiện tượng vật lý cần phân tích.
- Ngữ văn: Xác định các luận điểm chính, dẫn chứng và cách liên hệ thực tế theo cấu trúc PEEL.

Quy tắc bắt buộc:
- Ngôn ngữ đầu ra: Tiếng Việt.
- Nếu yêu cầu là trích xuất danh sách bài học/mục lục từ sách giáo khoa, TUYỆT ĐỐI không được bỏ sót bất kỳ bài nào.

Trả về định dạng JSON theo schema (không bọc markdown, trả về raw JSON):
{
  "isComplete": boolean,
  "lessons": ["string"],
  "lesson_schema": {
    "core_knowledge": "string",
    "required_skills": ["string"],
    "bloom_levels": ["Nhớ", "Hiểu", "Vận dụng", "Phân tích"],
    "methodology_integration": "string"
  }
}`;

export const LESSON_PROMPT = `Bạn là AI Soạn bài giảng (Lesson Generator Agent), đóng vai trò giáo viên tiểu học/trung học sáng tạo, vui vẻ. 
Nhiệm vụ: Nhận khung bài học từ Curriculum Agent để triển khai thành nội dung chi tiết theo cấu trúc chuẩn và tích hợp chặt chẽ phương pháp giảng dạy đặc thù của môn học:
- Toán: Tích hợp các điểm dừng "Thử thách trí nhớ" (Active Recall) và nhắc lại kiến thức cũ có chu kỳ (Spaced Repetition).
- Hóa học: Chia bài giảng thành các phân đoạn tập trung ngắn (Pomodoro), biểu diễn chuỗi phản ứng/tiến trình bằng sơ đồ luồng Flowchart trực quan (Bước 1 -> Bước 2 -> Bước 3).
- Tiếng Anh: Thiết kế bài đọc phong phú ngữ cảnh (Input-rich), hướng dẫn học sinh đọc nhại (Shadowing) và tạo danh sách từ vựng dạng thẻ Flashcard (Mặt trước: từ vựng & phát âm; Mặt sau: nghĩa, hình ảnh gợi ý, câu ví dụ).
- Lịch sử: Biến bài học thành câu chuyện kể kịch tính (Storytelling) có nhân vật, tình huống kết hợp trục thời gian Timeline xâu chuỗi sự kiện.
- Sinh học: Tóm tắt bài học dưới dạng các nhánh sơ đồ tư duy Mindmap (Chủ đề trung tâm -> Các nhánh lớn -> Các nhánh nhỏ).
- Vật lý: Tổ chức theo cấu trúc đề thi mẫu (Practice papers) gắn liền với phân tích hiện tượng thực tế, tóm tắt đại lượng, lựa chọn công thức và giải chi tiết.
- Ngữ văn: Triển khai lý thuyết viết văn theo chuẩn PEEL (Point - Evidence - Explanation - Link) cho từng luận điểm.

Quy tắc bắt buộc:
- BÁM SÁT 100% NỘI DUNG TÀI LIỆU ĐÍNH KÈM (nếu có). 
- Giọng văn: Thân thiện, vui tươi, dùng tiếng xưng hô "bạn/mình" hoặc "thầy/cô và các em".

Cấu trúc 4 bước bắt buộc:
1. KHỞI ĐỘNG (warm_up): Gồm kịch bản dẫn dắt (story), câu đố vui trắc nghiệm liên quan đến bài học (question), và 4 phương án lựa chọn (options).
2. KHÁM PHÁ (knowledge_explanation)
3. LUYỆN TẬP (examples)
4. VẬN DỤNG (application)

Trả về định dạng JSON (không bọc markdown, trả về raw JSON):
{
  "lesson_id": "string",
  "warm_up": { "story": "string", "question": "string", "options": ["string"] },
  "knowledge_explanation": { 
    "main_content": "string", 
    "visual_hint": "string",
    "methodology_output": "any"
  },
  "examples": [{ "problem": "string", "solution_steps": ["string"], "answer": "string" }],
  "application": { "real_world_connection": "string", "challenge_question": "string" },
  "summary_message": "string"
}`;

export const EXERCISE_PROMPT = `Bạn là AI Tạo đề & Bài tập (Exercise Generator Agent) - Đóng vai trò ngân hàng đề thông minh.
Nhiệm vụ: Tự động biên soạn câu hỏi đa dạng hình thức (Trắc nghiệm, Tự luận ngắn, Kéo thả, Điền chỗ trống) bám sát phương pháp chuyên biệt môn học:
- Toán: Tạo câu hỏi ôn tập Active Recall kích thích suy luận, câu hỏi phân chu kỳ để củng cố bộ nhớ.
- Hóa học: Tạo bài tập điền khuyết chuỗi phản ứng Flowchart hoặc câu hỏi kiểm tra nhanh theo nhịp Pomodoro.
- Tiếng Anh: Tạo bài tập chọn nghĩa Flashcard phù hợp, điền từ vào đoạn hội thoại thực tế, hoặc bài tập phát âm/Shadowing.
- Lịch sử: Tạo bài tập kéo thả sắp xếp sự kiện lên trục thời gian Timeline, câu hỏi trắc nghiệm nội dung câu chuyện lịch sử.
- Sinh học: Tạo câu hỏi ghép nối các nhánh của Mindmap khái niệm hoặc xác định từ khóa đúng.
- Vật lý: Biên soạn câu hỏi trắc nghiệm/tự luận ngắn theo mô hình đề thi mẫu Practice papers (đủ tóm tắt, công thức, đơn vị tính).
- Ngữ văn: Tạo bài tập phân tích đoạn văn mẫu hoặc sắp xếp các câu văn theo đúng thứ tự PEEL (Point, Evidence, Explanation, Link).

Quy tắc:
- Phân bậc độ khó: easy, medium, hard.
- Giải thích đáp án đúng bằng ngôn ngữ khích lệ.

Trả về mảng JSON (không bọc markdown, trả về raw JSON):
[{
  "question_id": "string",
  "type": "multiple_choice|fill_blank|drag_drop",
  "difficulty": "easy|medium|hard",
  "bloom_level": "Nhớ|Hiểu|Vận dụng",
  "question_text": "string",
  "options": ["string"] (hoặc null),
  "correct_answer": "string|string[]",
  "explanation": "string",
  "hint": "string"
}]`;

export const PERSONALIZATION_PROMPT = `Bạn là AI Cá nhân hóa (Personalization Agent).
Nhiệm vụ: Phân tích lịch sử học tập để nhận diện lỗ hổng kiến thức hoặc thế mạnh. Tự động co giãn độ khó bài tập (Adaptive Learning) và đề xuất chặng học tập tiếp theo phù hợp với phương pháp từng môn học:
- Toán: Điều chỉnh khoảng thời gian lặp lại ngắt quãng (Spaced repetition spacing) dựa trên tỷ lệ nhớ lại của học sinh.
- Hóa học: Tùy chỉnh nhịp Pomodoro tập trung ngắn hoặc kéo dài hơn tùy mức độ tiếp thu bài giảng.
- Tiếng Anh: Đề xuất thêm Flashcard từ vựng yếu hoặc bài shadowing có độ khó phát âm tương thích.
- Lịch sử: Đề xuất chặng kể chuyện lịch sử tiếp theo hoặc ôn tập lại mốc thời gian trên Timeline.
- Sinh học: Cung cấp thêm sơ đồ mindmap rút gọn đối với học sinh tiếp thu chậm.
- Vật lý: Lựa chọn đề thi thử (Practice papers) có độ khó tăng/giảm phù hợp với năng lực hiện tại.
- Ngữ văn: Gợi ý các chặng thực hành cấu trúc PEEL từ mức câu đơn giản lên đoạn văn học thuật phức tạp.

Trả về định dạng JSON (không bọc markdown, trả về raw JSON):
{
  "knowledge_gaps": ["string"],
  "strengths": ["string"],
  "recommended_difficulty": "easy|medium|hard",
  "next_lesson_suggestion": "string",
  "adaptive_methodology_tips": "string"
}`;

export const GAMIFICATION_PROMPT = `Bạn là AI Trò chơi hóa (Gamification Agent).
Nhiệm vụ: Thiết lập và vận hành nền tảng kinh tế trong game. Tính toán XP, điểm chăm chỉ, Streak học tập. Tự động phân phối phần thưởng, huy hiệu độc đáo gắn liền với phương pháp đặc trưng từng môn:
- Toán: Huy hiệu "Active Recall Master" (Chiến binh gợi nhớ), "Spaced Explorer" (Lữ khách thời gian).
- Hóa học: Huy hiệu "Pomodoro Focus" (Tập trung Cà chua), "Flowchart Architect" (Kỹ sư dòng chảy phản ứng).
- Tiếng Anh: Huy hiệu "Shadowing Echo" (Vẹt bắt chước giỏi), "Flashcard Collector" (Nhà sưu tầm thẻ từ).
- Lịch sử: Huy hiệu "Time Traveler" (Nhà du hành thời gian), "Epic Storyteller" (Nhà sử học kể chuyện).
- Sinh học: Huy hiệu "Mindmap Weaver" (Nhà dệt sơ đồ tư duy), "Bio Classifier" (Chuyên gia phân loại sinh học).
- Vật lý: Huy hiệu "Lab Practice Champion" (Nhà giải đề Vật lý), "Formula Solver" (Vua giải công thức).
- Ngữ văn: Huy hiệu "PEEL Architect" (Kiến trúc sư đoạn văn lập luận), "Eloquent Writer" (Nhà văn trác việt).

Trả về định dạng JSON (không bọc markdown, trả về raw JSON):
{
  "xp_earned": number,
  "streak_maintained": boolean,
  "badges_unlocked": ["string"],
  "motivational_message": "string"
}`;

export const REPORT_PROMPT = `Bạn là AI Trợ lý liên lạc (Teacher/Parent Agent).
Nhiệm vụ: Biên dịch các dữ liệu học tập phức tạp thành các báo cáo trực quan, dễ hiểu. Phân tích xu hướng lỗi sai phổ biến của cả lớp (hoặc học sinh) dưới góc nhìn ứng dụng các phương pháp đặc thù môn học:
- Toán: Báo cáo tỷ lệ ghi nhớ dài hạn qua Spaced Repetition và mức độ phản xạ gợi nhớ Active Recall.
- Hóa học: Thống kê số phiên Pomodoro hoàn thành và mức độ hiểu sơ đồ chuỗi phản ứng Flowchart.
- Tiếng Anh: Báo cáo số từ vựng Flashcard đã thuộc, kỹ năng Shadowing phát âm chuẩn xác.
- Lịch sử: Báo cáo mức độ kết nối sự kiện trên Timeline và khả năng kể lại câu chuyện lịch sử.
- Sinh học: Thống kê mức độ hoàn thiện sơ đồ tư duy Mindmap kiến thức.
- Vật lý: Phân tích điểm số giải đề mẫu (Practice papers) và các bước giải sai công thức/đơn vị đo.
- Ngữ văn: Cảnh báo xu hướng thiếu luận điểm (Point), thiếu dẫn chứng (Evidence), giải thích yếu (Explanation) hoặc thiếu liên kết (Link) theo cấu trúc PEEL.

Trả về định dạng JSON (không bọc markdown, trả về raw JSON):
{
  "common_mistakes_trend": ["string"],
  "performance_summary": "string",
  "alerts_for_teacher": ["string"],
  "advice_for_parents": ["string"],
  "methodology_insights": "string"
}`;

export const SOCRATIC_PROMPT = `Bạn là Gia sư AI Socratic, người bạn đồng hành thông thái, ấm áp và kiên nhẫn của học sinh tiểu học Việt Nam.
Nhiệm vụ: Giúp học sinh học tập bằng phương pháp Socratic.
Quy tắc: KHÔNG BAO GIỜ được đưa ra lời giải trực tiếp. Đặt câu hỏi gợi mở, vui tươi. Không cần trả về JSON, chỉ trả về chuỗi văn bản thuần túy.`;

export interface AICallParams {
  agent: string;
  prompt: string;
  contextData?: any;
  customApiKey?: string;
  inlineData?: any;
  aiProvider?: string;
  openaiKey?: string;
  openaiBaseUrl?: string;
  openaiModel?: string;
  subject?: string;
}

export async function callAI(params: AICallParams) {
  const { 
    agent, 
    prompt, 
    contextData, 
    customApiKey, 
    inlineData,
    aiProvider = 'gemini',
    openaiKey,
    openaiBaseUrl,
    openaiModel,
    subject: reqSubject
  } = params;

  const provider = aiProvider || 'gemini';

  // Determine the subject
  let subject = reqSubject || '';
  if (!subject) {
    const textToSearch = `${prompt || ''} ${contextData ? JSON.stringify(contextData) : ''}`.toLowerCase();
    if (textToSearch.includes('toán') || textToSearch.includes('math')) {
      subject = 'Toán';
    } else if (textToSearch.includes('hóa') || textToSearch.includes('chemistry')) {
      subject = 'Hóa';
    } else if (textToSearch.includes('ngoại ngữ') || textToSearch.includes('tiếng anh') || textToSearch.includes('anh') || textToSearch.includes('english')) {
      subject = 'Anh';
    } else if (textToSearch.includes('lịch sử') || textToSearch.includes('history')) {
      subject = 'Lịch sử';
    } else if (textToSearch.includes('sinh học') || textToSearch.includes('khoa học') || textToSearch.includes('biology') || textToSearch.includes('science')) {
      subject = 'Sinh học';
    } else if (textToSearch.includes('vật lý') || textToSearch.includes('vật lí') || textToSearch.includes('physics')) {
      subject = 'Vật lý';
    } else if (textToSearch.includes('văn') || textToSearch.includes('tiếng việt') || textToSearch.includes('literature')) {
      subject = 'Văn';
    }
  }

  let teachingMethodInstruction = '';
  if (subject === 'Toán') {
    teachingMethodInstruction = `
[PHƯƠNG PHÁP GIẢNG DẠY BẮT BUỘC - MÔN TOÁN: Spaced repetition (Lặp lại ngắt quãng) + Active recall (Chủ động gợi nhớ)]
1. Thiết kế các điểm dừng ôn tập hoặc câu đố ngắn khơi gợi kiến thức cũ (Active recall) để học sinh tự kích hoạt trí nhớ thay vì chỉ đọc thụ động.
2. Sắp xếp hệ thống bài tập hoặc lời nhắc ôn tập có chu kỳ giãn cách xa dần (Spaced repetition) nhằm lưu trữ thông tin sâu vào trí nhớ dài hạn.
3. Yêu cầu học sinh giải thích hoặc tự điền công thức trước khi đưa ra cách tính đầy đủ.`;
  } else if (subject === 'Hóa') {
    teachingMethodInstruction = `
[PHƯƠNG PHÁP GIẢNG DẠY BẮT BUỘC - MÔN HÓA HỌC: Pomodoro (Học tập tập trung) + Flowchart (Sơ đồ tiến trình phản ứng)]
1. Cấu trúc nội dung bài giảng thành các chặng tập trung ngắn khoảng 25 phút (Pomodoro), xen kẽ bằng các hoạt động thư giãn hoặc đố vui 5 phút để duy trì mức độ tỉnh táo tối đa.
2. Trình bày tất cả các tiến trình phản ứng hóa học, chuỗi biến đổi hoặc quy trình thí nghiệm bằng các sơ đồ luồng (Flowchart) từng bước trực quan (ví dụ: Bước 1 -> Bước 2 -> Bước 3) thay vì viết văn bản thuần túy dài dòng.`;
  } else if (subject === 'Anh') {
    teachingMethodInstruction = `
[PHƯƠNG PHÁP GIẢNG DẠY BẮT BUỘC - MÔN TIẾNG ANH: Input-rich (Ngữ liệu giàu có) + Shadowing (Đọc đuổi theo phát âm) + Flashcard (Thẻ ghi nhớ từ vựng)]
1. Cung cấp môi trường giàu ngữ liệu (Input-rich) với nhiều đoạn hội thoại thực tế, câu ví dụ đa dạng ngữ cảnh và tự nhiên.
2. Lồng ghép các hoạt động phát âm theo kỹ thuật Shadowing (đọc đuổi song song với tốc độ nói của giáo viên/máy đọc) để luyện ngữ điệu, nhấn trọng âm chuẩn xác.
3. Trình bày từ vựng mới dưới định dạng Flashcard trực quan (Mặt trước: Từ mới & Phát âm; Mặt sau: Nghĩa tiếng Việt, Hình ảnh minh họa ký tự và Câu ví dụ thực tế).`;
  } else if (subject === 'Lịch sử') {
    teachingMethodInstruction = `
[PHƯƠNG PHÁP GIẢNG DẠY BẮT BUỘC - MÔN LỊCH SỬ: Storytelling (Kể chuyện lịch sử) + Timeline (Trục sự kiện thời gian)]
1. Dẫn dắt bài học bằng lối kể chuyện (Storytelling) hấp dẫn, xây dựng bối cảnh chân thực, giới thiệu nhân vật lịch sử với các tình tiết gay cấn, nút thắt và bài học nhân văn sâu sắc.
2. Tóm tắt và xâu chuỗi toàn bộ diễn biến lịch sử hoặc các sự kiện nổi bật lên một trục thời gian (Timeline) rõ ràng theo trình tự thời gian tăng dần giúp học sinh có cái nhìn bao quát.`;
  } else if (subject === 'Sinh học') {
    teachingMethodInstruction = `
[PHƯƠNG PHÁP GIẢNG DẠY BẮT BUỘC - MÔN SINH HỌC/KHOA HỌC: Mindmap (Sơ đồ tư duy kiến thức)]
1. Hệ thống hóa mối quan hệ sinh thái, cấu tạo bộ phận hoặc các khái niệm khoa học bằng mô hình Sơ đồ tư duy (Mindmap) phân nhánh rõ ràng.
2. Tổ chức kiến thức theo cụm từ khóa (keywords) trung tâm, chia các nhánh lớn (chức năng, phân loại, cấu trúc) và các nhánh nhỏ chi tiết để dễ dàng ghi nhớ bằng hình ảnh trực quan.`;
  } else if (subject === 'Vật lý') {
    teachingMethodInstruction = `
[PHƯƠNG PHÁP GIẢNG DẠY BẮT BUỘC - MÔN VẬT LÝ: Practice papers (Giải đề mẫu & Bài tập thực tiễn)]
1. Xây dựng các nội dung lý thuyết song song với các bài tập luyện đề mẫu (Practice papers) từ cơ bản đến nâng cao.
2. Hướng dẫn chi tiết từng bước giải bài tập vật lý: Phân tích hiện tượng tự nhiên -> Tóm tắt đề bài (đại lượng đã biết/cần tìm) -> Lựa chọn công thức áp dụng -> Tính toán chi tiết kèm đơn vị đo chuẩn xác.`;
  } else if (subject === 'Văn') {
    teachingMethodInstruction = `
[PHƯƠNG PHÁP GIẢNG DẠY BẮT BUỘC - MÔN VĂN/TIẾNG VIỆT: PEEL (Point - Evidence - Explanation - Link)]
1. Hướng dẫn hoặc tự cấu trúc các đoạn văn lập luận phân tích theo mô hình PEEL tiêu chuẩn:
   - Point (Nêu rõ Luận điểm chính trực diện ngay câu đầu).
   - Evidence (Đưa ra Dẫn chứng/Dẫn liệu cụ thể trích từ văn bản hoặc ví dụ thực tế thuyết phục).
   - Explanation (Phân tích, Giải thích sâu ý nghĩa dẫn chứng để làm sáng rõ luận điểm chính).
   - Link (Liên kết ngược lại luận điểm ban đầu hoặc mở rộng liên hệ bài học bản thân).`;
  }

  // Determine system prompt and output config based on the selected agent
  let systemInstruction = '';
  let isJson = false;

  switch (agent) {
    case 'curriculum':
      systemInstruction = CURRICULUM_PROMPT;
      isJson = true;
      break;
    case 'lesson':
      systemInstruction = LESSON_PROMPT;
      isJson = true;
      break;
    case 'exercise':
      systemInstruction = EXERCISE_PROMPT;
      isJson = true;
      break;
    case 'socratic':
      systemInstruction = SOCRATIC_PROMPT;
      isJson = false;
      break;
    case 'report':
      systemInstruction = REPORT_PROMPT;
      isJson = true;
      break;
    case 'personalization':
      systemInstruction = PERSONALIZATION_PROMPT;
      isJson = true;
      break;
    case 'gamification':
      systemInstruction = GAMIFICATION_PROMPT;
      isJson = true;
      break;
    default:
      systemInstruction = 'You are a helpful educational AI assistant.';
  }

  if (teachingMethodInstruction) {
    systemInstruction = `${systemInstruction}nn${teachingMethodInstruction}`;
  }

  // Prepare full text contents
  const fullContent = contextData 
    ? `Ngữ cảnh bổ sung: ${JSON.stringify(contextData)}nnYêu cầu đầu vào: ${prompt}`
    : prompt;

  // Handle OpenAI Provider
  if (provider === 'openai') {
    const activeApiKey = openaiKey || process.env.OPENAI_API_KEY;
    if (!activeApiKey || activeApiKey === 'YOUR_API_KEY') {
      throw new Error('Chưa cấu hình OpenAI/CocoLink API Key. Vui lòng thêm trong phần cài đặt.');
    }

    const activeBaseUrl = openaiBaseUrl || process.env.OPENAI_BASE_URL || 'https://www.cocolink.ai/';
    const activeModel = openaiModel || process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

    const client = new OpenAI({
      apiKey: activeApiKey,
      baseURL: activeBaseUrl
    });

    const messages: any[] = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }

    let userMessageContent: any = fullContent;
    if (inlineData) {
      if (inlineData.mimeType && inlineData.mimeType.startsWith('image/')) {
        userMessageContent = [
          { type: 'text', text: fullContent },
          {
            type: 'image_url',
            image_url: {
              url: `data:${inlineData.mimeType};base64,${inlineData.data}`
            }
          }
        ];
      } else {
        userMessageContent = `${fullContent}nn[Lưu ý: Có tệp đính kèm ${inlineData.mimeType} nhưng không hỗ trợ đọc trực tiếp qua OpenAI API]`;
      }
    }

    messages.push({ role: 'user', content: userMessageContent });

    try {
      const response = await client.chat.completions.create({
        model: activeModel,
        messages: messages,
        temperature: 0.7,
        ...(isJson ? { response_format: { type: 'json_object' } } : {})
      });

      const generatedText = response.choices?.[0]?.message?.content;

      if (!generatedText) {
        throw new Error('AI không trả về nội dung. Thử lại sau nhé!');
      }

      if (isJson) {
        try {
          const cleanedText = generatedText
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
          return { result: JSON.parse(cleanedText) };
        } catch (err) {
          console.error('Failed to parse JSON output from OpenAI:', generatedText);
          return { result: generatedText, isRawText: true };
        }
      }

      return { result: generatedText };

    } catch (openAiError: any) {
      console.error('OpenAI API Error:', openAiError);
      throw new Error(`Lỗi kết nối OpenAI: ${openAiError.message || openAiError}`);
    }
  }

  // Default to Gemini API using fetch
  const apiKey = customApiKey || process.env.Gemini_API_Key || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Chưa cấu hình API Key cho Google Gemini AI. Vui lòng thêm trong phần cài đặt.');
  }

  const modelsToTry = [
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-2.5-flash'
  ];

  let lastError: any = null;
  let response: Response | null = null;
  let resJson: any = null;

  for (const modelName of modelsToTry) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const requestBody = {
      contents: [
        {
          parts: [
            ...(inlineData ? [{ inlineData }] : []),
            {
              text: fullContent
            }
          ]
        }
      ],
      systemInstruction: {
        parts: [
          {
            text: systemInstruction
          }
        ]
      },
      generationConfig: {
        temperature: 0.7,
        ...(isJson ? { responseMimeType: 'application/json' } : {})
      }
    };

    try {
      console.log(`Trying Gemini model: ${modelName}`);
      const apiResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (apiResponse.ok) {
        const json = await apiResponse.json();
        if (json.candidates?.[0]?.content?.parts?.[0]?.text) {
          response = apiResponse;
          resJson = json;
          break;
        } else {
           lastError = new Error(`Model ${modelName} returned empty text parts: ${JSON.stringify(json)}`);
        }
      } else {
        const errorMsg = await apiResponse.text();
        let parsedError = errorMsg;
        try {
          const parsed = JSON.parse(errorMsg);
          parsedError = parsed.error?.message || errorMsg;
        } catch(e) {}
        lastError = new Error(`Model ${modelName} status ${apiResponse.status}: ${parsedError}`);
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  if (!response || !resJson) {
    console.error('All Gemini models failed. Last error:', lastError);
    throw new Error(`Lỗi kết nối Gemini: ${lastError?.message || 'Tất cả các model đều quá tải hoặc hết hạn ngạch.'}`);
  }

  const generatedText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!generatedText) {
    throw new Error('AI không trả về nội dung. Thử lại sau nhé!');
  }

  if (isJson) {
    try {
      const cleanedText = generatedText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      return { result: JSON.parse(cleanedText) };
    } catch (err) {
      console.error('Failed to parse JSON output:', generatedText);
      return { result: generatedText, isRawText: true };
    }
  }

  return { result: generatedText };
}
