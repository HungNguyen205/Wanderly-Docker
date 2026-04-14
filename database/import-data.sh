#!/bin/bash

# Đợi SQL Server khởi động xong (tăng lên 30s cho chắc chắn)
echo "Dang cho SQL Server khoi dong..."
sleep 30s

# Tìm đường dẫn đúng của sqlcmd (v17 hoặc v18)
if [ -f /opt/mssql-tools18/bin/sqlcmd ]; then
    SQLCMD=/opt/mssql-tools18/bin/sqlcmd
else
    SQLCMD=/opt/mssql-tools/bin/sqlcmd
fi

echo "Bat dau nap du lieu tu init.sql..."

# Chạy lệnh nạp dữ liệu
# -C: Trust Server Certificate (Bắt buộc cho SQL 2022)
$SQLCMD -S localhost -U sa -P MinhNhatHuit2026! -d master -i init.sql -C

echo "-----------------------------------------------"
echo "SQL Server: Da hoan tat quy trinh khoi tao!"
echo "-----------------------------------------------"