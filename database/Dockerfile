FROM mcr.microsoft.com/mssql/server:2022-latest

USER root

# Cài đặt công cụ chuyển đổi định dạng file (dos2unix)
RUN apt-get update && apt-get install -y dos2unix

COPY init.sql init.sql
COPY import-data.sh import-data.sh

# Chuyển đổi file sh sang định dạng chuẩn Linux và cấp quyền
RUN dos2unix import-data.sh && chmod +x import-data.sh

# Chạy SQL Server và script nạp dữ liệu
CMD /bin/bash -c "./import-data.sh & /opt/mssql/bin/sqlservr"