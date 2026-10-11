# Kết nối phản hồi online

## 1. Tạo project

Tạo project tại https://supabase.com/dashboard. Chọn vùng gần Việt Nam (Singapore nếu có), lưu mật khẩu database ở nơi riêng. Không đưa mật khẩu database hoặc secret/service_role key vào website.

## 2. Tạo database, Storage và quyền truy cập

Mở **SQL Editor → New query**, dán toàn bộ `supabase/setup.sql` và Run một lần trong project mới. Script tạo lời chúc công khai, xác nhận riêng, bucket ảnh và quyền quản lý. Nếu đã chạy thành công, không chạy lại toàn bộ script.

Trong **Authentication → Sign In / Providers**, bật **Anonymous Sign-Ins**. Khách không điền email/mật khẩu; website tự tạo phiên khách khi gửi. Phiên này cũng giúp khách cập nhật xác nhận từ cùng trình duyệt. Xóa dữ liệu trình duyệt hoặc dùng thiết bị khác sẽ tạo phiên mới.

Lời chúc giới hạn một lần gửi mỗi phút/phiên. Storage chỉ nhận JPG/PNG/WebP, 5 MB mỗi file; tối đa 6 ảnh/lời chúc. Đây chưa phải chống bot mạnh: trước khi chia sẻ rộng, có thể bật CAPTCHA cho anonymous auth và bổ sung widget CAPTCHA tương ứng trong website. Không bật CAPTCHA riêng lẻ khi frontend chưa có widget, vì gửi sẽ bị chặn.

## 3. Cấu hình máy local

Project hiện tại đã được kết nối qua `supabase.config.js` bằng URL và publishable key công khai. File này được đóng gói cùng website, nên không cần thêm biến GitHub để triển khai project hiện tại. Biến môi trường bên dưới có thể dùng để ghi đè nếu đổi project. `.env.local` trên máy đã được tạo và không đưa lên Git.

Lấy **Project URL** và **publishable key** trong hộp Connect hoặc Settings → API Keys. Legacy anon key cũng dùng được. Chỉ dùng public/publishable/anon key; tuyệt đối không dùng secret/service_role key.

Sao chép `.env.example` thành `.env.local`, điền:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Khởi động lại `npm run dev`. `.env.local` đã được Git bỏ qua.

## 4. Cấu hình GitHub Pages

Repository → **Settings → Secrets and variables → Actions → Variables**. Tạo hai repository variables cùng tên và giá trị như trên. Workflow đã lấy các biến này vào bước build. Chạy lại workflow Publish wedding invitation để áp dụng.

## 5. Tài khoản quản lý

Trong **Authentication → Users → Add user**, tạo tài khoản email/password của bạn và xác nhận email. Lấy UUID của tài khoản, chạy SQL sau với UUID thật:

```sql
insert into public.wedding_admins(user_id,wedding_id)
values ('UUID_CUA_BAN', 'minh-anh-thu-ha');
```

Website → mở thiệp → cuối trang **Quản lý thiệp** → đăng nhập. Quyền quản lý kiểm tra ở database, không chỉ ở giao diện. Không bật đăng ký tài khoản công khai nếu không cần.

Màn quản lý có tổng số người từng buổi, CSV danh sách xác nhận và xóa 100 lời chúc gần nhất. Lời chúc cũ hơn có thể quản lý tại Supabase Table Editor. Ảnh lời chúc là công khai, vì vậy form thông báo cho khách trước khi gửi. Xóa lời chúc qua Table Editor không tự xóa file Storage; màn quản lý website sẽ cố xóa cả ảnh.

## 6. Kiểm tra sau kết nối

- Mở hai trình duyệt/thiết bị, gửi lời chúc chữ, một ảnh, nhiều ảnh: thiết bị kia thấy lời chúc mới. Nếu Realtime mất kết nối, trang làm mới feed mỗi 30 giây khi tab đang hiển thị.
- Xác nhận tham dự rồi gửi lại trên cùng trình duyệt: cập nhật một bản ghi. Kiểm tra tổng số người từng buổi trong màn quản lý.
- Khách không đọc được rsvps/wedding_admins của người khác, không sửa/xóa lời chúc và không tải/xóa ảnh vào thư mục phiên khác.
- Tài khoản quản lý của thiệp này không đọc xác nhận hoặc xóa lời chúc của thiệp khác.

Chưa có project kết nối thì nút gửi bị vô hiệu hóa; không giả lập thành công bằng localStorage. Các lời chúc cũ chỉ nằm trong localStorage không tự đưa lên backend.
