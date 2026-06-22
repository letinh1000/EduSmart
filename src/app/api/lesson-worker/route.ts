import { NextResponse } from 'next/server';
import { callAI } from '@/lib/aiCore';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const { 
      lesson, // { title, startPage, endPage }
      subject,
      grade,
      schoolYear,
      aiConfig,
      pdfBase64
    } = await req.json();

    const title = lesson.title;
    
    // 1. Generate Lesson
    const lessonPrompt = `Môn học: ${subject}, Khối lớp: ${grade}, Chủ đề bài học: "${title}". Hãy sử dụng tệp sách giáo khoa PDF đính kèm (nếu có) để biên soạn chính xác nội dung bài học này. Tuyệt đối bám sát ngữ liệu trong sách, không tự sáng tác nội dung sai lệch.`;
    
    const lessonRes = await callAI({
      agent: 'lesson',
      prompt: lessonPrompt,
      aiProvider: aiConfig.aiProvider,
      customApiKey: aiConfig.customApiKey,
      openaiKey: aiConfig.openaiKey,
      openaiBaseUrl: aiConfig.openaiBaseUrl,
      openaiModel: aiConfig.openaiModel,
      subject: subject,
      inlineData: pdfBase64 ? { mimeType: 'application/pdf', data: pdfBase64 } : undefined
    });

    const lessonResult = lessonRes.result;

    // 2. Generate Exercises
    const exerciseRes = await callAI({
      agent: 'exercise',
      prompt: `Môn học: ${subject}, Khối lớp: ${grade}, Chủ đề bài học: "${title}". Dựa trên nội dung sau: ${JSON.stringify(lessonResult)}`,
      aiProvider: aiConfig.aiProvider,
      customApiKey: aiConfig.customApiKey,
      openaiKey: aiConfig.openaiKey,
      openaiBaseUrl: aiConfig.openaiBaseUrl,
      openaiModel: aiConfig.openaiModel,
      subject: subject
    });

    const exercises = exerciseRes.result;

    // 3. Transform Data
    const practiceQuestions = Array.isArray(exercises) ? exercises.map((q: any) => ({
      id: q.question_id || 'q_' + Math.random().toString(36).substring(7),
      type: q.type || 'multiple_choice',
      difficulty: q.difficulty || 'medium',
      question: q.question_text || q.question || '',
      question_text: q.question_text || q.question || '',
      options: q.options || undefined,
      correctAnswer: q.correct_answer || '',
      explanation: q.explanation || '',
      hint: q.hint || ''
    })) : [];

    const finalLesson = {
      id: 'parsed_' + Math.random().toString(36).substring(7),
      title: title,
      warmUp: {
        story: lessonResult.warm_up?.story || `Chào mừng con đến với bài học ${title}!`,
        question: lessonResult.warm_up?.question || 'Sẵn sàng chưa con?',
        options: lessonResult.warm_up?.options || (subject === 'Toán' ? ['2 quả', '3 quả', '4 quả', '5 quả'] : ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'])
      },
      explanation: {
        mainContent: lessonResult.knowledge_explanation?.main_content || '',
        visualHint: lessonResult.knowledge_explanation?.visual_hint || ''
      },
      examples: Array.isArray(lessonResult.examples) ? lessonResult.examples.map((ex: any) => ({
        problem: ex.problem || '',
        solutionSteps: ex.solution_steps || [],
        answer: ex.answer || ''
      })) : [{ problem: 'Ví dụ mẫu.', solutionSteps: ['Bước 1: Giải'], answer: 'Đáp án' }],
      application: {
        realWorldConnection: lessonResult.application?.real_world_connection || '',
        challengeQuestion: lessonResult.application?.challenge_question || ''
      },
      practice: practiceQuestions
    };

    // 4. Save directly to Supabase Moderation List
    const newMod = {
      id: 'mod-' + Math.random().toString(36).substring(7),
      subject: subject,
      grade: grade,
      title: title,
      status: 'pending',
      school_year: schoolYear,
      content: finalLesson
    };

    const { error: dbError } = await supabase.from('moderation_list').upsert(newMod);
    if (dbError) {
      console.warn("Supabase upsert warning inside worker:", dbError);
    }

    return NextResponse.json({ success: true, lesson: newMod });

  } catch (error: any) {
    console.error('Lesson Worker Error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi server nội bộ' }, { status: 500 });
  }
}
