// Mỗi cặp đôi có một id riêng, dùng trong link: /?wedding=minh-anh-thu-ha
// Ảnh / nhạc nội bộ đặt trong public/, ví dụ public/anh.jpg -> '/anh.jpg'.
export const defaultWeddingId = 'minh-anh-thu-ha';

export const weddings = {
  'minh-anh-thu-ha': {
    groom: 'Nguyễn Minh Anh', bride: 'Trần Thu Hà',
    time: '17:00 | Thứ Bảy,', date: '17 tháng 10 năm 2026',
    lunarDate: '08/09/2026', // Ngày âm lịch, dùng chung cho hai buổi nếu không ghi riêng trong events.
    venue: 'Gia đình chú rể', address: 'Phường Cầu Giấy, Hà Nội',
    mapUrl: 'https://maps.app.goo.gl/6xvZeu16vKfCdpEw6',
    mapQuery: '20.436555,106.047287', // Tọa độ chính xác từ link Google Maps.
    // Chỉnh giờ, ngày và địa điểm riêng cho từng buổi tại đây.
    // Hiện cả hai dùng thông tin đang có, thay giờ lễ thành hôn nếu khác.
    events: [
      { id: 'meal', title: 'Bữa cơm thân mật được tổ chức', time: '17:00 | Thứ Bảy,', date: '17 tháng 10 năm 2026' },
      { id: 'ceremony', title: 'Lễ thành hôn được tổ chức', time: '17:00 | Thứ Bảy,', date: '17 tháng 10 năm 2026' },
    ],
    photo: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=85',
    coverPhotos: [ // 3 ảnh bìa tự chuyển, lặp lại mỗi 15 giây.
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1600&q=85',
    ],
    musicTracks: [
      { title: 'Váy cưới — ERIK', url: './music/vay-cuoi-erik.mp3' },
      { title: 'Xứng đôi cưới thôi', url: './music/xung-doi-cuoi-thoi.mp3' },
      { title: 'Một nhà', url: './music/mot-nha.mp3' },
      { title: 'Lễ đường', url: './music/le-duong.mp3' },
      { title: 'Bài này không để đi diễn', url: './music/bai-nay-khong-de-di-dien.mp3' },
    ],
    album: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=1000&q=85',
    ],
    families: [
      { title: 'Nhà trai', father: 'Ông Nguyễn Văn Sáu', mother: 'Trần Thị Nga', address: 'Phường Cầu Giấy, Hà Nội' },
      { title: 'Nhà gái', father: 'Ông Trần Văn Nam', mother: 'Bà Phạm Thị Lan', address: 'Phường Cầu Giấy, Hà Nội' },
    ],
  },
};
