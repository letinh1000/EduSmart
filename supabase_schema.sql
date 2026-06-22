-- ====================================================================
-- EDUSMART - DATABASE SCHEMA FOR SUPABASE (POSTGRESQL)
-- ====================================================================
-- Description: This SQL script creates all necessary tables, constraints,
--              foreign keys, indexes, and row-level security (RLS) templates
--              to persist the application state in online mode.
-- ====================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean up existing tables (optional, for clean deployment)
-- DROP TABLE IF EXISTS sync_logs CASCADE;
-- DROP TABLE IF EXISTS student_socratic_chats CASCADE;
-- DROP TABLE IF EXISTS student_rewards CASCADE;
-- DROP TABLE IF EXISTS student_quests CASCADE;
-- DROP TABLE IF EXISTS student_albums CASCADE;
-- DROP TABLE IF EXISTS student_pets CASCADE;
-- DROP TABLE IF EXISTS student_stats CASCADE;
-- DROP TABLE IF EXISTS roadmap_stages CASCADE;
-- DROP TABLE IF EXISTS roadmaps CASCADE;
-- DROP TABLE IF EXISTS moderation_list CASCADE;
-- DROP TABLE IF EXISTS textbooks CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS virtual_classes CASCADE;

-- ====================================================================
-- 1. TABLE: VIRTUAL_CLASSES
-- ====================================================================
CREATE TABLE virtual_classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    teacher_name TEXT,
    teacher_id TEXT, -- Will be set as foreign key after users table is created
    students_count INTEGER DEFAULT 0,
    grade INTEGER NOT NULL CHECK (grade >= 1 AND grade <= 12),
    school_year TEXT NOT NULL,
    max_students INTEGER DEFAULT 35,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 2. TABLE: USERS
-- ====================================================================
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'parent', 'academic', 'admin')),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT, -- Optional, used if not using Supabase Auth directly
    parent_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    class_id TEXT REFERENCES virtual_classes(id) ON DELETE SET NULL,
    birth_year INTEGER,
    gender TEXT,
    grade INTEGER,
    school_year TEXT,
    gemini_key TEXT,
    openai_key TEXT,
    openai_base_url TEXT,
    openai_model TEXT,
    ai_provider TEXT CHECK (ai_provider IN ('gemini', 'openai')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add teacher_id foreign key in virtual_classes table linking back to users
ALTER TABLE virtual_classes 
ADD CONSTRAINT fk_virtual_classes_teacher 
FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL;

-- ====================================================================
-- 3. TABLE: TEXTBOOKS
-- ====================================================================
CREATE TABLE textbooks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    grade INTEGER NOT NULL,
    school_year TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    size TEXT,
    file_base64 TEXT, -- Storing parsed source PDF content
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 4. TABLE: MODERATION_LIST
-- ====================================================================
CREATE TABLE moderation_list (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    grade INTEGER NOT NULL,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    school_year TEXT NOT NULL,
    content JSONB NOT NULL, -- Full LessonContent structure (warmUp, explanation, examples, application, practice)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 5. TABLE: ROADMAPS
-- ====================================================================
CREATE TABLE roadmaps (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'locked' CHECK (status IN ('locked', 'active', 'completed')),
    grade INTEGER,
    school_year TEXT,
    class_id TEXT REFERENCES virtual_classes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Join table for roadmap assignments if a roadmap can be assigned to multiple classes
CREATE TABLE roadmap_class_assignments (
    roadmap_id TEXT REFERENCES roadmaps(id) ON DELETE CASCADE,
    class_id TEXT REFERENCES virtual_classes(id) ON DELETE CASCADE,
    PRIMARY KEY (roadmap_id, class_id)
);

-- ====================================================================
-- 6. TABLE: ROADMAP_STAGES
-- ====================================================================
CREATE TABLE roadmap_stages (
    id TEXT PRIMARY KEY,
    roadmap_id TEXT NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    title TEXT NOT NULL,
    lesson_id TEXT, -- Links to content inside moderation_list
    status TEXT DEFAULT 'locked' CHECK (status IN ('locked', 'available', 'completed')),
    grade INTEGER NOT NULL,
    position INTEGER DEFAULT 0, -- Preserves sequence ordering
    score INTEGER,
    next_review_date TIMESTAMP WITH TIME ZONE,
    spaced_repetition_interval INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 7. TABLE: STUDENT_STATS
-- ====================================================================
CREATE TABLE student_stats (
    student_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    xp INTEGER DEFAULT 0 CHECK (xp >= 0),
    coins INTEGER DEFAULT 0 CHECK (coins >= 0),
    level INTEGER DEFAULT 1 CHECK (level >= 1),
    streak INTEGER DEFAULT 0 CHECK (streak >= 0),
    last_active TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 8. TABLE: STUDENT_PETS
-- ====================================================================
CREATE TABLE student_pets (
    student_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name TEXT DEFAULT 'Thú Cưng' NOT NULL,
    type TEXT DEFAULT 'owl' CHECK (type IN ('owl', 'bear', 'dragon')),
    level INTEGER DEFAULT 1 CHECK (level >= 1),
    xp INTEGER DEFAULT 0 CHECK (xp >= 0),
    xp_needed INTEGER DEFAULT 100,
    happiness INTEGER DEFAULT 80 CHECK (happiness >= 0 AND happiness <= 100),
    equipped_accessories JSONB DEFAULT '[]'::jsonb NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 9. TABLE: STUDENT_ALBUMS
-- ====================================================================
CREATE TABLE student_albums (
    student_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    unlocked_sticker_ids JSONB DEFAULT '[]'::jsonb NOT NULL, -- Array of sticker IDs
    packs_count INTEGER DEFAULT 1 CHECK (packs_count >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 10. TABLE: STUDENT_QUESTS
-- ====================================================================
CREATE TABLE student_quests (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    xp_reward INTEGER DEFAULT 0,
    coins_reward INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 11. TABLE: STUDENT_REWARDS
-- ====================================================================
CREATE TABLE student_rewards (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    cost INTEGER NOT NULL CHECK (cost > 0),
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'pending', 'approved', 'rejected')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 12. TABLE: STUDENT_SOCRATIC_CHATS
-- ====================================================================
CREATE TABLE student_socratic_chats (
    student_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    chat_history JSONB DEFAULT '[]'::jsonb NOT NULL, -- JSON array of sender, text, timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 13. TABLE: SYNC_LOGS (For offline buffering)
-- ====================================================================
CREATE TABLE sync_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'synced')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- STICKERS REFERENCE DATA
-- ====================================================================
CREATE TABLE stickers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    image TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('landmark', 'science', 'history'))
);

-- ====================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ====================================================================
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_parent ON users(parent_id);
CREATE INDEX idx_users_class ON users(class_id);
CREATE INDEX idx_roadmap_stages_roadmap ON roadmap_stages(roadmap_id);
CREATE INDEX idx_roadmap_stages_order ON roadmap_stages(roadmap_id, position);
CREATE INDEX idx_student_quests_student ON student_quests(student_id);
CREATE INDEX idx_student_rewards_student ON student_rewards(student_id);
CREATE INDEX idx_moderation_list_filter ON moderation_list(grade, subject, school_year);

-- ====================================================================
-- MOCK SEED DATA INSERTION
-- ====================================================================

-- 1. Insert Stickers
INSERT INTO stickers (id, name, image, description, category) VALUES
('hl', 'Vịnh Hạ Long', '🐉', 'Kỳ quan thiên nhiên thế giới với hàng nghìn hòn đảo đá vôi kỳ vĩ.', 'landmark'),
('ta', 'Quần thể Tràng An', '🚣', 'Di sản thế giới hỗn hợp đầu tiên của Việt Nam với các hang động tự nhiên.', 'landmark'),
('vm', 'Văn Miếu Quốc Tử Giám', '🐢', 'Trường Đại học đầu tiên của Việt Nam, xây dựng từ năm 1070.', 'history'),
('mc', 'Chùa Một Cột', '🪷', 'Ngôi chùa cổ kính độc đáo có hình dáng như một đóa hoa sen nở trên mặt nước.', 'history'),
('pn', 'Động Phong Nha', '⛰️', 'Được mệnh danh là Kỳ quan đệ nhất động với hang sông ngầm dài nhất.', 'landmark'),
('vn', 'Bản đồ Việt Nam', '🇻🇳', 'Bản đồ hình chữ S thân yêu cùng với hai quần đảo Hoàng Sa và Trường Sa.', 'history')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Virtual Classes (Set teacher_id to NULL initially)
INSERT INTO virtual_classes (id, name, teacher_name, teacher_id, students_count, grade, school_year, max_students) VALUES
('c1', 'Lớp 3A', 'Lê Thị Mai', NULL, 32, 3, '2025-2026', 35),
('c2', 'Lớp 3B', 'Nguyễn Văn Hùng', NULL, 28, 3, '2025-2026', 35),
('c3', 'Lớp 4A', 'Trần Thị Thuỷ', NULL, 35, 4, '2025-2026', 35)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Users (Includes parent links and class links)
INSERT INTO users (id, name, role, email, password_hash, parent_id, class_id, grade, school_year) VALUES
('2026000003', 'Nguyễn Thu Hương', 'parent', 'huong.nt@gmail.com', '123', NULL, NULL, NULL, NULL),
('2026000001', 'Nguyễn Văn Minh', 'student', 'minh.nv@edusmart.vn', '123', '2026000003', 'c1', 3, '2025-2026'),
('2026000002', 'Lê Thị Mai', 'teacher', 'mai.lt@edusmart.vn', '123', NULL, NULL, NULL, NULL),
('2026000004', 'Hoàng Minh Quân', 'academic', 'quan.hm@edusmart.vn', '123', NULL, NULL, NULL, NULL),
('2026000005', 'Quản trị viên', 'admin', 'admin@edusmart.vn', '123', NULL, NULL, NULL, NULL),
('2026000006', 'Trần Thu Trang', 'student', 'trang.tt@edusmart.vn', '123', NULL, NULL, 3, '2025-2026'),
('2026000007', 'Phạm Hải Nam', 'student', 'nam.ph@edusmart.vn', '123', NULL, NULL, 4, '2025-2026'),
('2026000008', 'Lê Thùy Linh', 'student', 'linh.lt@edusmart.vn', '123', NULL, NULL, 3, '2024-2025'),
('2026000009', 'Đỗ Hoàng Anh', 'student', 'anh.dh@edusmart.vn', '123', NULL, NULL, 5, '2025-2026')
ON CONFLICT (id) DO NOTHING;

-- Update virtual class teacher foreign keys after users are inserted
UPDATE virtual_classes SET teacher_id = '2026000002' WHERE id = 'c1';

-- 4. Insert Textbooks
INSERT INTO textbooks (id, name, subject, grade, school_year, status, size) VALUES
('tb-1', 'Sách giáo khoa Toán 3 - Tập 1.pdf', 'Toán', 3, '2025-2026', 'active', '12.4 MB'),
('tb-2', 'Sách giáo khoa Tiếng Việt 3 - Tập 1.pdf', 'Tiếng Việt', 3, '2025-2026', 'active', '18.1 MB'),
('tb-3', 'Sách giáo khoa Khoa học 3.pdf', 'Khoa học', 3, '2025-2026', 'active', '9.6 MB')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Roadmaps
INSERT INTO roadmaps (id, title, status, grade, school_year, class_id) VALUES
('roadmap-1', 'Lộ trình 1: Khởi động thông thái', 'active', 3, '2025-2026', 'c1'),
('roadmap-2', 'Lộ trình 2: Bứt phá tư duy', 'locked', 3, '2025-2026', 'c1')
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Roadmap Stages
INSERT INTO roadmap_stages (id, roadmap_id, subject, title, lesson_id, status, grade, position) VALUES
('stage-1-1', 'roadmap-1', 'Tiếng Việt', 'Tập đọc: Thư gửi các học sinh', 'viet_g3_lesson1', 'completed', 3, 1),
('stage-1-2', 'roadmap-1', 'Toán', 'Phép nhân trong phạm vi 1000', 'math_g3_lesson1', 'completed', 3, 2),
('stage-1-3', 'roadmap-1', 'Khoa học', 'Các bộ phận của thực vật', 'sci_g3_lesson1', 'available', 3, 3),
('stage-1-4', 'roadmap-1', 'Ngoại ngữ 1', 'Unit 1: Hello & Greetings', 'eng_g3_lesson1', 'locked', 3, 4),
('stage-1-5', 'roadmap-1', 'Lịch sử và Địa lí', 'Bài 1: Bản đồ Việt Nam', 'hist_g3_lesson1', 'locked', 3, 5),
('stage-1-6', 'roadmap-1', 'Tin học và Công nghệ', 'Bài 1: Máy tính quanh ta', 'tech_g3_lesson1', 'locked', 3, 6),
('stage-2-1', 'roadmap-2', 'Toán', 'Phép chia hết & phép chia có dư', 'math_g3_lesson2', 'locked', 3, 1),
('stage-2-2', 'roadmap-2', 'Tiếng Việt', 'Từ chỉ hoạt động, trạng thái', 'viet_g3_lesson2', 'locked', 3, 2),
('stage-2-3', 'roadmap-2', 'Khoa học', 'Động vật quanh ta ăn gì?', 'sci_g3_lesson2', 'locked', 3, 3),
('stage-2-4', 'roadmap-2', 'Ngoại ngữ 1', 'Unit 2: My Family & Friends', 'eng_g3_lesson2', 'locked', 3, 4),
('stage-2-5', 'roadmap-2', 'Lịch sử và Địa lí', 'Bài 2: Gia đình & Trường học', 'hist_g3_lesson2', 'locked', 3, 5),
('stage-2-6', 'roadmap-2', 'Tin học và Công nghệ', 'Bài 2: Làm quen với Internet', 'tech_g3_lesson2', 'locked', 3, 6)
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Moderation List (Default AI lesson mock contents)
INSERT INTO moderation_list (id, subject, grade, title, status, school_year, content) VALUES
('mod-1', 'Khoa học', 3, 'Hệ tiêu hóa của con người', 'pending', '2025-2026', '{
  "id": "sci_g3_digestive",
  "title": "Hệ tiêu hóa của con người",
  "warmUp": {
    "story": "Bạn Cú đố các bé nhé: Khi chúng mình ăn một quả táo chín mọng, quả táo sẽ đi qua những cơ quan nào trong bụng để biến thành năng lượng giúp chúng mình chạy nhảy?",
    "question": "Bộ phận nào nhai và nghiền nát thức ăn đầu tiên?",
    "options": ["Miệng", "Thực quản", "Dạ dày", "Ruột non"]
  },
  "explanation": {
    "mainContent": "Hệ tiêu hóa gồm nhiều bộ phận nối tiếp nhau:\n- **Miệng**: Nhai kỹ và trộn thức ăn với nước bọt.\n- **Thực quản**: Ống dẫn đưa thức ăn xuống dạ dày.\n- **Dạ dày**: Nhào trộn thức ăn như một chiếc máy xay sinh tố.\n- **Ruột non**: Hấp thụ tất cả chất dinh dưỡng có ích nuôi cơ thể.\n- **Ruột già**: Đào thải chất cặn bã ra ngoài.",
    "visualHint": "👄 (Miệng nhai) -> 🦒 (Thực quản) -> 🎒 (Dạ dày xay) -> 🌀 (Ruột non hấp thụ) -> 🧻 (Ruột già đào thải)"
  },
  "examples": [
    {
      "problem": "Khi ăn cơm, nếu nhai thật kỹ con sẽ thấy cơm có vị ngọt nhẹ. Tại sao vậy?",
      "solutionSteps": [
        "Bước 1: Nước bọt trong miệng chứa men tiêu hóa.",
        "Bước 2: Men tiêu hóa biến đổi tinh bột trong cơm thành đường.",
        "Bước 3: Nhai kỹ giúp thức ăn trộn đều với nước bọt nên con cảm giác ngọt!"
      ],
      "answer": "Men tiêu hóa biến đổi tinh bột thành đường"
    }
  ],
  "application": {
    "realWorldConnection": "Để bảo vệ dạ dày và giúp cơ thể hấp thụ chất dinh dưỡng tốt nhất, con nhớ \"Ăn chín, uống sôi\" và \"Nhai thật kỹ, không vừa ăn vừa xem tivi\" nhé!",
    "challengeQuestion": "Hãy kể tên 1 thói quen tốt cho hệ tiêu hóa của con!"
  },
  "practice": [
    {
      "id": "modq1",
      "type": "multiple_choice",
      "question": "Ruột non làm nhiệm vụ chính là gì?",
      "options": ["Nghiền nát thức ăn", "Hấp thụ chất dinh dưỡng", "Đào thải chất cặn bã", "Dẫn thức ăn xuống dạ dày"],
      "correctAnswer": "Hấp thụ chất dinh dưỡng",
      "explanation": "Chính xác! Ruột non là nơi hấp thụ phần lớn các chất dinh dưỡng bổ dưỡng để đưa vào máu nuôi cơ thể.",
      "hint": "Đây là đoạn ruột dài nhất nằm cuộn trong bụng của con."
    }
  ]
}'::jsonb),
('mod-2', 'Khoa học', 3, 'Các bộ phận của thực vật', 'approved', '2025-2026', '{
  "id": "sci_g3_lesson1",
  "title": "Các bộ phận của thực vật",
  "warmUp": {
    "story": "Hôm nay chúng mình cùng ghé thăm khu vườn kỳ diệu của bạn Cú thông thái nhé! Ở đây có rất nhiều loài hoa đẹp và cây trĩu quả. Các bạn nhỏ có biết nhờ đâu mà cây có thể đứng vững và hút nước từ đất lên không nào?",
    "question": "Hãy chọn bộ phận giúp cây bám chặt vào lòng đất nhé!",
    "options": ["Thân cây", "Lá cây", "Rễ cây", "Quả"]
  },
  "explanation": {
    "mainContent": "Cây cối quanh ta thường gồm 5 bộ phận chính: Rễ, Thân, Lá, Hoa và Quả.\n- **Rễ**: Ở dưới lòng đất, giúp cây đứng vững, hút nước và chất dinh dưỡng.\n- **Thân**: Nâng đỡ cành lá và dẫn nước lên nuôi cây.\n- **Lá**: Giúp cây thở (hô hấp) và chế tạo thức ăn dưới ánh nắng mặt trời.\n- **Hoa**: Có màu sắc rực rỡ để thu hút ong bướm, giúp cây tạo quả.\n- **Quả**: Chứa hạt để mọc thành những cây con mới!",
    "visualHint": "🌱 (Rễ nằm dưới đất) -> 🪵 (Thân đứng thẳng) -> 🍃 (Lá màu xanh trên cành) -> 🌸 (Hoa khoe sắc) -> 🍎 (Quả chín mọng)"
  },
  "examples": [
    {
      "problem": "Cây cà rốt có rễ phình to thành củ cà rốt mà chúng ta hay ăn hàng ngày. Đây gọi là rễ củ!",
      "solutionSteps": [
        "Bước 1: Rễ hút chất dinh dưỡng dự trữ dưới lòng đất.",
        "Bước 2: Chất dinh dưỡng phình to ra tạo thành củ.",
        "Bước 3: Chúng ta thu hoạch củ cà rốt chính là ăn bộ phận rễ của cây!"
      ],
      "answer": "Rễ củ"
    }
  ],
  "application": {
    "realWorldConnection": "Cây xanh cung cấp oxy cho chúng ta thở và quả ngọt để ăn. Hãy cùng bố mẹ trồng một cái cây nhỏ hoặc tưới nước cho cây trong nhà vào cuối tuần nhé!",
    "challengeQuestion": "Hãy kể tên 2 loại rau ăn lá mà con thích nhất!"
  },
  "practice": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "Bộ phận nào của cây làm nhiệm vụ hút nước và muối khoáng từ lòng đất?",
      "options": ["Lá cây", "Thân cây", "Rễ cây", "Hoa"],
      "correctAnswer": "Rễ cây",
      "explanation": "Chính xác! Rễ cây ăn sâu vào lòng đất để hút nước và chất dinh dưỡng nuôi cây.",
      "hint": "Nó nằm ẩn phía dưới mặt đất đó con!"
    },
    {
      "id": "q2",
      "type": "fill_blank",
      "question": "Lá cây giúp cây hô hấp nhờ các lỗ khí và hấp thụ ánh sáng để quang hợp, lá cây thường có màu _______ (Điền một từ duy nhất)",
      "correctAnswer": "xanh",
      "explanation": "Đúng rồi! Chất diệp lục trong lá làm cho lá có màu xanh lục nổi bật.",
      "hint": "Màu của rừng cây, màu của cỏ xanh..."
    },
    {
      "id": "q3",
      "type": "drag_drop",
      "question": "Ghép nối bộ phận với chức năng thích hợp (Nối: Quả - Chứa hạt gieo mầm; Hoa - Duy trì nòi giống bằng cách thụ phấn)",
      "options": ["Quả", "Hoa"],
      "correctAnswer": ["Quả - Chứa hạt gieo mầm", "Hoa - Duy trì nòi giống bằng cách thụ phấn"],
      "explanation": "Tuyệt vời! Hoa thụ phấn để tạo quả, quả chứa hạt giúp cây duy trì giống nòi.",
      "hint": "Hãy chú ý nhiệm vụ của quả là giữ các hạt nhỏ."
    }
  ]
}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 8. Insert Student Progress for Demo User (Nguyễn Văn Minh - ID: 2026000001)
INSERT INTO student_stats (student_id, xp, coins, level, streak, last_active) VALUES
('2026000001', 240, 120, 3, 5, NOW())
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO student_pets (student_id, name, type, level, xp, xp_needed, happiness, equipped_accessories) VALUES
('2026000001', 'Cú Học Thức', 'owl', 2, 45, 100, 90, '[]'::jsonb)
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO student_albums (student_id, unlocked_sticker_ids, packs_count) VALUES
('2026000001', '["hl"]'::jsonb, 2)
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO student_quests (id, student_id, description, xp_reward, coins_reward, completed) VALUES
('q1_m', '2026000001', 'Hoàn thành 1 chặng học bất kỳ', 30, 20, false),
('q2_m', '2026000001', 'Đạt điểm tuyệt đối 100% trong bài tập', 50, 30, false),
('q3_m', '2026000001', 'Tương tác thảo luận với Gia sư Socratic AI', 20, 10, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO student_rewards (id, student_id, description, cost, status) VALUES
('r1_m', '2026000001', 'Đổi 30 phút xem hoạt hình cuối tuần', 100, 'available'),
('r2_m', '2026000001', 'Một buổi đi chơi công viên nước cùng gia đình', 300, 'available'),
('r3_m', '2026000001', 'Một cuốn truyện tranh Doraemon tập mới nhất', 200, 'available')
ON CONFLICT (id) DO NOTHING;

INSERT INTO student_socratic_chats (student_id, chat_history) VALUES
('2026000001', '[{"sender": "ai", "text": "Chào con! Ta là Gia sư Socratic. Con đang gặp khó khăn gì ở bài \"Các bộ phận của thực vật\" thế? Ta sẽ cùng tìm ra lời giải nhé!", "timestamp": "19:00:00"}]'::jsonb)
ON CONFLICT (student_id) DO NOTHING;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE
-- ====================================================================
-- Note: Do ứng dụng sử dụng cơ chế đăng nhập custom client-side qua bảng `users`
-- và gọi API trực tiếp qua Anon Key (auth.uid() luôn là null), chúng ta sẽ tắt RLS
-- trên các bảng để cho phép Client-side có thể SELECT/INSERT/UPDATE/DELETE.
-- Nếu bạn muốn kích hoạt RLS, bạn cần tích hợp Supabase Auth chính thức.

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE student_stats ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE student_pets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE student_albums ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE student_quests ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE student_rewards ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE student_socratic_chats ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE virtual_classes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE moderation_list ENABLE ROW LEVEL SECURITY;
