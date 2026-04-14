# SỔ TAY TRIỂN KHAI DỰ ÁN WANDERLY (GIAI ĐOẠN 2)

**Công nghệ:** ReactJS + Express.js (1 Container) & SQL Server (1 Container)  
**Môi trường Host:** Windows 11

---

## BƯỚC 1: KIỂM TRA ĐIỀU KIỆN TIỀN ĐỀ VÀ PHẦN CỨNG

Trước khi cài đặt bất kỳ phần mềm nào, hệ thống Windows 11 cần được xác nhận đã sẵn sàng cho môi trường ảo hóa.

### 1.1. Kiểm tra tính năng Ảo hóa (Hardware Virtualization)
Docker yêu cầu CPU phải hỗ trợ và đã bật tính năng ảo hóa phần cứng.
- **Thao tác:**
  1. Nhấn tổ hợp phím `Ctrl + Shift + Esc` để mở **Task Manager**.
  2. Chuyển sang tab **Performance** (Hiệu năng) > Chọn mục **CPU**.
  3. Nhìn xuống góc dưới bên phải, kiểm tra dòng **Virtualization**.
- **Kết quả mong đợi:**
  - Nếu trạng thái là `Enabled`: Chuyển sang Bước 1.2.
  - Nếu trạng thái là `Disabled`: Bạn cần khởi động lại máy tính, truy cập vào BIOS/UEFI và bật tính năng này lên (thường có tên là *Intel VT-x* hoặc *AMD-V*).

### 1.2. Kiểm tra tài nguyên hệ thống
Container SQL Server yêu cầu khá nhiều tài nguyên để có thể khởi động và xử lý truy vấn ổn định cùng lúc với ứng dụng web.
- **RAM:** Kiểm tra trong Task Manager, đảm bảo dung lượng RAM tổng của máy tính từ 8GB trở lên (khuyến nghị mức 16GB).
- **Ổ cứng:** Mở `This PC`, đảm bảo ổ cài đặt hệ điều hành (thường là ổ C) còn trống tối thiểu 20GB để chứa Image và dữ liệu container.

Giải thích Bước 2: Tại sao lại là WSL 2 và Docker Desktop?
Ở các phiên bản cũ, Docker trên Windows chạy thông qua Hyper-V (một trình ảo hóa phần cứng), điều này khiến máy tính rất nặng và chậm.

WSL 2 (Windows Subsystem for Linux): Đây là một bước đột phá của Microsoft. Nó cho phép bạn chạy một nhân Linux thực thụ ngay bên trong Windows. Docker sẽ tận dụng nhân Linux này để chạy các container. Kết quả là tốc độ khởi động container nhanh hơn gấp nhiều lần và tiêu tốn cực ít tài nguyên RAM so với cách cũ.

Docker Desktop: Đây là "bộ não" điều khiển. Nó cung cấp giao diện quản lý, công cụ dòng lệnh (CLI) và đặc biệt là Docker Compose – công cụ giúp bạn kết nối container App (React + Express) và container Database (SQL Server) lại với nhau chỉ bằng một tệp cấu hình duy nhất.

---

## BƯỚC 2: CÀI ĐẶT MÔI TRƯỜNG VÀ CÔNG CỤ LÕI

Để chạy Linux container tối ưu trên Windows 11, hệ thống sẽ sử dụng kiến trúc WSL 2 thay vì Hyper-V truyền thống để đạt hiệu suất cao nhất.

### 2.1. Cài đặt Windows Subsystem for Linux (WSL 2)
Đây là lớp nền tảng cho phép nhân Linux chạy song song với Windows.
- **Thao tác:**
  1. Nhấn phím `Windows`, gõ tìm kiếm `PowerShell`.
  2. Nhấn chuột phải vào **Windows PowerShell**, chọn **Run as Administrator** (Chạy với quyền quản trị).
  3. Sao chép và chạy câu lệnh sau:
     ```powershell
     wsl --install
     ```
  4. Sau khi lệnh chạy xong, **bắt buộc khởi động lại máy tính**.

> **⚠️ LƯU Ý QUAN TRỌNG (Khắc phục sự cố):**
> - **Lỗi treo tiến trình:** Nếu lệnh `wsl --install` bị kẹt (ví dụ ở 80-90%) quá 15 phút, nhấn thẳng vào cửa sổ PowerShell gõ `Ctrl + C` để ngắt. Khởi động lại máy và chạy lệnh thay thế: `wsl --update` để tiếp tục cập nhật lõi ảo hóa.

### 2.2. Thiết lập Ubuntu (WSL) thủ công
Trong một số trường hợp, sau khi khởi động lại máy, hệ thống Windows không tự động bật cửa sổ cài đặt Ubuntu. Cần thực hiện gọi ứng dụng thủ công.
- **Thao tác:**
  1. Nhấn phím `Windows`, tìm kiếm ứng dụng tên **Ubuntu** và mở lên.
  2. Đợi hệ thống giải nén trong vài phút cho đến khi xuất hiện dòng: `Enter new UNIX username:`.
  3. **Nhập tên người dùng:** Viết liền, không dấu, không hoa (Ví dụ: `minhnhat`).
  4. **Nhập mật khẩu:** Tự đặt mật khẩu và nhấn Enter. 
     - **⚠️ LƯU Ý BẢO MẬT:** Màn hình sẽ **KHÔNG hiển thị bất kỳ dấu `*` hay ký tự nào** khi gõ mật khẩu trên Linux. Cứ tự tin gõ đúng mật khẩu rồi nhấn `Enter`. Nhập lại lần thứ 2 để xác nhận.
  5. Khi màn hình báo `Installation successful!`, có thể tắt cửa sổ này.

### 2.3. Tải và cài đặt Docker Desktop
Sau khi đã có lõi Linux (Ubuntu), tiến hành cài đặt bộ điều khiển container.
- **Lựa chọn phiên bản:**
  - Máy tính sử dụng chip **Intel/AMD** thông thường: Chọn bản **AMD64** (Windows x86_64).
  - Máy tính sử dụng chip **Snapdragon/ARM**: Chọn bản **ARM64**.
- **Thao tác:**
  1. Truy cập [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop), tải bộ cài tương ứng.
  2. Mở file `.exe` vừa tải và bắt đầu quá trình cài đặt.
  3. **Lưu ý cấu hình:** Ở các phiên bản Docker mới, phần mềm sẽ tự động phát hiện và mặc định sử dụng WSL 2 (ẩn tùy chọn chọn thủ công). Cứ tiếp tục bấm *Ok* để cài đặt.
  4. Sau khi hoàn tất, mở ứng dụng Docker Desktop lên.

### 2.4. Xác thực trạng thái cài đặt
Kiểm tra xem Docker đã móc nối thành công với WSL 2 hay chưa bằng các lệnh hệ thống.
- **Thao tác:**
  1. Mở ứng dụng Docker Desktop. Quan sát góc dưới bên trái, trạng thái hiển thị **"Engine running"** (màu xanh lá) là đã khởi động thành công.
  2. Mở PowerShell và gõ lệnh kiểm tra chuyên sâu:
     ```powershell
     docker info
     ```
- **Kết quả mong đợi:** Trong danh sách thông tin trả về, mục `Kernel Version` hiển thị có hậu tố `WSL2` (ví dụ: `6.6.87.2-microsoft-standard-WSL2`) và `OSType` là `linux`. 

---

## BƯỚC 3: CHUẨN BỊ CẤU TRÚC MÃ NGUỒN (MONOREPO)

Để công cụ Docker Compose có thể tìm thấy và đóng gói cả Frontend lẫn Backend một cách đồng bộ, mã nguồn dự án Wanderly cần được quy hoạch lại vào chung một thư mục gốc.

### 3.1. Gom nhóm mã nguồn và tạo thư mục làm việc
- **Thao tác:**
  1. Tạo thư mục gốc dự án mang tên `Wanderly-Docker`.
  2. Sắp xếp các thành phần mã nguồn vào các thư mục con tương ứng.
  3. Xóa các thư mục `node_modules` hiện có để tránh xung đột môi trường ảo.

**Cấu trúc thư mục mong đợi:**
```text
Wanderly-Docker/
├── backend/            # Chứa server.js, package.json, .env (Express)
├── frontend/           # Chứa src/, public/, package.json (ReactJS)
├── database/           # Chứa các kịch bản khởi tạo dữ liệu
│   ├── DBDuLich.sql    # Kịch bản tạo cấu trúc bảng (Schema)
│   └── InsertData.sql  # Kịch bản chèn dữ liệu mẫu ban đầu
├── Dockerfile          # (Sẽ khởi tạo ở Bước 4)
└── docker-compose.yml  # (Sẽ khởi tạo ở Bước 5)
```
---

## BƯỚC 4: XÂY DỰNG CHIẾN LƯỢC ĐÓNG GÓI ỨNG DỤNG (DOCKERFILE)

Để hệ thống Wanderly vận hành tối ưu và gọn nhẹ, quá trình đóng gói được thực hiện thông qua cơ chế Xây dựng đa tầng (Multi-stage Build).

### 4.1. Khởi tạo tệp loại trừ .dockerignore
Tệp này giúp cô lập môi trường đóng gói, ngăn chặn việc sao chép các tệp tin dư thừa từ máy Host (Windows) vào Image (Linux).
- **Các thành phần loại trừ:** `node_modules`, `dist`, các tệp `.bak` của SQL Server và tệp cấu hình `.env` cục bộ.

### 4.2. Cấu trúc Dockerfile đa tầng

Ứng dụng được đóng gói thành một thực thể duy nhất bao gồm cả Frontend và Backend:

1. **Tầng Build-stage:** Sử dụng `node:20-alpine` để thực hiện lệnh `npm run build` cho mã nguồn ReactJS, tạo ra các tệp tĩnh tối ưu trong thư mục `dist`.
2. **Tầng Runtime-stage:** 
   - Khởi tạo môi trường chạy Express.js.
   - Nhúng toàn bộ thư mục `dist` từ tầng trước vào thư mục `public` của Backend.
   - **Kết quả:** Express.js vừa đóng vai trò là API Server, vừa là Web Server phục vụ giao diện người dùng trên cổng 5000.

> **💡 Ghi chú kỹ thuật:** Cách làm này giúp giảm kích thước Image cuối cùng từ ~1GB xuống còn khoảng ~200MB và đơn giản hóa việc quản lý cổng (Port).

#### 4.2.1. Tệp Dockerfile (Bản thiết kế đóng gói)

Dockerfile của chúng ta sử dụng kỹ thuật **Multi-stage Build (Xây dựng đa tầng)**. Đây là kỹ thuật cao cấp giúp Image cuối cùng cực kỳ nhẹ vì nó chỉ giữ lại những gì cần thiết để chạy, loại bỏ các tệp rác phát sinh trong quá trình build.

**Giai đoạn 1: `build-frontend` (Xưởng chế tạo giao diện)**

- **`FROM node:20-alpine AS build-frontend`**: Mượn một chiếc "máy ảo" chạy Node.js bản tí hon (Alpine) và đặt tên công đoạn này là `build-frontend`.
- **`WORKDIR /app/frontend`**: Tạo và nhảy vào thư mục làm việc cho frontend.
- **`RUN npm install` & `npm run build`**: Docker sẽ tải các thư viện React và biên dịch toàn bộ code JSX/TSX phức tạp thành các tệp HTML, JS, CSS thuần túy nằm trong thư mục `dist`.
- *Mục đích:* Sau giai đoạn này, chúng ta chỉ cần thư mục `dist` (giao diện đã thành phẩm), các tệp nguồn khác đều có thể bỏ đi.

**Giai đoạn 2: Runtime (Vận hành hệ thống)**

- **`FROM node:20-alpine`**: Docker bỏ chiếc "máy ảo" cũ đi, lấy một chiếc máy ảo Node.js mới tinh, sạch sẽ.
- **`WORKDIR /app/backend`**: Thiết lập nơi chứa code server.
- **`COPY --from=build-frontend ... ./public`**: Đây là dòng "thần thánh". Nó ra lệnh: "Hãy sang máy ảo Build tầng 1, lấy thư mục `dist` (thành phẩm giao diện) mang về dán vào thư mục `public` của Backend ở tầng 2 này".
- **`EXPOSE 4000`**: Mở một chiếc "cửa sổ" ở cổng 4000 để thế giới bên ngoài có thể truy cập vào web.
- **`CMD ["node", "server.js"]`**: Lệnh cuối cùng để kích hoạt server Express.

#### 4.2.2. Tệp .dockerignore (Bộ lọc thông minh)

Nếu Dockerfile là danh sách những thứ **cần lấy**, thì `.dockerignore` là danh sách những thứ **cấm lấy**.

* **`**/node_modules`**: Không được copy thư mục này từ máy bạn vào Docker. 
    * *Lý do:* Thư viện cài trên Windows của bạn thường không chạy được trên Linux của Docker. Chúng ta để lệnh `RUN npm install` bên trong Dockerfile tự tải bản phù hợp với Linux.
* **`**/dist`**: Không lấy bản build cũ trên máy bạn để tránh xung đột với bản build mới bên trong Docker.
* **`backend/backups`**: Các file `.bak` rất nặng (có thể lên tới hàng GB). Nếu copy vào Image sẽ làm hệ thống chậm chạp và tốn dung lượng vô ích.
* **`.env`**: Không copy file chứa mật khẩu cục bộ vào Image để đảm bảo bảo mật (chúng ta sẽ cấu hình biến môi trường qua Docker Compose sau).

---

### Tóm tắt nội dung cho Sổ tay triển khai:



### Ý nghĩa các tệp cấu hình đóng gói:

1. **Dockerfile (Chiến lược Multi-stage):**
   - **Giai đoạn Build:** Cô lập môi trường biên dịch ReactJS, đảm bảo mã nguồn frontend được tối ưu hóa thành các tệp tĩnh (Static Assets).
   - **Giai đoạn Runtime:** Hợp nhất kết quả Build vào Server Express.js. Giúp giảm kích thước Image cuối cùng lên tới 70% so với cách đóng gói thông thường.
   - **Cổng vận hành:** 4000 (Khớp với cấu hình mã nguồn Backend).

2. **.dockerignore (Tối ưu hóa tài nguyên):**
   - Loại bỏ `node_modules` để đảm bảo tính tương thích môi trường (Windows vs Linux).
   - Loại trừ các tệp dữ liệu rác và sao lưu (`.bak`) để giữ cho Image luôn gọn nhẹ.
   - Bảo mật thông tin cấu hình cục bộ bằng cách loại bỏ các tệp `.env`.


### 1. Tệp Dockerfile (Bản thiết kế đóng gói)

Dockerfile của chúng ta sử dụng kỹ thuật **Multi-stage Build (Xây dựng đa tầng)**. Đây là kỹ thuật cao cấp giúp Image cuối cùng cực kỳ nhẹ vì nó chỉ giữ lại những gì cần thiết để chạy, loại bỏ các tệp rác phát sinh trong quá trình build.

#### Giai đoạn 1: `build-frontend` (Xưởng chế tạo giao diện)
* **`FROM node:20-alpine AS build-frontend`**: Mượn một chiếc "máy ảo" chạy Node.js bản tí hon (Alpine) và đặt tên công đoạn này là `build-frontend`.
* **`WORKDIR /app/frontend`**: Tạo và nhảy vào thư mục làm việc cho frontend.
* **`RUN npm install` & `npm run build`**: Docker sẽ tải các thư viện React và biên dịch toàn bộ code JSX/TSX phức tạp thành các tệp HTML, JS, CSS thuần túy nằm trong thư mục `dist`.
* *Mục đích:* Sau giai đoạn này, chúng ta chỉ cần thư mục `dist` (giao diện đã thành phẩm), các tệp nguồn khác đều có thể bỏ đi.

#### Giai đoạn 2: Runtime (Vận hành hệ thống)
* **`FROM node:20-alpine`**: Docker bỏ chiếc "máy ảo" cũ đi, lấy một chiếc máy ảo Node.js mới tinh, sạch sẽ.
* **`WORKDIR /app/backend`**: Thiết lập nơi chứa code server.
* **`COPY --from=build-frontend ... ./public`**: Đây là dòng "thần thánh". Nó ra lệnh: "Hãy sang máy ảo Build tầng 1, lấy thư mục `dist` (thành phẩm giao diện) mang về dán vào thư mục `public` của Backend ở tầng 2 này".
* **`EXPOSE 4000`**: Mở một chiếc "cửa sổ" ở cổng 4000 để thế giới bên ngoài có thể truy cập vào web.
* **`CMD ["node", "server.js"]`**: Lệnh cuối cùng để kích hoạt server Express.



---

### 2. Tệp .dockerignore (Bộ lọc thông minh)

Nếu Dockerfile là danh sách những thứ **cần lấy**, thì `.dockerignore` là danh sách những thứ **cấm lấy**.

- **`**/node_modules`**: Không được copy thư mục này từ máy bạn vào Docker. 
  - *Lý do:* Thư viện cài trên Windows của bạn thường không chạy được trên Linux của Docker. Chúng ta để lệnh `RUN npm install` bên trong Dockerfile tự tải bản phù hợp với Linux.
- **`**/dist`**: Không lấy bản build cũ trên máy bạn để tránh xung đột với bản build mới bên trong Docker.
- **`backend/backups`**: Các file `.bak` rất nặng (có thể lên tới hàng GB). Nếu copy vào Image sẽ làm hệ thống chậm chạp và tốn dung lượng vô ích.
- **`.env`**: Không copy file chứa mật khẩu cục bộ vào Image để đảm bảo bảo mật (chúng ta sẽ cấu hình biến môi trường qua Docker Compose sau).

### 4.3. Ý nghĩa các tệp cấu hình đóng gói

1. **Dockerfile (Chiến lược Multi-stage):**
   - **Giai đoạn Build:** Cô lập môi trường biên dịch ReactJS, đảm bảo mã nguồn frontend được tối ưu hóa thành các tệp tĩnh (Static Assets).
   - **Giai đoạn Runtime:** Hợp nhất kết quả Build vào Server Express.js. Giúp giảm kích thước Image cuối cùng lên tới 70% so với cách đóng gói thông thường.
   - **Cổng vận hành:** 4000 (Khớp với cấu hình mã nguồn Backend).

2. **.dockerignore (Tối ưu hóa tài nguyên):**
   - Loại bỏ `node_modules` để đảm bảo tính tương thích môi trường (Windows vs Linux).
   - Loại trừ các tệp dữ liệu rác và sao lưu (`.bak`) để giữ cho Image luôn gọn nhẹ.
   - Bảo mật thông tin cấu hình cục bộ bằng cách loại bỏ các tệp `.env`.

---

## BƯỚC 5: THIẾT LẬP ĐIỀU PHỐI HỆ THỐNG (DOCKER COMPOSE)

Tệp `docker-compose.yml` đóng vai trò là kiến trúc sư trưởng, định nghĩa cách các thành phần của Wanderly tương tác trong môi trường ảo hóa cô lập.

### 5.1. Cơ chế mạng nội bộ (Internal Networking)
Sử dụng Driver `bridge` để tạo ra một mạng riêng biệt mang tên `wanderly-net`. 
- **Ưu điểm:** Container App kết nối tới Database thông qua định danh dịch vụ `DB_SERVER=sqlserver`. Docker tự động phân giải tên này thành địa chỉ IP nội bộ, giúp hệ thống không phụ thuộc vào địa chỉ IP vật lý của máy Host.

### 5.2. Quản lý biến môi trường và tính phụ thuộc
Hệ thống sử dụng các tham số cấu hình linh hoạt:
- **`environment`**: Chuyển giao toàn bộ thông số kết nối (User, Pass, Port) từ tệp Compose vào mã nguồn Backend mà không cần sửa code.
- **`depends_on`**: Thiết lập trình tự khởi tạo ưu tiên cho tầng Dữ liệu, ngăn chặn lỗi "Connection Refused" khi Backend khởi chạy quá nhanh trước khi Database kịp sẵn sàng.
- **Bảo mật:** Sử dụng mật khẩu định dạng mạnh (Strong Password) cho tài khoản quản trị hệ quản trị cơ sở dữ liệu (`sa`) theo tiêu chuẩn của Microsoft.

> **💡 Ghi chú:** Cấu hình này giúp triển khai toàn bộ hệ thống Wanderly chỉ với một câu lệnh duy nhất, đảm bảo tính nhất quán giữa môi trường phát triển và môi trường thực tế.

services: Định nghĩa các thực thể trong hệ thống. Ở đây chúng ta có 2 service là sqlserver (DB) và wanderly-app (Code).

build: .: Báo cho Docker biết hãy tìm file Dockerfile ở thư mục hiện tại để đóng gói App.

depends_on: Đây là cơ chế xếp hàng. App sẽ không khởi động nếu Database chưa sẵn sàng.

networks: Tạo ra một "đường dây điện" nội bộ tên là wanderly-net. Nhờ có mạng này, Backend có thể gọi Database bằng tên sqlserver thay vì phải dùng IP.

environment: Các biến môi trường này sẽ được "bơm" trực tiếp vào process.env của Node.js mà Nhật đã viết trong file dbConfig.js.

### 5.3. Cơ chế tự động hóa khởi tạo dữ liệu (Auto-Seeding)
Để đảm bảo hệ thống "sẵn sàng vận hành" ngay sau khi triển khai mà không cần can thiệp thủ công, dự án sử dụng cơ chế Sidecar Script:

- **Script `import-data.sh`:** Một tập lệnh Bash thực hiện việc giám sát trạng thái của SQL Server. Khi dịch vụ đã sẵn sàng, script sẽ tự động thực thi kịch bản `init.sql` thông qua công cụ `sqlcmd`.
- **Dockerfile Dữ liệu:** Tùy chỉnh Image SQL Server gốc để nhúng sẵn kịch bản khởi tạo, giúp quá trình triển khai đồng nhất trên mọi máy tính.
- **Lợi ích:** Loại bỏ hoàn toàn sai sót do thao tác tay và đảm bảo dữ liệu mẫu (Roles, Admin Accounts) luôn hiện diện đúng cấu trúc.

---

## BƯỚC 6: CẤU HÌNH BIẾN MÔI TRƯỜNG (ENVIRONMENT VARIABLES)

Hệ thống sử dụng các biến môi trường để quản lý thông tin nhạy cảm và các tham số vận hành mà không cần sửa mã nguồn.

- **Tệp tin:** `.env` (Dùng cho môi trường Local) và `docker-compose.yml` (Dùng cho môi trường Container).
- **Các tham số chính:**

| Biến | Ý nghĩa | Giá trị cấu hình trong Docker |
| :--- | :--- | :--- |
| `PORT` | Cổng dịch vụ Backend | `4000` |
| `DB_SERVER` | Địa chỉ máy chủ Database | `sqlserver` (Tên service trong Docker) |
| `DB_USER` | Tài khoản quản trị SQL | `sa` |
| `DB_PASS` | Mật khẩu tài khoản SA | `MinhNhatHuit2026!` |
| `DB_NAME` | Tên Database chính | `Wanderly` |

> **Giải thích:** Việc sử dụng `DB_SERVER=sqlserver` là cực kỳ quan trọng. Trong mạng nội bộ của Docker, các container không hiểu "localhost" là máy chủ Database, chúng hiểu nhau qua tên dịch vụ được định nghĩa trong file YAML.

## BƯỚC 7: KHỞI CHẠY VÀ VẬN HÀNH (EXECUTION & OPERATION)

Để chạy hệ thống một cách trơn tru, cần tuân thủ quy trình "Xây dựng - Kiểm tra - Khởi động".

### 7.1. Lệnh khởi chạy lần đầu

```powershell
# Di chuyển vào thư mục dự án
cd D:\Wanderly-Docker

# Khởi chạy toàn bộ hệ thống (Build lại từ đầu và chạy ngầm)
docker-compose up --build -d
```

### 7.2. Kiểm tra trạng thái hệ thống

Sau khi chạy lệnh khởi tạo, cần kiểm tra xem các dịch vụ đã ở trạng thái "Healthy" (Sẵn sàng) hay chưa:

```powershell
docker ps
```

- **wanderly-db:** Phải đợi khoảng 30-45 giây để hiện trạng thái `(healthy)`.
- **wanderly-main:** Chỉ bắt đầu chạy ổn định sau khi Database đã Healthy.

---

## BƯỚC 8: QUẢN LÝ DỮ LIỆU BỀN VỮNG (DOCKER VOLUMES)

Để tránh việc mất dữ liệu khi xóa container (như đã gặp ở các bước trước), hệ thống áp dụng cơ chế **Named Volume**.

- **Cấu hình:** `wanderly_db_data:/var/opt/mssql`
- **Giải thích:** Toàn bộ file dữ liệu vật lý (.mdf, .ldf) của SQL Server được ánh xạ ra ngoài ổ cứng máy thật. 
  - **Lợi ích 1:** Khi chạy `docker-compose down`, container mất đi nhưng dữ liệu vẫn nằm lại trên ổ cứng.
  - **Lợi ích 2:** Lần khởi động sau sẽ cực kỳ nhanh vì SQL Server không phải nạp lại file `init.sql` nữa.

---

## BƯỚC 9: CƠ CHẾ "TỰ CHỮA LÀNH" VÀ ĐỒNG BỘ (HEALTHCHECK)

Đây là phần "cao cấp" giúp hệ thống hoạt động bền bỉ, tránh lỗi "Connection Refused".

- **Cơ chế:** Docker liên tục thực hiện lệnh `sqlcmd` bên trong container Database mỗi 10 giây để kiểm tra tính sẵn sàng.
- **Ràng buộc:** Backend (`wanderly-main`) được cấu hình `condition: service_healthy`. Nghĩa là nếu Database chưa sẵn sàng, Backend sẽ kiên nhẫn đợi ở trạng thái "Created" thay vì cố khởi động để rồi bị sập (Crash).

---

## BƯỚC 10: HƯỚNG DẪN XỬ LÝ LỖI THƯỜNG GẶP (TROUBLESHOOTING)

Trong quá trình vận hành, nếu gặp sự cố, hãy thực hiện theo các bước sau:

### 10.1. Lỗi không đăng nhập được (Incorrect Password)

Nguyên nhân thường do mã băm mật khẩu bị lệch kiểu dữ liệu (NVARCHAR).

**Cách sửa:** Chạy lệnh SQL trực tiếp để reset mật khẩu Admin:
```powershell
docker exec -it wanderly-db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P MinhNhatHuit2026! -Q "USE Wanderly; UPDATE Users SET PasswordHash = CONVERT(NVARCHAR(64), HASHBYTES('SHA2_256', CAST('123456' AS NVARCHAR(255))), 2) WHERE Email = 'admin@wanderly.com';" -C
```

### 10.2. Lỗi Backend không kết nối được Database

**Dấu hiệu:** Log báo `ESOCKET` hoặc `Connection Refused`.

**Cách sửa:** Kiểm tra xem Database đã `healthy` chưa, sau đó khởi động lại riêng Backend:
```powershell
docker-compose restart wanderly-app
```

---

## BƯỚC 11: TỔNG KẾT ƯU ĐIỂM DỰ ÁN WANDERLY TRÊN DOCKER

1. **Môi trường nhất quán:** Đảm bảo dự án chạy giống hệt nhau trên máy tính cá nhân, máy chấm điểm của giảng viên hoặc trên Server thật.
2. **Đóng gói toàn diện:** Không cần cài đặt SQL Server hay Node.js lên máy chủ, chỉ cần cài Docker.
3. **Bảo mật cao:** Các biến môi trường và mạng nội bộ giúp bảo vệ dữ liệu khỏi các truy cập trái phép từ bên ngoài container.

---

## PHỤ LỤC: THAM KHẢO LỆNH DOCKER

### 1. Nhóm lệnh Khởi tạo & Điều khiển (Lifecycle)

Đây là những lệnh sẽ dùng thường xuyên nhất để "điều hành" hệ thống.

| Lệnh | Giải thích chi tiết | Ý nghĩa đối với dự án Wanderly |
| :--- | :--- | :--- |
| **`docker-compose up -d`** | Khởi chạy toàn bộ các dịch vụ định nghĩa trong file YAML ở chế độ chạy ngầm (Detached). | Lệnh để bật cả Web và Database lên cùng một lúc. |
| **`docker-compose up --build -d`** | Ép Docker xây dựng lại Image mới từ code trước khi chạy. | Dùng khi mới sửa code Backend hoặc Frontend và muốn áp dụng thay đổi ngay. |
| **`docker-compose down`** | Dừng và xóa bỏ hoàn toàn các Container, Network đã tạo. | Dùng khi muốn "dọn dẹp" sạch sẽ để nghỉ ngơi hoặc cài đặt lại hệ thống. |
| **`docker-compose down -v`** | Dừng container và xóa luôn cả **Volumes** (Dữ liệu). | **Cẩn thận:** Chỉ dùng khi muốn xóa sạch dữ liệu SQL và nạp lại từ file `init.sql`. |
| **`docker-compose restart [tên_service]`** | Khởi động lại một dịch vụ cụ thể (VD: `wanderly-app`). | Dùng để "nhắc" Backend kết nối lại Database khi gặp lỗi lệch pha khởi động. |

---

### 2. Nhóm lệnh Giám sát & Gỡ lỗi (Monitoring & Debugging)

Khi web báo lỗi hoặc không vào được, đây là những lệnh "khám bệnh".

| Lệnh | Giải thích chi tiết | Ý nghĩa đối với dự án Wanderly |
| :--- | :--- | :--- |
| **`docker ps`** | Liệt kê các container đang chạy và trạng thái (Healthy, Up, Exit). | Giúp biết SQL Server đã sẵn sàng (`healthy`) hay Backend có bị sập không. |
| **`docker logs -f [tên_container]`** | Xem luồng nhật ký (logs) trực tiếp của container. | Theo dõi lỗi kết nối Database hoặc lỗi logic code trong lúc Nhật nhấn nút Sign In. |
| **`docker exec -it [tên] bash`** | Truy cập vào "vỏ" (terminal) bên trong container. | Dùng để kiểm tra file hệ thống bên trong hoặc chạy lệnh `sqlcmd` trực tiếp. |
| **`docker inspect [tên]`** | Xem toàn bộ thông tin cấu hình chi tiết (IP, Port, Volume). | Dùng khi nghi ngờ cấu hình mạng hoặc biến môi trường bị sai. |

---

### 3. Nhóm lệnh Quản lý Tài nguyên & Dọn dẹp (Maintenance)

Dùng để tối ưu dung lượng máy tính và xử lý các Image cũ.

| Lệnh | Giải thích chi tiết | Ý nghĩa đối với dự án Wanderly |
| :--- | :--- | :--- |
| **`docker images`** | Liệt kê tất cả các Image đang có trên máy. | Kiểm tra xem Image của Wanderly chiếm bao nhiêu dung lượng (thường là vài trăm MB). |
| **`docker volume ls`** | Liệt kê các ổ đĩa ảo (Volumes) đang tồn tại. | Xác nhận xem `wanderly_db_data` đã được tạo để lưu mật khẩu và bài đăng chưa. |
| **`docker system prune -f`** | Xóa sạch các container đã dừng, network thừa và image rác. | Giải phóng ổ cứng khi build đi build lại dự án quá nhiều lần. |
| **`docker image rm [ID]`** | Xóa một Image cụ thể. | Dùng để xóa các bản build lỗi để tiết kiệm bộ nhớ. |

---

### 4. Giải thích thuật ngữ chuyên sâu

> * **Container:** Là một "gói" đóng kín chứa ứng dụng và tất cả những gì nó cần để chạy. Nó cách ly hoàn toàn với máy Windows bên ngoài.
> * **Image:** Giống như một file cài đặt (.ISO hoặc .Installer). Build Image một lần và có thể mang đi cài ở bất cứ đâu.
> * **Volume:** Là "ổ cứng ngoài" của Docker. Nó giúp dữ liệu SQL Server sống sót ngay cả khi xóa bỏ container.
> * **Network (Bridge):** Một bộ định tuyến ảo bên trong Docker, cho phép `wanderly-main` gọi `sqlserver:1433` như thể chúng đang cắm chung một dây mạng LAN.

---

### 5. Mẹo vận hành "Pro"

Tạo một file tên là `run.bat` trong thư mục gốc dự án và dán đoạn này vào để mỗi lần bật dự án chỉ cần click chuột:

```batch
@echo off
echo Dang khoi dong Wanderly System...
docker-compose up -d
echo Hay doi 30 giay cho Database san sang...
timeout /t 30
docker ps
echo Chuc ban code vui ve!
pause
```

---

### 6. Dọn dẹp tài nguyên (Housekeeping)

Trong quá trình phát triển, việc xây dựng lại Image liên tục sẽ tạo ra các tệp tin dư thừa. Cần thực hiện dọn dẹp định kỳ để giải phóng bộ nhớ.

- **Lệnh dọn dẹp nhanh:** `docker system prune` (Xóa container dừng, mạng thừa, image không tên).
- **Lệnh dọn dẹp Build Cache:** `docker builder prune` (Xóa bộ nhớ đệm của quá trình build).
- **Lưu ý:** Tránh sử dụng flag `-a` nếu không muốn tải lại các Image gốc (Node, SQL Server) và tuyệt đối không dùng `--volumes` để bảo vệ dữ liệu người dùng.