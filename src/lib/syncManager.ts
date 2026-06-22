import { supabase } from './supabaseClient';
import { localDB } from './localDB';

export const syncWithSupabase = async (syncQueue: any[]) => {
  if (!navigator.onLine) {
    console.log('Currently offline, sync paused.');
    return false;
  }

  if (syncQueue.length === 0) {
    console.log('No pending changes to sync.');
    return true;
  }

  try {
    console.log(`Syncing ${syncQueue.length} queued items to Supabase...`);
    
    // Sync Users
    const cachedUsers = await localDB.get<string>('es_users');
    if (cachedUsers) {
      const users = JSON.parse(cachedUsers);
      const usersToUpsert = users.map((u: any) => ({
        id: u.id,
        name: u.name,
        role: u.role,
        email: u.email,
        password_hash: u.password || '123',
        parent_id: u.parentId || null,
        class_id: u.classId || null,
        birth_year: u.birthYear || null,
        gender: u.gender || null,
        grade: u.grade || null,
        school_year: u.schoolYear || null
      }));
      await supabase.from('users').upsert(usersToUpsert);
    }

    // Sync Virtual Classes
    const cachedClasses = await localDB.get<string>('es_virtual_classes');
    if (cachedClasses) {
      const classes = JSON.parse(cachedClasses);
      const classesToUpsert = classes.map((c: any) => ({
        id: c.id,
        name: c.name,
        teacher_name: c.teacher || null,
        students_count: c.studentsCount || 0,
        grade: c.grade,
        school_year: c.schoolYear || '2025-2026',
        max_students: c.maxStudents || 35
      }));
      await supabase.from('virtual_classes').upsert(classesToUpsert);
    }

    // Sync Textbooks
    const cachedTextbooks = await localDB.get<string>('es_textbooks');
    if (cachedTextbooks) {
      const textbooks = JSON.parse(cachedTextbooks);
      const textbooksToUpsert = textbooks.map((tb: any) => ({
        id: tb.id,
        name: tb.name,
        subject: tb.subject,
        grade: tb.grade,
        school_year: tb.schoolYear,
        status: tb.status || 'active',
        size: tb.size || null,
        file_base64: tb.fileBase64 || null
      }));
      await supabase.from('textbooks').upsert(textbooksToUpsert);
    }

    // Sync Moderations
    const cachedMods = await localDB.get<string>('es_moderation_list');
    if (cachedMods) {
      const mods = JSON.parse(cachedMods);
      const modsToUpsert = mods.map((m: any) => ({
        id: m.id,
        subject: m.subject,
        grade: m.grade,
        title: m.title,
        status: m.status || 'pending',
        school_year: m.schoolYear || '2025-2026',
        content: m.content
      }));
      await supabase.from('moderation_list').upsert(modsToUpsert);
    }

    return true;
  } catch (error) {
    console.error('Error syncing with Supabase:', error);
    return false;
  }
};
