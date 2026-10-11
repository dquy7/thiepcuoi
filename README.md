# Thiệp cưới React

Chạy: `npm.cmd run dev`. Kiểm tra và build: `npm.cmd run build`.

## Dùng cùng giao diện cho nhiều cặp đôi

Tất cả thông tin nằm trong `weddings.js`. `App.jsx` nhận dữ liệu qua props và dùng chung giao diện, component, CSS responsive.

Hai thiệp mẫu:

- `http://localhost:5173/?wedding=minh-anh-thu-ha`
- `http://localhost:5173/?wedding=hoang-nam-ngoc-lan`

Dùng cổng mà Vite hiển thị nếu khác 5173. Khi triển khai, thay `http://localhost:5173` bằng tên miền website của bạn.

Để thêm cặp đôi:

1. Sao chép một mục trong `weddings.js`, đặt khóa mới không trùng, ví dụ `tuan-mai`.
2. Thay `groom`, `bride`, `time`, `date`, `venue`, `address`, `families`, `photo`, `album`, `musicUrl`.
3. Chia sẻ link `/?wedding=tuan-mai`.

Để dùng ảnh và nhạc riêng, tạo thư mục `public/tuan-mai/`, đặt ảnh và nhạc vào đó rồi cấu hình đường dẫn `/tuan-mai/anh-cuoi.jpg`, `/tuan-mai/nhac.mp3`. Không thêm `public` vào đường dẫn trong cấu hình.

`defaultWeddingId` quyết định thiệp khi mở website không có tham số `wedding`.

`events` chia lịch thành bữa cơm thân mật và lễ thành hôn. Mỗi mục có `id`, `title`, `time`, `date`; có thể thêm `venue`, `address`, `mapUrl`, `mapQuery` nếu tổ chức ở nơi khác. Trường không khai báo sẽ lấy thông tin chung của thiệp.

`coverPhotos` là danh sách ảnh bìa tự chuyển mờ mỗi 5 giây và phóng nhẹ, lặp lại liên tục. Ví dụ: `coverPhotos: ['/tuan-mai/bia-1.jpg', '/tuan-mai/bia-2.jpg', '/tuan-mai/bia-3.jpg']`. Nếu không có danh sách này, thiệp hiển thị ảnh `photo`. Có nút tạm dừng; thiết bị bật giảm chuyển động hiển thị ảnh tĩnh.

Địa điểm chính xác: `mapUrl` là link chia sẻ Google Maps khi bấm địa chỉ; `mapQuery` là tọa độ dạng `'20.435278,106.048065'` dùng cho nút chỉ đường. Ô bản đồ minh họa trên thiệp mở Google Maps với điểm đến đã điền sẵn; khách chọn điểm xuất phát để xem đường đi. Nếu không có hai trường này, thiệp tìm theo `address`.

Lời chúc và xác nhận dùng backend Supabase, tách riêng theo id cặp đôi. Lời chúc công khai hỗ trợ 0–6 ảnh và cập nhật Realtime; xác nhận chỉ tài khoản quản lý xem được. Hai mục này mở thành màn riêng, quay lại thiệp giữ vị trí cuộn và nhạc đang phát. Xem [hướng dẫn kết nối Supabase](supabase/README.md). Khi chưa cấu hình backend, nút gửi bị vô hiệu hóa; không lưu giả lập trên trình duyệt.

Kiểm thử quyền database: `npm.cmd run test:backend`. Bài kiểm thử dùng PostgreSQL local và mô phỏng schema Auth/Storage; cần kiểm tra thêm trên project Supabase thật sau khi kết nối.

## Đưa lên GitHub và công khai bằng GitHub Pages

Đã có `.github/workflows/deploy.yml` tự build và triển khai khi push nhánh `main`. `vite.config.js` dùng đường dẫn tương đối để chạy dưới thư mục của repository.

1. Cài Git nếu terminal chưa nhận lệnh `git`, rồi mở lại terminal.
2. Trên GitHub, tạo repository **Public** tên `thiep-cuoi`. Để repository trống, không chọn tạo README hay .gitignore.
3. Trong terminal tại thư mục dự án, chạy các lệnh sau, thay `TEN_GITHUB` bằng tài khoản của bạn:

```powershell
git init
git add .
git commit -m "Create wedding invitation"
git branch -M main
git remote add origin https://github.com/TEN_GITHUB/thiep-cuoi.git
git push -u origin main
```

Nếu Git yêu cầu danh tính trước khi commit, đặt `git config user.name "Tên của bạn"` và `git config user.email "Email GitHub của bạn"`, rồi chạy lại commit. Đăng nhập GitHub khi được yêu cầu.

4. Vào repository → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
5. Vào **Actions → Publish wedding invitation → Run workflow**, chọn nhánh `main` và chạy. Nếu workflow tự chạy sau push mà Pages chưa bật thì chạy lại ở bước này.
6. Sau khi workflow thành công, lấy URL ở **Settings → Pages**. Thường là `https://TEN_GITHUB.github.io/thiep-cuoi/`.

Link từng thiệp: `https://TEN_GITHUB.github.io/thiep-cuoi/?wedding=minh-anh-thu-ha`.

Những lần cập nhật tiếp theo:

```powershell
git add .
git commit -m "Update wedding invitation"
git push
```

Đẩy mã nguồn và `package-lock.json`; `node_modules`, `.npm-cache` và `dist` đã được bỏ qua bằng `.gitignore`. GitHub Actions tự tạo `dist` khi build, không cần chỉnh file trong đó.

Tài liệu: https://vite.dev/guide/static-deploy.html#github-pages
