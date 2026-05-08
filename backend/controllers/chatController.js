const OpenAI = require('openai');
const Book = require('../models/Book');
const Category = require('../models/Category');

// Lazy-init OpenAI client để tránh crash khi env chưa load
let openaiClient = null;
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

// Build context từ database
async function buildContext(userMessage) {
  const keywords = (userMessage || '').toLowerCase();
  const safeKeywords = keywords.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const categories = await Category.find({ isActive: true }).select('name slug').limit(20);
  const categoryNames = categories.map(c => c.name).join(', ');

  const matchedCategories = categories.filter(c =>
    keywords.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(safeKeywords)
  );
  const matchedCategoryIds = matchedCategories.map(c => c._id);

  let books = [];
  try {
    const searchConditions = [
      { title: { $regex: safeKeywords, $options: 'i' } },
      { author: { $regex: safeKeywords, $options: 'i' } },
      { description: { $regex: safeKeywords, $options: 'i' } }
    ];
    if (matchedCategoryIds.length > 0) {
      searchConditions.push({ category: { $in: matchedCategoryIds } });
    }
    books = await Book.find({
      isActive: true,
      $or: searchConditions
    }).populate('category', 'name').limit(8);
  } catch (e) {}

  if (books.length === 0) {
    books = await Book.find({ isActive: true, isFeatured: true })
      .populate('category', 'name')
      .limit(8);
  }
  if (books.length === 0) {
    books = await Book.find({ isActive: true })
      .populate('category', 'name')
      .sort({ sold: -1 })
      .limit(8);
  }

  const bookContext = books.map(b =>
    `- "${b.title}" của ${b.author} (${b.category?.name || 'N/A'}) - Giá: ${b.price.toLocaleString('vi-VN')}đ${b.discount > 0 ? ' (giảm ' + b.discount + '%)' : ''} - Tồn kho: ${b.stock} [Xem chi tiết](/pages/chi-tiet-sach.html?slug=${b.slug})`
  ).join('\n');

  return { categoryNames, bookContext, books };
}

// Phát hiện ý định người dùng (intent) — dùng cho fallback khi OpenAI fail
function detectIntent(text) {
  const t = (text || '').toLowerCase();
  if (/^(hi|hello|xin chào|chào|hey)\b/.test(t)) return 'greeting';
  if (/(ship|vận chuyển|giao hàng|phí ship|free ship)/.test(t)) return 'shipping';
  if (/(thanh toán|trả tiền|cod|vnpay|chuyển khoản)/.test(t)) return 'payment';
  if (/(khuyến mãi|giảm giá|voucher|mã|coupon|sale)/.test(t)) return 'promotion';
  if (/(đổi trả|hoàn tiền|trả hàng)/.test(t)) return 'return';
  if (/(liên hệ|hotline|sđt|email|địa chỉ)/.test(t)) return 'contact';
  if (/(tìm|kiếm|gợi ý|recommend|sách|cuốn|tiểu thuyết|truyện|ngôn tình|kỹ năng|văn học|kinh tế|thiếu nhi)/.test(t)) return 'book_search';
  return 'unknown';
}

// Sinh câu trả lời từ database (fallback khi OpenAI lỗi)
function buildFallbackReply(userMessage, books, categoryNames) {
  const intent = detectIntent(userMessage);

  const bookList = books.slice(0, 5).map(b =>
    `- **${b.title}** - ${b.author} - **${b.price.toLocaleString('vi-VN')}đ**${b.discount > 0 ? ` (giảm ${b.discount}%)` : ''} [Xem chi tiết](/pages/chi-tiet-sach.html?slug=${b.slug})`
  ).join('\n');

  switch (intent) {
    case 'greeting':
      return `👋 Xin chào! Tôi là trợ lý của **Sách Hub**. Tôi có thể giúp bạn:\n\n- 📚 Tìm sách theo thể loại\n- 🎁 Thông tin khuyến mãi\n- 🚚 Phí vận chuyển\n- 💰 Phương thức thanh toán\n\nBạn cần hỗ trợ gì ạ?`;

    case 'shipping':
      return `🚚 **Phí vận chuyển tại Sách Hub:**\n\n- Đơn dưới 300.000đ: **30.000đ**\n- Đơn từ 300.000đ trở lên: **Miễn phí**\n- Mã FREESHIP: miễn phí ship cho đơn từ 200.000đ\n\nThời gian giao hàng: 2-5 ngày tùy khu vực.`;

    case 'payment':
      return `💰 **Phương thức thanh toán:**\n\n- **COD** (thanh toán khi nhận hàng)\n- **VNPay** (thẻ ATM, Visa, Master, QR Code)\n\nGiao dịch an toàn, bảo mật thông tin tuyệt đối.`;

    case 'promotion':
      return `🎁 **Mã giảm giá hiện có:**\n\n- **WELCOME20**: giảm 20% (tối đa 50.000đ, đơn từ 100k)\n- **FREESHIP**: miễn phí ship (đơn từ 200k)\n- **SALE50K**: giảm 50.000đ (đơn từ 300k)\n- **SACHHAY10**: giảm 10% (đơn từ 50k)\n\nNhập mã ở trang giỏ hàng để áp dụng nhé! ✨`;

    case 'return':
      return `🔄 **Chính sách đổi trả:**\n\n- Đổi trả trong vòng **7 ngày** kể từ khi nhận hàng\n- Sách phải còn nguyên vẹn, chưa qua sử dụng\n- Liên hệ hotline **0123456789** để được hỗ trợ`;

    case 'contact':
      return `📞 **Thông tin liên hệ Sách Hub:**\n\n- Hotline: **0123456789**\n- Email: **hotro@sachhub.vn**\n- Địa chỉ: 3 Quang Trung, Hải Châu, TP. Đà Nẵng\n- Hoặc gửi yêu cầu qua [trang Liên hệ](/pages/lien-he.html)`;

    case 'book_search':
      if (bookList) {
        return `📚 Đây là một số sách phù hợp với câu hỏi của bạn:\n\n${bookList}\n\n👉 Bạn có thể xem thêm tại [Danh sách sách](/pages/danh-sach-sach.html) hoặc [Tìm kiếm](/pages/tim-kiem.html).`;
      }
      return `Hiện tại tôi chưa tìm thấy sách phù hợp. Bạn có thể duyệt theo danh mục: ${categoryNames}.\n\n👉 [Xem tất cả sách](/pages/danh-sach-sach.html)`;

    default:
      if (bookList) {
        return `Tôi chưa hiểu rõ ý bạn lắm 😅. Trong khi đó, đây là vài cuốn sách hay tại Sách Hub:\n\n${bookList}\n\nBạn có thể hỏi tôi về:\n- 📚 Sách (theo thể loại, tác giả, tên)\n- 🎁 Khuyến mãi\n- 🚚 Vận chuyển\n- 💰 Thanh toán`;
      }
      return `Xin lỗi, tôi chưa hiểu câu hỏi của bạn. Bạn có thể hỏi tôi về:\n\n- 📚 Tìm sách\n- 🎁 Khuyến mãi hiện có\n- 🚚 Phí vận chuyển\n- 💰 Phương thức thanh toán\n\nHoặc liên hệ hotline **0123456789** để được hỗ trợ trực tiếp.`;
  }
}

const chat = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'Thiếu nội dung tin nhắn' });
    }

    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    const userText = lastUserMessage?.content || '';
    const { categoryNames, bookContext, books } = await buildContext(userText);

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
- Khi giới thiệu sách, dùng format: **Tên sách** - Tác giả - Giá - [Xem chi tiết](/pages/chi-tiet-sach.html?slug=xxx)
- Khi giới thiệu sách, LUÔN kèm link [Xem chi tiết](/pages/chi-tiet-sach.html?slug=xxx) để khách bấm vào xem. Lấy slug từ thông tin sách bên dưới.
- Có thể dùng emoji phù hợp (📚 ✨ 💰 🎁)
- Nếu không biết câu trả lời, đề xuất khách liên hệ qua /pages/lien-he.html
- Không bịa đặt sách không có trong danh sách

Thông tin website:
- Tên: Sách Hub
- Hotline: 0123456789
- Email: hotro@sachhub.vn
- Địa chỉ: 3 Quang Trung, Hải Châu, TP. Đà Nẵng
- Mã giảm giá có sẵn: WELCOME20 (giảm 20%, đơn từ 100k), FREESHIP (miễn phí ship, đơn từ 200k), SALE50K (giảm 50k, đơn từ 300k)
- Thanh toán: COD hoặc VNPay
- Phí ship: 30.000đ (miễn phí với đơn từ 300k)

Danh mục sách hiện có: ${categoryNames}

Sách phù hợp với câu hỏi của khách:
${bookContext || 'Hãy hỏi khách về thể loại họ quan tâm'}`;

    // Thử gọi OpenAI; nếu fail thì dùng fallback từ database
    try {
      const openai = getOpenAI();
      if (!openai) {
        throw new Error('OPENAI_API_KEY chưa được cấu hình');
      }

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
      return res.json({ success: true, message: reply, source: 'ai' });

    } catch (aiError) {
      // Log lỗi OpenAI để admin diagnose
      console.error('[Chatbot] OpenAI failed, fallback to DB:', aiError.message || aiError);

      // Fallback: trả lời dựa trên DB + intent detection
      const fallbackReply = buildFallbackReply(userText, books, categoryNames);
      return res.json({ success: true, message: fallbackReply, source: 'fallback' });
    }
  } catch (error) {
    console.error('[Chatbot] Fatal error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi xử lý yêu cầu',
      reply: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau hoặc liên hệ hotline 0123456789.'
    });
  }
};

module.exports = { chat };
