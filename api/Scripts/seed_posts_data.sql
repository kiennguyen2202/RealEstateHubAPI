-- Script tạo dữ liệu mẫu cho Posts với nhiều mức giá và ngày tạo khác nhau
-- Để biểu đồ giá có dữ liệu đa dạng trong 12 tháng

-- Sử dụng UserId = 11 (user hiện có)
-- CategoryId: 1 = Nhà riêng, 10 = Căn hộ chung cư, 4 = Đất nền
-- AreaId: Lấy từ Areas có sẵn
-- PriceUnit: 0 = Tỷ, 1 = Triệu
-- TransactionType: 0 = Sale, 1 = Rent

DECLARE @UserId INT = 11;
DECLARE @i INT = 1;
DECLARE @MonthOffset INT;
DECLARE @Price DECIMAL(18,2);
DECLARE @AreaSize FLOAT;
DECLARE @CategoryId INT;
DECLARE @AreaId INT;
DECLARE @PriceUnit INT;
DECLARE @TransactionType INT;
DECLARE @Created DATETIME;

-- Tạo 60 bài đăng mẫu (5 bài mỗi tháng x 12 tháng)
WHILE @i <= 60
BEGIN
    -- Tính tháng (0-11 tháng trước)
    SET @MonthOffset = (@i - 1) / 5;
    
    -- Random category
    SET @CategoryId = CASE (@i % 3) 
        WHEN 0 THEN 1   -- Nhà riêng
        WHEN 1 THEN 10  -- Căn hộ
        ELSE 4          -- Đất nền
    END;
    
    -- Random area (từ 5-35)
    SET @AreaId = 5 + (@i % 30);
    
    -- Random price (2-15 tỷ cho Sale, 5-50 triệu cho Rent)
    SET @TransactionType = CASE WHEN @i % 4 = 0 THEN 1 ELSE 0 END;
    
    IF @TransactionType = 0 -- Sale
    BEGIN
        SET @PriceUnit = 0; -- Tỷ
        SET @Price = 2 + (RAND(CHECKSUM(NEWID())) * 13); -- 2-15 tỷ
    END
    ELSE -- Rent
    BEGIN
        SET @PriceUnit = 1; -- Triệu
        SET @Price = 5 + (RAND(CHECKSUM(NEWID())) * 45); -- 5-50 triệu
    END
    
    -- Random area size (50-200 m2)
    SET @AreaSize = 50 + (RAND(CHECKSUM(NEWID())) * 150);
    
    -- Ngày tạo (trong tháng tương ứng)
    SET @Created = DATEADD(MONTH, -@MonthOffset, GETDATE());
    SET @Created = DATEADD(DAY, -(@i % 28), @Created);
    
    -- Insert post
    INSERT INTO Posts (
        Title, Description, Price, PriceUnit, TransactionType, Status, 
        Created, Area_Size, Street_Name, UserId, CategoryId, AreaId, 
        IsApproved, ExpiryDate
    )
    VALUES (
        N'Bài đăng mẫu ' + CAST(@i AS NVARCHAR(10)) + N' - ' + 
            CASE @CategoryId 
                WHEN 1 THEN N'Nhà riêng' 
                WHEN 10 THEN N'Căn hộ' 
                ELSE N'Đất nền' 
            END,
        N'Mô tả chi tiết cho bài đăng mẫu số ' + CAST(@i AS NVARCHAR(10)) + 
            N'. Vị trí đẹp, giá tốt, pháp lý rõ ràng.',
        @Price,
        @PriceUnit,
        @TransactionType,
        'active',
        @Created,
        @AreaSize,
        N'Đường số ' + CAST((@i % 20) + 1 AS NVARCHAR(10)),
        @UserId,
        @CategoryId,
        @AreaId,
        1, -- IsApproved = true
        DATEADD(MONTH, 3, @Created) -- Hết hạn sau 3 tháng
    );
    
    SET @i = @i + 1;
END;

-- Hiển thị kết quả
SELECT 
    YEAR(Created) as Year,
    MONTH(Created) as Month,
    COUNT(*) as PostCount,
    AVG(CASE WHEN PriceUnit = 0 THEN Price * 1000 ELSE Price END / Area_Size) as AvgPricePerM2
FROM Posts 
WHERE IsApproved = 1
GROUP BY YEAR(Created), MONTH(Created)
ORDER BY Year DESC, Month DESC;

PRINT 'Đã tạo 60 bài đăng mẫu thành công!';
