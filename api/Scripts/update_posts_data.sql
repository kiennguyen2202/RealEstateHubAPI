-- Script cập nhật dữ liệu bài đăng mẫu với title và địa chỉ đẹp hơn
-- Diện tích làm tròn số nguyên

-- Danh sách tên đường phổ biến
DECLARE @Streets TABLE (Id INT, Name NVARCHAR(100));
INSERT INTO @Streets VALUES 
(1, N'Nguyễn Văn Linh'),
(2, N'Lê Văn Việt'),
(3, N'Võ Văn Ngân'),
(4, N'Phạm Văn Đồng'),
(5, N'Nguyễn Thị Minh Khai'),
(6, N'Trần Hưng Đạo'),
(7, N'Lý Thường Kiệt'),
(8, N'Hai Bà Trưng'),
(9, N'Điện Biên Phủ'),
(10, N'Cách Mạng Tháng 8'),
(11, N'Nguyễn Huệ'),
(12, N'Lê Lợi'),
(13, N'Pasteur'),
(14, N'Nam Kỳ Khởi Nghĩa'),
(15, N'Nguyễn Đình Chiểu'),
(16, N'Võ Thị Sáu'),
(17, N'Phan Xích Long'),
(18, N'Hoàng Văn Thụ'),
(19, N'Cộng Hòa'),
(20, N'Trường Chinh');

-- Danh sách title mẫu cho từng loại
DECLARE @TitlesNhaRieng TABLE (Id INT, Title NVARCHAR(200));
INSERT INTO @TitlesNhaRieng VALUES
(1, N'Bán nhà mặt tiền đường lớn, vị trí đắc địa'),
(2, N'Nhà phố 3 tầng mới xây, full nội thất cao cấp'),
(3, N'Bán gấp nhà hẻm xe hơi, giá tốt nhất khu vực'),
(4, N'Nhà riêng sổ hồng chính chủ, pháp lý rõ ràng'),
(5, N'Nhà đẹp khu dân cư an ninh, gần trường học'),
(6, N'Bán nhà 2 mặt tiền, kinh doanh sầm uất'),
(7, N'Nhà mới xây thiết kế hiện đại, view thoáng mát'),
(8, N'Nhà phố liền kề khu compound cao cấp'),
(9, N'Bán nhà góc 2 mặt tiền, vị trí vàng'),
(10, N'Nhà riêng gần chợ, trường học, bệnh viện');

DECLARE @TitlesCanHo TABLE (Id INT, Title NVARCHAR(200));
INSERT INTO @TitlesCanHo VALUES
(1, N'Căn hộ cao cấp view sông, full nội thất'),
(2, N'Bán căn hộ 2PN 2WC, giá tốt nhất dự án'),
(3, N'Căn hộ penthouse view toàn cảnh thành phố'),
(4, N'Căn hộ studio tiện nghi, phù hợp đầu tư'),
(5, N'Bán căn hộ duplex thiết kế độc đáo'),
(6, N'Căn hộ officetel vừa ở vừa làm việc'),
(7, N'Căn hộ 3PN rộng rãi, tầng cao view đẹp'),
(8, N'Bán căn hộ góc 2 view, ban công rộng'),
(9, N'Căn hộ mới bàn giao, chưa qua sử dụng'),
(10, N'Căn hộ chung cư tiện ích 5 sao');

DECLARE @TitlesDatNen TABLE (Id INT, Title NVARCHAR(200));
INSERT INTO @TitlesDatNen VALUES
(1, N'Đất nền sổ đỏ chính chủ, thổ cư 100%'),
(2, N'Bán đất mặt tiền đường lớn, kinh doanh tốt'),
(3, N'Đất nền dự án hạ tầng hoàn thiện'),
(4, N'Bán đất góc 2 mặt tiền, vị trí đẹp'),
(5, N'Đất nền khu dân cư cao cấp, an ninh 24/7'),
(6, N'Bán đất view hồ, không khí trong lành'),
(7, N'Đất nền gần KCN, tiềm năng tăng giá cao'),
(8, N'Bán đất thổ cư, xây dựng ngay'),
(9, N'Đất nền phân lô, giá đầu tư hấp dẫn'),
(10, N'Bán đất mặt tiền quốc lộ, thuận tiện kinh doanh');

-- Update từng bài đăng
DECLARE @PostId INT;
DECLARE @CategoryId INT;
DECLARE @NewTitle NVARCHAR(200);
DECLARE @NewStreet NVARCHAR(100);
DECLARE @NewAreaSize INT;
DECLARE @Counter INT = 1;

DECLARE post_cursor CURSOR FOR
SELECT Id, CategoryId FROM Posts WHERE Id >= 268 AND Id <= 327;

OPEN post_cursor;
FETCH NEXT FROM post_cursor INTO @PostId, @CategoryId;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Chọn title theo category
    IF @CategoryId = 1 -- Nhà riêng
        SELECT @NewTitle = Title FROM @TitlesNhaRieng WHERE Id = ((@Counter - 1) % 10) + 1;
    ELSE IF @CategoryId = 10 -- Căn hộ
        SELECT @NewTitle = Title FROM @TitlesCanHo WHERE Id = ((@Counter - 1) % 10) + 1;
    ELSE -- Đất nền
        SELECT @NewTitle = Title FROM @TitlesDatNen WHERE Id = ((@Counter - 1) % 10) + 1;
    
    -- Chọn đường
    SELECT @NewStreet = Name FROM @Streets WHERE Id = ((@Counter - 1) % 20) + 1;
    
    -- Diện tích ngẫu nhiên (số nguyên 50-200)
    SET @NewAreaSize = 50 + (ABS(CHECKSUM(NEWID())) % 151);
    
    -- Update
    UPDATE Posts 
    SET 
        Title = @NewTitle,
        Street_Name = @NewStreet,
        Area_Size = @NewAreaSize
    WHERE Id = @PostId;
    
    SET @Counter = @Counter + 1;
    FETCH NEXT FROM post_cursor INTO @PostId, @CategoryId;
END;

CLOSE post_cursor;
DEALLOCATE post_cursor;

-- Hiển thị kết quả
SELECT TOP 10 Id, Title, Street_Name, Area_Size, Price, PriceUnit 
FROM Posts 
WHERE Id >= 268 
ORDER BY Id;

PRINT N'Đã cập nhật thành công!';
