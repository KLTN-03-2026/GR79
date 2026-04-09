const OpenAI = require('openai');
const Book = require('../models/Book');
const Category = require('../models/Category');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Build context từ database
async function buildContext(userMessage) {
  // Tìm sách liên quan dựa trên message
  const keywords = userMessage.toLowerCase();

  // Lấy categories
  const categories = await Category.find({ isActive: true }).select('name slug').limit(10);
  const categoryNames = categories.map(c => c.name).join(', ');

  // Tìm sách match keyword (text search hoặc regex)
  let books = [];
  try {
    books = await Book.find({
      isActive: true,
      $or: [
        { title: { $regex: keywords, $options: 'i' } },
        { author: { $regex: keywords, $options: 'i' } },
        { description: { $regex: keywords, $options: 'i' } }
      ]
    }).populate('category', 'name').limit(8);
  } catch (e) {}

  // Nếu không có sách match, lấy top featured
  if (books.length === 0) {
    books = await Book.find({ isActive: true, isFeatured: true })
      .populate('category', 'name')
      .limit(8);
  }

  const bookContext = books.map(b =>
    `- "${b.title}" của ${b.author} (${b.category?.name || 'N/A'}) - Giá: ${b.price.toLocaleString('vi-VN')}đ${b.discount > 0 ? ' (giảm ' + b.discount + '%)' : ''} - Tồn kho: ${b.stock}`
  ).join('\n');

  return { categoryNames, bookContext };
}

const chat = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'Thiếu nội dung tin nhắn' });
    }

    // Lấy message cuối của user để build context
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    const { categoryNames, bookContext } = await buildContext(lastUserMessage?.content || '');

    // System prompt
    const systemPrompt = `Bạn là trợ lý AI thân thiện của website "Sách Hub" - một nền tảng bán sách trực tuyến hàng đầu Việt Nam.

Nhiệm vụ của bạn:
- Tư vấn sách cho khách hàng dựa trên sở thích và nhu cầu của họ
- Giới thiệu sách bán chạy, sách mới, sách giảm giá
- Hỗ trợ thông tin về danh mục, giá cả, khuyến mãi
- Trả lời các câu hỏi về dịch vụ: vận chuyển, đổi trả, thanh toán
- Hướng dẫn sử dụng website

Quy tắc:
- LUÔN trả lời bằng tiếng Việt có dấu, thân thiện, ngắn gọn
- Dùng markdown để format (in đậm, danh sách, tiêu đề) cho dễ đọc
- Khi giới thiệu sách, dùng format: **Tên sách** - Tác giả - Giá
- Có thể dùng emoji phù hợp (📚 ✨ 💰 🎁)
- Nếu không biết câu trả lời, đề xuất khách liên hệ qua /pages/lien-he.html
- Không bịa đặt sách không có trong danh sách

Thông tin website:
- Tên: Sách Hub
- Hotline: 1900 6035
- Email: hotro@sachhub.vn
- Địa chỉ: 201 Nguyễn Huệ, Quận 1, TP.HCM
- Mã giảm giá có sẵn: WELCOME20 (giảm 20%, đơn từ 100k), FREESHIP (miễn phí ship, đơn từ 200k), SALE50K (giảm 50k, đơn từ 300k)
- Thanh toán: COD hoặc VNPay
- Phí ship: 30.000đ (miễn phí với đơn từ 300k)

Danh mục sách hiện có: ${categoryNames}

Sách phù hợp với câu hỏi của khách:
${bookContext || 'Hãy hỏi khách về thể loại họ quan tâm'}`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    const reply = completion.choices[0].message.content;

    res.json({
      success: true,
      message: reply
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi xử lý yêu cầu',
      reply: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau hoặc liên hệ hotline 1900 6035.'
    });
  }
};

module.exports = { chat };
