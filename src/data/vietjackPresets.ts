export interface ExtractedLesson {
  title: string;
  startPage: number;
  endPage: number;
}

export interface WeeklyPractice {
  week: number;
  title: string;
  description: string;
}

export interface VietJackPreset {
  lessons: ExtractedLesson[];
  weeklyPractice: WeeklyPractice[];
}

export const VIETJACK_PRESETS: Record<string, VietJackPreset> = {
  // --- GRADE 3 ---
  'Toán_3_Kết nối tri thức': {
    lessons: [
      { title: 'Bài 1: Ôn tập các số đến 1000', startPage: 5, endPage: 8 },
      { title: 'Bài 2: Ôn tập phép cộng, phép trừ trong phạm vi 1000', startPage: 9, endPage: 12 },
      { title: 'Bài 3: Tìm thành phần chưa biết của phép tính', startPage: 13, endPage: 16 },
      { title: 'Bài 4: Mi-li-mét. Bảng đơn vị đo độ dài', startPage: 17, endPage: 21 },
      { title: 'Bài 5: Phép nhân trong phạm vi 1000', startPage: 22, endPage: 26 },
      { title: 'Bài 6: Phép chia trong phạm vi 1000', startPage: 27, endPage: 32 },
      { title: 'Bài 7: Bảng nhân 3, bảng chia 3', startPage: 33, endPage: 36 },
      { title: 'Bài 8: Bảng nhân 4, bảng chia 4', startPage: 37, endPage: 40 },
      { title: 'Bài 9: Ôn tập chung giữa học kì 1', startPage: 41, endPage: 45 },
      { title: 'Bài 10: Khối hộp chữ nhật, khối lập phương', startPage: 46, endPage: 49 }
    ],
    weeklyPractice: [
      { week: 1, title: 'Tuần 1: Ôn tập các số đến 1000 và phép tính cơ bản', description: 'Ôn tập cấu tạo số, đọc viết số, cộng trừ phạm vi 1000.' },
      { week: 2, title: 'Tuần 2: Phép cộng, phép trừ có nhớ trong phạm vi 1000', description: 'Thực hành đặt tính rồi tính, giải toán có lời văn cộng trừ.' },
      { week: 3, title: 'Tuần 3: Tìm số hạng, số bị trừ, số trừ chưa biết', description: 'Bài tập dạng X + A = B, A - X = B, X - A = B.' },
      { week: 4, title: 'Tuần 4: Đo lường và Đơn vị độ dài Mi-li-mét', description: 'Đổi đơn vị mm, cm, dm, m và giải bài toán đo lường thực tế.' },
      { week: 5, title: 'Tuần 5: Phép nhân số có hai chữ số với số có một chữ số', description: 'Bảng nhân và tính chất phép nhân cơ bản.' },
      { week: 6, title: 'Tuần 6: Phép chia hết và phép chia có dư', description: 'Tìm thương, số dư và thực hành chia số có hai chữ số.' }
    ]
  },
  'Toán_3_Chân trời sáng tạo': {
    lessons: [
      { title: 'Bài 1: Ôn tập các số đến 1000', startPage: 6, endPage: 9 },
      { title: 'Bài 2: Cộng, trừ các số có ba chữ số', startPage: 10, endPage: 13 },
      { title: 'Bài 3: Cộng có nhớ, trừ có nhớ', startPage: 14, endPage: 18 },
      { title: 'Bài 4: Tìm số hạng, tìm số bị trừ, số trừ', startPage: 19, endPage: 22 },
      { title: 'Bài 5: Nhân nhẩm, chia nhẩm', startPage: 23, endPage: 27 },
      { title: 'Bài 6: Tính giá trị của biểu thức', startPage: 28, endPage: 32 }
    ],
    weeklyPractice: [
      { week: 1, title: 'Tuần 1: Đọc, viết và so sánh các số trong phạm vi 1000', description: 'Luyện tập so sánh số, phân tích cấu tạo thập phân.' },
      { week: 2, title: 'Tuần 2: Cộng trừ không nhớ và có nhớ số có ba chữ số', description: 'Luyện tập tính nhẩm và giải toán thực tế.' }
    ]
  },
  'Toán_3_Cánh diều': {
    lessons: [
      { title: 'Bài 1: Ôn tập về đọc, viết, so sánh số', startPage: 5, endPage: 9 },
      { title: 'Bài 2: Ôn tập về phép cộng, phép trừ', startPage: 10, endPage: 14 },
      { title: 'Bài 3: Bảng nhân 3, bảng chia 3', startPage: 15, endPage: 19 },
      { title: 'Bài 4: Bảng nhân 4, bảng chia 4', startPage: 20, endPage: 24 },
      { title: 'Bài 5: Xem đồng hồ và đo thời gian', startPage: 25, endPage: 29 }
    ],
    weeklyPractice: [
      { week: 1, title: 'Tuần 1: Ôn tập đọc viết số và hình học cơ bản', description: 'Nhận diện hình phẳng, đếm số đỉnh cạnh.' }
    ]
  },
  'Tiếng Việt_3_Kết nối tri thức': {
    lessons: [
      { title: 'Bài 1: Ngày gặp lại (Tập đọc & Chính tả)', startPage: 8, endPage: 11 },
      { title: 'Bài 2: Về thăm quê (Luyện từ và câu)', startPage: 12, endPage: 14 },
      { title: 'Bài 3: Cánh rừng trong nắng (Tập làm văn)', startPage: 15, endPage: 18 },
      { title: 'Bài 4: Tập viết: Chữ hoa A, Ă, Â', startPage: 19, endPage: 21 },
      { title: 'Bài 5: Mùa thu của em (Thơ)', startPage: 22, endPage: 25 }
    ],
    weeklyPractice: [
      { week: 1, title: 'Tuần 1: Đọc hiểu "Ngày gặp lại" và từ chỉ sự vật', description: 'Tìm từ chỉ người, đồ vật, cây cối, con vật.' },
      { week: 2, title: 'Tuần 2: So sánh và đặt câu hỏi Ai thế nào?', description: 'Nhận diện phép so sánh ngang bằng và không ngang bằng.' }
    ]
  },
  'Tiếng Việt_3_Chân trời sáng tạo': {
    lessons: [
      { title: 'Bài 1: Chiếc nhãn vở mới', startPage: 10, endPage: 13 },
      { title: 'Bài 2: Lắng nghe những loài hoa', startPage: 14, endPage: 17 },
      { title: 'Bài 3: Em vui đến trường', startPage: 18, endPage: 21 },
      { title: 'Bài 4: Hoa cỏ sân trường', startPage: 22, endPage: 25 }
    ],
    weeklyPractice: [
      { week: 1, title: 'Tuần 1: Viết đoạn văn kể về một ngày hè của em', description: 'Rèn luyện kỹ năng viết câu kể và cấu trúc đoạn văn ngắn.' }
    ]
  },
  'Khoa học_3_Cánh diều': {
    lessons: [
      { title: 'Bài 1: Các bộ phận của thực vật', startPage: 6, endPage: 11 },
      { title: 'Bài 2: Các bộ phận của động vật', startPage: 12, endPage: 17 },
      { title: 'Bài 3: Nhu cầu sống của thực vật', startPage: 18, endPage: 23 },
      { title: 'Bài 4: Nhu cầu sống của động vật', startPage: 24, endPage: 29 },
      { title: 'Bài 5: Cơ quan tiêu hóa ở người', startPage: 30, endPage: 35 }
    ],
    weeklyPractice: [
      { week: 1, title: 'Tuần 1: Tìm hiểu chức năng của rễ, thân, lá cây', description: 'Trắc nghiệm và câu hỏi tự luận ngắn về thực vật.' }
    ]
  },

  // --- GRADE 4 ---
  'Toán_4_Kết nối tri thức': {
    lessons: [
      { title: 'Bài 1: Ôn tập các số trong phạm vi 100 000', startPage: 5, endPage: 7 },
      { title: 'Bài 2: Ôn tập phép cộng, phép trừ', startPage: 8, endPage: 10 },
      { title: 'Bài 3: Ôn tập phép nhân, phép chia', startPage: 11, endPage: 13 },
      { title: 'Bài 4: Các số có nhiều chữ số', startPage: 14, endPage: 17 },
      { title: 'Bài 5: Lớp triệu', startPage: 18, endPage: 21 },
      { title: 'Bài 6: So sánh các số có nhiều chữ số', startPage: 22, endPage: 24 },
      { title: 'Bài 7: Làm tròn số đến hàng chục nghìn, trăm nghìn', startPage: 25, endPage: 27 },
      { title: 'Bài 8: Luyện tập chung chương 1', startPage: 28, endPage: 31 },
      { title: 'Bài 9: Góc nhọn, góc tù, góc bẹt', startPage: 32, endPage: 34 },
      { title: 'Bài 10: Hai đường thẳng song song, vuông góc', startPage: 35, endPage: 38 },
      { title: 'Bài 11: Cộng các số có nhiều chữ số', startPage: 39, endPage: 41 },
      { title: 'Bài 12: Trừ các số có nhiều chữ số', startPage: 42, endPage: 44 },
      { title: 'Bài 13: Nhân với số có một chữ số', startPage: 45, endPage: 47 },
      { title: 'Bài 14: Chia cho số có một chữ số', startPage: 48, endPage: 51 },
      { title: 'Bài 15: Tính chất giao hoán, kết hợp của phép cộng', startPage: 52, endPage: 54 },
      { title: 'Bài 16: Tìm số trung bình cộng', startPage: 55, endPage: 58 },
      { title: 'Bài 17: Biểu đồ cột', startPage: 59, endPage: 62 },
      { title: 'Bài 18: Giây, thế kỉ', startPage: 63, endPage: 65 },
      { title: 'Bài 19: Ki-lô-mét vuông, Mét vuông', startPage: 66, endPage: 69 },
      { title: 'Bài 20: Tấn, tạ, yến', startPage: 70, endPage: 72 },
      { title: 'Bài 21: Ôn tập học kì 1', startPage: 73, endPage: 77 },
      { title: 'Bài 22: Phép nhân với số có hai chữ số', startPage: 78, endPage: 81 },
      { title: 'Bài 23: Phép chia cho số có hai chữ số', startPage: 82, endPage: 86 },
      { title: 'Bài 24: Tính chất phân phối của phép nhân', startPage: 87, endPage: 89 },
      { title: 'Bài 25: Khái niệm phân số', startPage: 90, endPage: 93 },
      { title: 'Bài 26: Phân số bằng nhau', startPage: 94, endPage: 96 },
      { title: 'Bài 27: Rút gọn phân số', startPage: 97, endPage: 99 },
      { title: 'Bài 28: Quy đồng mẫu số các phân số', startPage: 100, endPage: 103 },
      { title: 'Bài 29: So sánh hai phân số', startPage: 104, endPage: 107 },
      { title: 'Bài 30: Phép cộng phân số', startPage: 108, endPage: 111 },
      { title: 'Bài 31: Phép trừ phân số', startPage: 112, endPage: 115 },
      { title: 'Bài 32: Phép nhân phân số', startPage: 116, endPage: 119 },
      { title: 'Bài 33: Phép chia phân số', startPage: 120, endPage: 123 },
      { title: 'Bài 34: Tìm phân số của một số', startPage: 124, endPage: 127 },
      { title: 'Bài 35: Ôn tập cuối năm', startPage: 128, endPage: 135 }
    ],
    weeklyPractice: [
      { week: 1, title: 'Tuần 1: Ôn tập đọc viết số phạm vi 100 000 và tính chất phép tính', description: 'Tính giá trị biểu thức chứa chữ cơ bản.' },
      { week: 2, title: 'Tuần 2: Đọc viết các số có nhiều chữ số đến lớp triệu', description: 'Nhận diện hàng và lớp của số.' }
    ]
  },
  'Tiếng Việt_4_Kết nối tri thức': {
    lessons: [
      { title: 'Bài 1: Điều kì diệu (Đọc hiểu & Kể chuyện)', startPage: 8, endPage: 12 },
      { title: 'Bài 2: Thi nhạc (Luyện từ và câu)', startPage: 13, endPage: 16 },
      { title: 'Bài 3: Anh em sinh đôi (Viết đoạn văn)', startPage: 17, endPage: 21 },
      { title: 'Bài 4: Tập làm văn: Viết bài văn thuật lại một sự việc', startPage: 22, endPage: 26 }
    ],
    weeklyPractice: [
      { week: 1, title: 'Tuần 1: Tìm hiểu danh từ chung và danh từ riêng', description: 'Quy tắc viết hoa danh từ riêng chỉ tên người, địa lý.' }
    ]
  },

  // --- GRADE 5 ---
  'Toán_5_Kết nối tri thức': {
    lessons: [
      { title: 'Bài 1: Ôn tập về phân số và các phép tính', startPage: 5, endPage: 9 },
      { title: 'Bài 2: Ôn tập về phân số thập phân', startPage: 10, endPage: 13 },
      { title: 'Bài 3: Hỗn số', startPage: 14, endPage: 17 },
      { title: 'Bài 4: Khái niệm số thập phân', startPage: 18, endPage: 22 },
      { title: 'Bài 5: Viết các số đo đại lượng dưới dạng số thập phân', startPage: 23, endPage: 26 },
      { title: 'Bài 6: Cộng, trừ số thập phân', startPage: 27, endPage: 32 }
    ],
    weeklyPractice: [
      { week: 1, title: 'Tuần 1: Ôn tập phân số và quy đồng mẫu số', description: 'Cộng trừ nhân chia phân số.' },
      { week: 2, title: 'Tuần 2: Ôn tập phân số thập phân và Hỗn số', description: 'Chuyển hỗn số thành phân số và ngược lại.' }
    ]
  }
};

/**
 * Returns preset structure or a default fallback if the exact combination is not matched.
 */
export function getVietJackPreset(subject: string, grade: number, series: string): VietJackPreset {
  // Normalize subject string to match keys
  let normalizedSubject = subject;
  if (subject === 'Ngoại ngữ 1') normalizedSubject = 'Tiếng Anh';
  
  const key = `${normalizedSubject}_${grade}_${series}`;
  
  if (VIETJACK_PRESETS[key]) {
    return VIETJACK_PRESETS[key];
  }

  // Fallback preset structure if combination not found
  return {
    lessons: [
      { title: `Bài 1: Khái niệm cơ bản môn ${subject} lớp ${grade}`, startPage: 5, endPage: 10 },
      { title: `Bài 2: Thực hành & Thảo luận chủ đề chính`, startPage: 11, endPage: 18 },
      { title: `Bài 3: Ứng dụng thực tế và bài tập tổng hợp`, startPage: 19, endPage: 25 },
      { title: `Bài 4: Ôn tập định kỳ môn ${subject}`, startPage: 26, endPage: 32 }
    ],
    weeklyPractice: [
      { week: 1, title: `Tuần 1: Ôn tập tổng hợp kiến thức môn ${subject} tuần 1`, description: 'Củng cố lý thuyết và trắc nghiệm thực hành ngắn.' },
      { week: 2, title: `Tuần 2: Rèn luyện kỹ năng và giải bài tập nâng cao`, description: 'Rèn luyện tư duy phân tích theo khung chuẩn.' }
    ]
  };
}
