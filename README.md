## 1. Thứ tự và các lệnh chạy thủ công (Manual Workflow)

Mở PowerShell tại thư mục `~\Wanderly-Docker` và thực hiện theo đúng trình tự này:

### Bước 1: Kiểm tra trạng thái Docker
Hãy chắc chắn Docker Desktop đã được bật. Kiểm tra nhanh bằng lệnh:
```powershell
docker version
```
*(Nếu hiện ra thông số phiên bản là ổn, nếu báo lỗi thì phải bật Docker Desktop lên).*

### Bước 2: Khởi chạy và xây dựng (Build & Up)
Đây là lệnh quan trọng nhất. Nó sẽ đọc file `docker-compose.yml` để dựng lên toàn bộ hệ thống.
```powershell
docker-compose up --build -d
```
* **`--build`**: Ép Docker xây dựng lại Image (để cập nhật những thay đổi mới nhất trong code của bạn).
* **`-d`**: Chạy ngầm (Detached mode), giúp bạn vẫn có thể gõ tiếp các lệnh khác trên cửa sổ đó.

### Bước 3: Theo dõi quá trình khởi động của Database
Như chúng ta đã biết, SQL Server khởi động rất chậm. Hãy gõ lệnh này để quan sát:
```powershell
docker ps
```
Đợi cho đến khi cột **STATUS** của `wanderly-db` hiện chữ **`(healthy)`**. Thông thường sẽ mất khoảng **30 - 60 giây**.

### Bước 4: Kiểm tra Backend đã kết nối thành công chưa
Khi DB đã healthy, hãy xem log của Backend:
```powershell
docker logs wanderly-main
```
**Dấu hiệu thành công:** Thấy dòng `✅ Connected to SQL Server`. Lúc này mới mở trình duyệt truy cập `http://localhost:4000`.

---

## 2. Cách mang dự án sang máy khác (Portable Deployment)

### A. Chuẩn bị mã nguồn 
Nhật chỉ cần copy các thư mục sau sang máy mới:
* Thư mục `backend/`.
* Thư mục `frontend/`.
* Thư mục `database/`.
* Các file: `docker-compose.yml`, `Dockerfile`, `.dockerignore`.

> **Mẹo:** Nếu đã cấu hình file `.dockerignore` chuẩn, chỉ cần nén (Zip) cả thư mục `Wanderly-Docker` lại là xong. Docker ở máy mới sẽ tự động tải lại các thư viện (node_modules) khi build.

### B. Thực hiện trên máy mới
1.  **Cài đặt:** Máy đó chỉ cần cài duy nhất **Docker Desktop**.
2.  **Giải nén:** Giải nén code vào một thư mục (ví dụ `C:\Wanderly`).
3.  **Chạy lệnh:** Mở Terminal tại đó và gõ:
    ```powershell
    docker-compose up --build -d
    ```
4.  **Hưởng thụ:** Đợi khoảng 1 phút cho DB khởi tạo lần đầu và truy cập web.

---

## 3. Bảng tóm tắt các bước cho Sổ tay (Deployment Steps)

| Thứ tự | Hành động | Lệnh thực hiện | Mục đích |
| :--- | :--- | :--- | :--- |
| **1** | Kiểm tra Docker | `docker version` | Đảm bảo môi trường ảo hóa đã sẵn sàng. |
| **2** | Triển khai hệ thống | `docker-compose up --build -d` | Tự động build Image và tạo Container. |
| **3** | Giám sát sức khỏe | `docker ps` | Đợi SQL Server đạt trạng thái `healthy`. |
| **4** | Xác thực kết nối | `docker logs wanderly-main` | Đảm bảo App và DB đã "bắt tay" nhau. |
| **5** | Truy cập ứng dụng | Mở trình duyệt | Vào địa chỉ `localhost:4000`. |

---

## 4. Những lưu ý khi sang máy khác

1.  **Xung đột cổng (Port Conflict):** Nếu máy khác đang chạy SQL Server cài sẵn (không phải Docker), cổng `1433` có thể bị chiếm. Cần tắt dịch vụ SQL Server của máy đó trước khi chạy Docker.
2.  **Cấu hình RAM:** SQL Server trong Docker ngốn khoảng **2GB RAM**. Hãy dặn người dùng đảm bảo máy có ít nhất **4GB - 8GB RAM** để chạy mượt mà.
3.  **Quyền Admin:** Đôi khi chạy lệnh trên máy lạ cần mở PowerShell bằng quyền **Run as Administrator**.
