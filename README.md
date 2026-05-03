# Flowly

> Flowly là ứng dụng quản lý nhiệm vụ và lịch trình cá nhân, giúp người dùng sắp xếp công việc hằng ngày, theo dõi tiến độ, lên lịch sự kiện và tạo nhanh task bằng AI chatbot.

![React](https://img.shields.io/badge/React-18+-blue.svg) ![Vite](https://img.shields.io/badge/Vite-Frontend-646CFF.svg) ![Express](https://img.shields.io/badge/Express-Backend-black.svg) ![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20Database-3ECF8E.svg) ![Gemini](https://img.shields.io/badge/Gemini-AI%20Assistant-orange.svg) ![i18next](https://img.shields.io/badge/i18next-Multilingual-26A69A.svg)

---

## Giới thiệu

**Flowly** là một web app được xây dựng để hỗ trợ quản lý công việc cá nhân theo cách đơn giản, trực quan và hiện đại.

Ý tưởng chính của Flowly là gom các thao tác quản lý công việc hằng ngày vào một nơi duy nhất. Người dùng có thể tạo nhiệm vụ, theo dõi trạng thái, lên lịch theo tuần, quản lý tài khoản, đổi ngôn ngữ và dùng AI chatbot để tạo task hoặc lịch bằng câu tự nhiên.

Thay vì phải nhập từng nhiệm vụ thủ công, người dùng có thể viết một câu như:

```
Hôm nay tôi cần làm: học tập, đi chơi, đi học, đi họp
```

Và Flowly sẽ tự động tạo các task cho hôm nay!

## Mục tiêu của dự án

Dự án này được phát triển với mục tiêu:

- Xây dựng một ứng dụng quản lý công việc có giao diện thân thiện
- Thực hành React, Express và Supabase trong một dự án full-stack thực tế
- Tích hợp đăng nhập bằng email, Google và Facebook
- Quản lý dữ liệu người dùng bằng Supabase
- Xây dựng API backend có xác thực bằng access token
- Tích hợp AI chatbot để hỗ trợ tạo task và lịch nhanh hơn
- Tạo nền tảng có thể mở rộng thành sản phẩm hoàn chỉnh trong tương lai

## Tính năng chính

### Quản lý nhiệm vụ

- Thêm nhiệm vụ mới
- Sửa nhiệm vụ
- Xóa nhiệm vụ
- Đánh dấu hoàn thành
- Phân loại nhiệm vụ hôm nay và nhiệm vụ tương lai
- Gắn mức độ ưu tiên
- Gắn màu thẻ cho task
- Hiển thị task theo ngày được chọn

### Trang Home

- Hiển thị tổng quan số lượng task
- Hiển thị lịch tháng
- Xem task theo ngày
- Tìm kiếm nhiệm vụ
- Thêm nhanh task hoặc reminder
- Hiển thị ngày lễ nếu có dữ liệu ngày lễ

### Trang Tasks

Quản lý công việc bằng bảng Kanban

- Các cột trạng thái gồm: Mới, Đang thực hiện, Tạm hoãn, Đã xử lý, Đã hủy
- Kéo thả task giữa các cột
- Cập nhật trạng thái task
- Thu gọn/mở rộng các cột hoàn thành hoặc đã hủy
- Hiển thị ngày, mức ưu tiên và màu thẻ của task

### Trang Schedule

- Lịch trình theo tuần
- Thêm lịch theo ngày và giờ
- Sửa lịch
- Xóa lịch
- Hiển thị sự kiện theo từng ngày trong tuần
- Hỗ trợ mô tả lịch
- Hỗ trợ màu sự kiện

### Tài khoản người dùng

- Đăng ký bằng email
- Đăng nhập bằng email và mật khẩu
- Đăng nhập bằng Google
- Đăng nhập bằng Facebook
- Quên mật khẩu
- Đặt lại mật khẩu
- Chỉnh sửa thông tin cá nhân
- Avatar lấy từ tài khoản OAuth hoặc tạo tự động theo tên/email

### Ngôn ngữ

- Hỗ trợ Tiếng Việt
- Hỗ trợ English
- Sử dụng i18next và react-i18next
- Có hộp xác nhận khi đổi ngôn ngữ
- Có icon cờ bằng flag-icons

### AI Chatbot

**Flowly Bot** giúp người dùng tạo task hoặc lịch bằng ngôn ngữ tự nhiên.

**Ví dụ:**

```
Hôm nay tôi cần làm: học bài, đi họp, làm thêm
```

**Kết quả:**

- Tạo task "học bài"
- Tạo task "đi họp"
- Tạo task "làm thêm"

**Ví dụ:**

```
Ngày 12/5 tôi có lịch đi khám lúc 14h30
```

**Kết quả:**

- Tạo một lịch vào ngày 12/5
- Giờ bắt đầu là 14:30
- Nếu người dùng không nhập giờ kết thúc, Flowly tự đặt giờ kết thúc sau 1 tiếng

## Công nghệ sử dụng

### Frontend

- React
- Vite
- React Router
- CSS thuần
- Font Awesome
- i18next
- react-i18next
- flag-icons

### Backend

- Node.js
- Express.js
- Supabase client
- Middleware xác thực Supabase user
- Google Gemini API cho AI chatbot

### Database & Auth

- Supabase Auth
- Supabase PostgreSQL
- Supabase OAuth Providers
- Supabase Row Level Security-ready structure

## Cấu trúc dự án

```
flowly/
├── client/
│   ├── public/
│   │   └── assets/
│   │       └── images/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── i18n/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── styles/
│   │   └── utils/
│   ├── index.html
│   └── vite.config.js
│
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── index.js
│
├── package.json
├── package-lock.json
├── PROJECT_TREE.txt
├── README.md
└── .gitignore
```

## Cách sử dụng ứng dụng

### 1. Đăng ký tài khoản

Người dùng có thể tạo tài khoản bằng email và mật khẩu.

Sau khi đăng ký, người dùng đăng nhập để bắt đầu quản lý công việc cá nhân.

### 2. Đăng nhập

Flowly hỗ trợ nhiều hình thức đăng nhập:

- Email/password
- Google
- Facebook

### 3. Thêm nhiệm vụ

Ở trang Home hoặc Tasks, người dùng có thể bấm nút thêm để tạo nhiệm vụ mới.

Một nhiệm vụ có thể gồm:

- Tên nhiệm vụ
- Ngày thực hiện
- Mô tả
- Mức độ ưu tiên
- Màu thẻ
- Trạng thái

### 4. Quản lý task

Người dùng có thể:

- Sửa nội dung task
- Xóa task
- Đánh dấu hoàn thành
- Chuyển task qua các cột Kanban
- Theo dõi task theo từng ngày
- Tìm kiếm task

### 5. Thêm lịch

Ở trang Schedule, người dùng có thể tạo lịch với:

- Tên lịch
- Ngày
- Giờ bắt đầu
- Giờ kết thúc
- Mô tả
- Màu sự kiện

### 6. Dùng Flowly Bot

Người dùng bấm vào icon chatbot trên thanh header, sau đó nhập yêu cầu.

**Ví dụ:**

```
Hôm nay tôi cần làm: học React, làm bài tập, đi họp
```

Flowly sẽ tạo nhiều task cho hôm nay.

**Ví dụ:**

```
Ngày 20/5 tôi có lịch phỏng vấn lúc 10h
```

Flowly sẽ tạo một lịch vào ngày 20/5 lúc 10h.

## Cài đặt và chạy project

### Yêu cầu

Trước khi chạy project, cần cài:

- Node.js 18+
- npm
- Git
- Tài khoản Supabase
- Gemini API key nếu muốn dùng AI chatbot

### 1. Clone repository

```bash
git clone https://github.com/YOUR_USERNAME/Flowly.git
cd Flowly
```

### 2. Cài dependencies

Nếu project dùng package root để cài toàn bộ:

```bash
npm install
```

Nếu cần cài riêng client và server:

```bash
cd client
npm install

cd ../server
npm install
```

### 3. Tạo file môi trường

Tạo file `.env` ở thư mục gốc hoặc trong thư mục server tùy cấu hình project.

Ví dụ:

```env
PORT=3000
NODE_ENV=development

SUPABASE_URL=your_supabase_project_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

GEMINI_API_KEY=your_gemini_api_key
```

**Không được đưa file .env lên GitHub.**

### 4. Chạy project ở môi trường development

```bash
npm run dev
```

Thông thường project sẽ chạy tại:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

### 5. Build production

```bash
npm run build
```

Sau đó chạy server production:

```bash
npm start
```

Express sẽ phục vụ React build từ `client/dist`.

## Biến môi trường

| Biến                       | Ý nghĩa                         |
| -------------------------- | ------------------------------- |
| `PORT`                     | Port chạy Express server        |
| `NODE_ENV`                 | Môi trường chạy app             |
| `SUPABASE_URL`             | URL project Supabase            |
| `SUPABASE_PUBLISHABLE_KEY` | Public key của Supabase         |
| `GEMINI_API_KEY`           | API key dùng cho Gemini chatbot |

## API chính

### Config

| Method | Endpoint              | Chức năng                        |
| ------ | --------------------- | -------------------------------- |
| `GET`  | `/api/config`         | Lấy cấu hình public cho frontend |
| `GET`  | `/api/holidays/:year` | Lấy ngày lễ theo năm             |

### Tasks

| Method   | Endpoint                | Chức năng                |
| -------- | ----------------------- | ------------------------ |
| `GET`    | `/api/tasks`            | Lấy danh sách task       |
| `POST`   | `/api/tasks`            | Tạo task mới             |
| `PUT`    | `/api/tasks/:id`        | Cập nhật task            |
| `DELETE` | `/api/tasks/:id`        | Xóa task                 |
| `PATCH`  | `/api/tasks/:id/status` | Cập nhật trạng thái task |

### Schedules

| Method   | Endpoint             | Chức năng          |
| -------- | -------------------- | ------------------ |
| `GET`    | `/api/schedules`     | Lấy danh sách lịch |
| `POST`   | `/api/schedules`     | Tạo lịch mới       |
| `PUT`    | `/api/schedules/:id` | Cập nhật lịch      |
| `DELETE` | `/api/schedules/:id` | Xóa lịch           |

### AI

| Method | Endpoint        | Chức năng                                     |
| ------ | --------------- | --------------------------------------------- |
| `POST` | `/api/ai/parse` | Phân tích câu người dùng thành task hoặc lịch |

## Cấu trúc database tham khảo

### Bảng tasks

```sql
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text,
  task_type text not null check (task_type in ('today', 'future')),
  task_date date,
  status text default 'pending',
  priority text default 'normal',
  tag_color text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### Bảng schedules

```sql
create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text,
  schedule_date date not null,
  start_time time not null,
  end_time time not null,
  color text default 'blue',
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## Nếu gặp lỗi

### 1. Lỗi không đăng nhập được

Kiểm tra:

- Supabase URL đúng chưa
- Supabase publishable key đúng chưa
- Provider Google/Facebook đã bật chưa
- Redirect URL trong Supabase đã đúng chưa
- Email/password provider đã bật chưa

Với local, cần có redirect URL tương ứng với port bạn đang chạy, ví dụ:

- `http://localhost:5173/**`
- `http://localhost:5174/**`
- `http://localhost:3000/**`

### 2. Lỗi gọi API bị 401

Nguyên nhân thường gặp:

- User chưa đăng nhập
- Access token hết hạn
- Frontend không gửi Bearer token
- Middleware requireSupabaseUser không lấy được session

Cách xử lý:

- Đăng xuất rồi đăng nhập lại
- Kiểm tra file `apiClient.js`
- Mở DevTools để kiểm tra request header
- Đảm bảo request có dạng:
  ```
  Authorization: Bearer access_token
  ```

### 3. Lỗi không tạo được task hoặc lịch

Kiểm tra:

- Bảng tasks hoặc schedules đã tồn tại trong Supabase chưa
- Tên cột trong database có khớp với code không
- `task_type` chỉ được là `today` hoặc `future`
- Khi tạo lịch, `schedule_date`, `start_time`, `end_time` không được thiếu
- User đã đăng nhập chưa

### 4. Lỗi chatbot không hoạt động

Kiểm tra:

- Đã có `GEMINI_API_KEY` trong `.env` chưa
- Đã cài package Gemini chưa:
  ```bash
  npm install @google/genai
  ```
- Server đã restart sau khi thêm `.env` chưa
- Route `/api/ai/parse` đã được gắn trong `server/index.js` chưa
- Terminal server có báo AI parse error không
- API key Gemini còn hoạt động không

### 5. Lỗi port đang được dùng

Nếu port 3000 bị chiếm:

```bash
lsof -ti:3000 | xargs kill -9
```

Nếu port 5173 bị chiếm:

```bash
lsof -ti:5173 | xargs kill -9
```

Nếu đang dùng Windows, có thể dùng:

```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### 6. Lỗi dependency

Xóa node_modules và cài lại:

```bash
rm -rf node_modules package-lock.json
npm install
```

Nếu lỗi ở client:

```bash
cd client
rm -rf node_modules package-lock.json
npm install
```

Nếu lỗi ở server:

```bash
cd server
rm -rf node_modules package-lock.json
npm install
```

### 7. Lỗi build

Thử chạy:

```bash
npm run build
```

Nếu lỗi liên quan import hoặc package:

- Kiểm tra package đã cài chưa
- Kiểm tra đường dẫn import
- Kiểm tra tên file viết hoa/thường có khớp không
- Xóa node_modules rồi cài lại dependencies

## Ghi chú bảo mật

- Không commit file `.env`
- Không đưa API key lên GitHub
- Không để lộ Gemini API key
- Không để lộ Facebook App Secret
- Không để lộ Supabase service role key
- Không để lộ FTP/hosting password
- Nếu lỡ lộ key, hãy reset hoặc rotate key ngay
- Nên bật Row Level Security trong Supabase trước khi public app
- API key của AI chỉ nên để ở backend, không đặt trong frontend

## Deploy đề xuất

Cấu hình triển khai đề xuất:

**Frontend + Backend:** Render  
**Database/Auth:** Supabase  
**Domain:** ryanle.top

Hoặc tách riêng:

- **Frontend:** Vercel
- **Backend:** Render
- **Database/Auth:** Supabase
- **Domain:** ryanle.top

Khi deploy, cần cấu hình lại:

- Supabase Site URL
- Supabase Redirect URLs
- Google OAuth redirect
- Facebook OAuth redirect
- Biến môi trường trên hosting
- Domain chính hoặc subdomain API

## Định hướng phát triển tiếp theo

Một số tính năng có thể phát triển thêm:

- Thông báo task sắp đến hạn
- Đồng bộ Google Calendar
- Lịch lặp nâng cao
- Thống kê năng suất theo ngày/tuần/tháng
- Dark mode
- Upload avatar cá nhân
- Chia sẻ task hoặc lịch với người khác
- AI đề xuất kế hoạch làm việc trong ngày
- Push notification
- Dashboard thống kê hiệu suất
- Chế độ nhóm hoặc workspace

## Về tác giả

Xin chào, mình là **Ryan Lê**.

Mình xây dựng Flowly như một dự án học tập và thực hành full-stack web development. Dự án này giúp mình rèn luyện các kỹ năng như:

- Thiết kế giao diện bằng React
- Xây dựng REST API bằng Express
- Làm việc với Supabase Auth và Database
- Tổ chức project frontend/backend
- Tích hợp OAuth login
- Ứng dụng AI vào trải nghiệm người dùng
- Quản lý source code bằng Git và GitHub
- Tìm hiểu quy trình triển khai một sản phẩm web

Flowly không chỉ là một app quản lý công việc, mà còn là một sản phẩm mình dùng để học cách biến ý tưởng thành một ứng dụng thật có thể mở rộng và triển khai lên production.

## Liên hệ

- **GitHub:** https://github.com/MINHHUY24
- **Email:** huyleminh93vvk@gmail.com

Bạn có thể tạo issue trong GitHub repository nếu gặp lỗi hoặc muốn góp ý tính năng.

## License

Dự án này được phát triển cho mục đích học tập và thực hành cá nhân.
