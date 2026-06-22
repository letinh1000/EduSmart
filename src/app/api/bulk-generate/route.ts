import { NextResponse } from 'next/server';
import { callAI } from '@/lib/aiCore';
import { supabase } from '@/lib/supabaseClient';

// A simple in-memory tracker for bulk jobs
// In production, you would use a Redis queue or database table
export const bulkJobs: Record<string, { total: number; completed: number; status: string; currentItem?: string }> = {};

async function processBulkGeneration(jobId: string, lessons: any[], config: any) {
  bulkJobs[jobId].status = 'processing';

  for (let i = 0; i < lessons.length; i++) {
    const item = lessons[i];
    const { subject, title, startPage, endPage, pdfBase64 } = item;
    
    bulkJobs[jobId].currentItem = title;

    try {
      // 1. Generate Lesson
      const lessonPrompt = `Môn học: ${subject}, Khối lớp: ${config.grade}, Chủ đề bài học: "${title}". Hãy sử dụng tệp sách giáo khoa PDF đính kèm (nếu có) để biên soạn chính xác nội dung bài học này. Tuyệt đối bám sát ngữ liệu trong sách, không tự sáng tác nội dung sai lệch.`;
      
      const lessonRes = await callAI({
        agent: 'lesson',
        prompt: lessonPrompt,
        aiProvider: config.aiConfig.aiProvider,
        customApiKey: config.aiConfig.customApiKey,
        openaiKey: config.aiConfig.openaiKey,
        openaiBaseUrl: config.aiConfig.openaiBaseUrl,
        openaiModel: config.aiConfig.openaiModel,
        subject: subject,
        inlineData: pdfBase64 ? { mimeType: 'application/pdf', data: pdfBase64 } : undefined
      });

      const lessonResult = lessonRes.result;

      // 2. Generate Exercises
      const exerciseRes = await callAI({
        agent: 'exercise',
        prompt: `Môn học: ${subject}, Khối lớp: ${config.grade}, Chủ đề bài học: "${title}". Dựa trên nội dung sau: ${JSON.stringify(lessonResult)}`,
        aiProvider: config.aiConfig.aiProvider,
        customApiKey: config.aiConfig.customApiKey,
        openaiKey: config.aiConfig.openaiKey,
        openaiBaseUrl: config.aiConfig.openaiBaseUrl,
        openaiModel: config.aiConfig.openaiModel,
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

      // 4. Save directly to Supabase
      const newMod = {
        id: 'mod-' + Math.random().toString(36).substring(7),
        subject: subject,
        grade: config.grade,
        title: title,
        status: 'pending',
        school_year: config.schoolYear,
        content: finalLesson
      };

      const { error: dbError } = await supabase.from('moderation_list').upsert(newMod);
      if (dbError) {
        console.warn(`Bulk Job [${jobId}] Supabase upsert error for ${title}:`, dbError);
      }

      bulkJobs[jobId].completed += 1;

    } catch (err: any) {
      console.error(`Bulk Job [${jobId}] Error on ${title}:`, err);
    }
  }

  bulkJobs[jobId].status = 'completed';
}

export async function POST(req: Request) {
  try {
    const { lessons, aiConfig, grade, schoolYear } = await req.json();

    if (!Array.isArray(lessons) || lessons.length === 0) {
      return NextResponse.json({ error: 'No lessons provided' }, { status: 400 });
    }

    const jobId = 'job_' + Math.random().toString(36).substring(7);
    
    // Initialize job tracker
    bulkJobs[jobId] = {
      total: lessons.length,
      completed: 0,
      status: 'pending'
    };

    // Start background processing without awaiting
    processBulkGeneration(jobId, lessons, { aiConfig, grade, schoolYear }).catch(console.error);

    return NextResponse.json({ 
      success: true, 
      jobId, 
      message: `Started bulk generation for ${lessons.length} lessons.` 
    });

  } catch (error: any) {
    console.error('Bulk Generate Route Error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi server nội bộ' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');

  if (!jobId || !bulkJobs[jobId]) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json(bulkJobs[jobId]);
}
