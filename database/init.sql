SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

-------------------DATABASE---------------------
CREATE DATABASE Wanderly
GO
USE Wanderly
GO

CREATE TABLE Roles (
    RoleId INT IDENTITY PRIMARY KEY,
    RoleName NVARCHAR(20) NOT NULL UNIQUE
);
GO

CREATE TABLE Users (
    UserId INT PRIMARY KEY IDENTITY(1,1),
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    PhoneNumber NVARCHAR(20) NULL,
    ProfilePictureUrl NVARCHAR(500),
    Bio NVARCHAR(1000),
    IsActive BIT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2,
    LastLoginAt DATETIME2 NULL, 
	ResetOtpHash NVARCHAR(255) NULL,
	OtpExpiresAt DATETIME2 NULL,
    RoleId INT NOT NULL DEFAULT 2,
    CONSTRAINT FK_USERS_ROLES FOREIGN KEY (RoleId) REFERENCES Roles(RoleId)
);
GO

CREATE TABLE UserFollows (
    FollowerId INT NOT NULL,
    FollowingId INT NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY (FollowerId, FollowingId),
    CONSTRAINT FK_UserFollows_Follower FOREIGN KEY (FollowerId) REFERENCES Users(UserId),
    CONSTRAINT FK_UserFollows_Following FOREIGN KEY (FollowingId) REFERENCES Users(UserId)
);

CREATE TABLE Locations (
    LocationId INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(200) NOT NULL,
    Address NVARCHAR(500),
    City NVARCHAR(100),
    Country NVARCHAR(100),
    Description NVARCHAR(MAX),
    Latitude DECIMAL(9, 6),
    Longitude DECIMAL(9, 6),
    ImageUrl NVARCHAR(500),
    IsDeleted BIT NOT NULL DEFAULT 0
);

CREATE TABLE ServiceCategories (
    CategoryID INT IDENTITY PRIMARY KEY,
    ServiceTypeName NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(500),
    IsDeleted BIT NOT NULL DEFAULT 0
);
GO

CREATE TABLE SpecialFeatures (
    FeatureId INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(500),
    IsDeleted BIT NOT NULL DEFAULT 0
);
GO

CREATE TABLE ServiceProviders (
    ProviderId INT PRIMARY KEY IDENTITY(1,1),
    OwnerUserId INT NOT NULL UNIQUE,
    CompanyName NVARCHAR(200) NOT NULL,
    ContactEmail NVARCHAR(255) NOT NULL UNIQUE,
    PhoneNumber NVARCHAR(20),
    Address NVARCHAR(500),
    IsVerified BIT NOT NULL DEFAULT 0,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_ServiceProviders_Users FOREIGN KEY (OwnerUserId) REFERENCES Users(UserId)
);
GO

CREATE TABLE Services (
    ServiceId INT PRIMARY KEY IDENTITY(1,1),
    ProviderId INT NOT NULL,
    LocationId INT,
	Address NVARCHAR(500),
	Latitude DECIMAL(9, 6),
	Longitude DECIMAL(9, 6),
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX),
    CategoryID INT NOT NULL,
    AverageRating DECIMAL(3, 2) NOT NULL DEFAULT 0,
    Status NVARCHAR(20) NOT NULL CHECK (Status IN ('draft', 'active', 'inactive', 'archived')) DEFAULT 'draft',
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Services_Providers FOREIGN KEY (ProviderId) REFERENCES ServiceProviders(ProviderId),
    CONSTRAINT FK_Services_Locations FOREIGN KEY (LocationId) REFERENCES Locations(LocationId),
    CONSTRAINT FK_Services_Category FOREIGN KEY (CategoryID) REFERENCES ServiceCategories(CategoryID)
);
GO

CREATE TABLE ServiceImages (
        ImageId INT PRIMARY KEY IDENTITY(1,1),
        ServiceId INT NOT NULL,
        ImageUrl NVARCHAR(500) NOT NULL,
        Caption NVARCHAR(255) NULL,
        DisplayOrder INT NOT NULL DEFAULT 0,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_ServiceImages_Service FOREIGN KEY (ServiceId) 
            REFERENCES Services(ServiceId) ON DELETE CASCADE
);
GO

CREATE NONCLUSTERED INDEX IX_ServiceImages_ServiceId 
ON ServiceImages(ServiceId) 
WHERE IsDeleted = 0;
GO

CREATE TABLE ServiceFeatures (
    ServiceId INT NOT NULL,
    FeatureId INT NOT NULL,
    PRIMARY KEY (ServiceId, FeatureId),
    CONSTRAINT FK_ServiceFeatures_Service FOREIGN KEY (ServiceId) REFERENCES Services(ServiceId) ON DELETE CASCADE,
    CONSTRAINT FK_ServiceFeatures_Feature FOREIGN KEY (FeatureId) REFERENCES SpecialFeatures(FeatureId) ON DELETE CASCADE
);
GO

CREATE TABLE ServiceAccommodations (
    ServiceId INT PRIMARY KEY,
    AccommodationType NVARCHAR(50),
    StarRating INT CHECK (StarRating BETWEEN 1 AND 5),
    Amenities NVARCHAR(MAX),
    CONSTRAINT FK_ServiceAccommodations_Services FOREIGN KEY (ServiceId) REFERENCES Services(ServiceId) ON DELETE CASCADE
);
GO

CREATE TABLE ServiceTransports (
    ServiceId INT PRIMARY KEY,
    TransportMode NVARCHAR(50),
    DepartureLocationId INT,
    ArrivalLocationId INT,
    CONSTRAINT FK_ServiceTransports_Services FOREIGN KEY (ServiceId) REFERENCES Services(ServiceId) ON DELETE CASCADE,
    CONSTRAINT FK_ServiceTransports_Departure FOREIGN KEY (DepartureLocationId) REFERENCES Locations(LocationId),
    CONSTRAINT FK_ServiceTransports_Arrival FOREIGN KEY (ArrivalLocationId) REFERENCES Locations(LocationId)
);
GO

CREATE TABLE ServiceActivities (
    ServiceId INT PRIMARY KEY,
    ActivityType NVARCHAR(100),
    DurationHours DECIMAL(4, 1),
    GuideLanguage NVARCHAR(100),
    CONSTRAINT FK_ServiceActivities_Services FOREIGN KEY (ServiceId) REFERENCES Services(ServiceId) ON DELETE CASCADE
);
GO

CREATE TABLE ServiceAvailabilities (
    AvailabilityId INT PRIMARY KEY IDENTITY(1,1),
    ServiceId INT NOT NULL,
    AvailabilityDate DATE NOT NULL,
    StartTime TIME,
    EndTime TIME NULL,
    Price DECIMAL(18, 2) NOT NULL,
    TotalUnits INT NOT NULL, 
    BookedUnits INT NOT NULL DEFAULT 0, 
    Status NVARCHAR(20) NOT NULL CHECK (Status IN ('open', 'closed', 'sold_out')) DEFAULT 'open',
    IsDeleted BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_ServiceAvailability_Service FOREIGN KEY (ServiceId) REFERENCES Services(ServiceId) ON DELETE CASCADE
);
GO

-- Filtered unique index: chỉ check uniqueness trên records chưa bị soft delete
CREATE UNIQUE INDEX UQ_ServiceAvailability_Active 
ON ServiceAvailabilities (ServiceId, AvailabilityDate, StartTime)
WHERE IsDeleted = 0;
GO

CREATE TABLE Itineraries (
    ItineraryId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(2000),
    StartDate DATETIME,
    EndDate DATETIME,
    CoverImageUrl NVARCHAR(500),
    IsPublic BIT NOT NULL DEFAULT 0,
    Status NVARCHAR(20) NOT NULL CHECK (Status IN ('draft', 'published')) DEFAULT 'draft',
    IsDeleted BIT NOT NULL DEFAULT 0,
    ExportedAt DATETIME2 NULL,
    LastSharedLink NVARCHAR(500) NULL,  
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL,
    CONSTRAINT FK_Itineraries_Users FOREIGN KEY (UserId) REFERENCES Users(UserId)
);
GO

CREATE TABLE ItineraryItems (
    ItineraryItemId INT PRIMARY KEY IDENTITY(1,1),
    ItineraryId INT NOT NULL,
    LocationId INT,
    ServiceId INT,
    ItemDate DATE NOT NULL,
    StartTime TIME,
    EndTime TIME,
    ActivityDescription NVARCHAR(1000) NOT NULL,
    ItemOrder INT NOT NULL,
    IsDeleted BIT NOT NULL DEFAULT 0,
    UpdatedAt DATETIME2 NULL,

    CONSTRAINT FK_ItineraryItems_Itinerary FOREIGN KEY (ItineraryId) REFERENCES Itineraries(ItineraryId) ON DELETE CASCADE,
    CONSTRAINT FK_ItineraryItems_Location FOREIGN KEY (LocationId) REFERENCES Locations(LocationId),
    CONSTRAINT FK_ItineraryItems_Service FOREIGN KEY (ServiceId) REFERENCES Services(ServiceId)
);
GO

CREATE TABLE ItineraryCollaborators (
    ItineraryId INT NOT NULL,
    UserId INT NOT NULL,
    PermissionLevel NVARCHAR(10) NOT NULL CHECK (PermissionLevel IN ('view', 'edit')),
    PRIMARY KEY (ItineraryId, UserId),
    CONSTRAINT FK_ItineraryCollaborators_Itinerary FOREIGN KEY (ItineraryId) REFERENCES Itineraries(ItineraryId) ON DELETE CASCADE,
    CONSTRAINT FK_ItineraryCollaborators_User FOREIGN KEY (UserId) REFERENCES Users(UserId)
);
GO

CREATE TABLE Posts (
    PostId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,
    Title NVARCHAR(300) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    ImageUrl NVARCHAR(500),
    Status NVARCHAR(20) NOT NULL CHECK (Status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
    IsEdited BIT NOT NULL DEFAULT 0,
    IsDeleted BIT NOT NULL DEFAULT 0,
    PublishedAt DATETIME2,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2,
    CONSTRAINT FK_Posts_Users FOREIGN KEY (UserId) REFERENCES Users(UserId)
);
GO

CREATE TABLE Tags (
    TagId INT PRIMARY KEY IDENTITY(1,1),
    TagName NVARCHAR(100) NOT NULL UNIQUE,
    IsDeleted BIT NOT NULL DEFAULT 0
);
GO

CREATE TABLE PostTags (
    PostId INT NOT NULL,
    TagId INT NOT NULL,
    PRIMARY KEY (PostId, TagId),
    CONSTRAINT FK_PostTags_Post FOREIGN KEY (PostId) REFERENCES Posts(PostId),
    CONSTRAINT FK_PostTags_Tag FOREIGN KEY (TagId) REFERENCES Tags(TagId)
);
GO

CREATE TABLE Comments (
    CommentId INT PRIMARY KEY IDENTITY(1,1),
    PostId INT NOT NULL,
    UserId INT NOT NULL,
    ImageUrl NVARCHAR(500),
    ParentCommentId INT,
    Content NVARCHAR(2000) NOT NULL,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Comments_Post FOREIGN KEY (PostId) REFERENCES Posts(PostId) ON DELETE CASCADE,
    CONSTRAINT FK_Comments_User FOREIGN KEY (UserId) REFERENCES Users(UserId),
    CONSTRAINT FK_Comments_Parent FOREIGN KEY (ParentCommentId) REFERENCES Comments(CommentId)
);
GO

CREATE TABLE PostLikes (
    UserId INT NOT NULL,
    PostId INT NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY (UserId, PostId),
    CONSTRAINT FK_PostLikes_User FOREIGN KEY (UserId) REFERENCES Users(UserId),
    CONSTRAINT FK_PostLikes_Post FOREIGN KEY (PostId) REFERENCES Posts(PostId) ON DELETE CASCADE
);
GO

CREATE TABLE CommentLikes (
    UserId INT NOT NULL,
    CommentId INT NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY (UserId, CommentId),
    CONSTRAINT FK_CommentLikes_User FOREIGN KEY (UserId) REFERENCES Users(UserId),
    CONSTRAINT FK_CommentLikes_Comment FOREIGN KEY (CommentId) REFERENCES Comments(CommentId)
);
GO

CREATE TABLE Promotions (
    PromotionId INT PRIMARY KEY IDENTITY(1,1),
    Code NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(500),
    DiscountType NVARCHAR(20) NOT NULL CHECK (DiscountType IN ('percentage', 'fixed_amount')),
    DiscountValue DECIMAL(18, 2) NOT NULL,
    StartDate DATETIME2 NOT NULL,
    EndDate DATETIME2 NOT NULL,
    UsageLimit INT,
    IsDeleted BIT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE Bookings (
    BookingId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,
    BookingCode NVARCHAR(20) NOT NULL UNIQUE,
    Subtotal DECIMAL(18, 2) NOT NULL,
    DiscountAmount DECIMAL(18, 2) NOT NULL DEFAULT 0,
    TotalAmount DECIMAL(18, 2) NOT NULL,
    PromotionId INT NULL,
    Status NVARCHAR(30) NOT NULL CHECK (Status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Bookings_User FOREIGN KEY (UserId) REFERENCES Users(UserId),
    CONSTRAINT FK_Bookings_Promotion FOREIGN KEY (PromotionId) REFERENCES Promotions(PromotionId)
);
GO

CREATE TABLE BookingItems (
    BookingItemId INT PRIMARY KEY IDENTITY(1,1),
    BookingId INT NOT NULL,
    ServiceAvailabilityId INT NOT NULL,
    Price DECIMAL(18, 2) NOT NULL,
    Quantity INT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_BookingItems_Booking FOREIGN KEY (BookingId) REFERENCES Bookings(BookingId) ON DELETE CASCADE,
    CONSTRAINT FK_BookingItems_Availability FOREIGN KEY (ServiceAvailabilityId) REFERENCES ServiceAvailabilities(AvailabilityId)
);
GO

CREATE TABLE PaymentGateways (
    GatewayId INT IDENTITY(1,1) PRIMARY KEY,
    GatewayName NVARCHAR(50) NOT NULL UNIQUE,
    IsDeleted BIT NOT NULL DEFAULT 0
);
GO

CREATE TABLE Transactions (
    TransactionId INT PRIMARY KEY IDENTITY(1,1),
    BookingId INT NOT NULL,
    Amount DECIMAL(18, 2) NOT NULL,
    PaymentMethod NVARCHAR(50),
    Currency CHAR(5),
    GatewayId INT NOT NULL,
    Status NVARCHAR(30) NOT NULL CHECK (Status IN ('succeeded', 'failed', 'pending')),
    IsDeleted BIT NOT NULL DEFAULT 0,
    TransactionDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Transactions_Booking FOREIGN KEY (BookingId) REFERENCES Bookings(BookingId),
    CONSTRAINT FK_Transactions_PaymentGateways FOREIGN KEY (GatewayId) REFERENCES PaymentGateways(GatewayId)
);
GO

CREATE TABLE Refunds (
    RefundId INT PRIMARY KEY IDENTITY(1,1),
    BookingId INT NOT NULL,
    OriginalTransactionId INT,
    Amount DECIMAL(18, 2) NOT NULL,
    Reason NVARCHAR(1000),
    RefundMethod NVARCHAR(50),
    Status NVARCHAR(30) NOT NULL CHECK (Status IN ('pending', 'approved', 'processed', 'rejected')),
    IsDeleted BIT NOT NULL DEFAULT 0,
    RequestedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ProcessedAt DATETIME2,
    AdminUserId INT,
    CONSTRAINT FK_Refunds_Booking FOREIGN KEY (BookingId) REFERENCES Bookings(BookingId),
    CONSTRAINT FK_Refunds_Transaction FOREIGN KEY (OriginalTransactionId) REFERENCES Transactions(TransactionId),
    CONSTRAINT FK_Refunds_Admin FOREIGN KEY (AdminUserId) REFERENCES Users(UserId)
);
GO

CREATE TABLE Reviews (
    ReviewId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,
    ServiceId INT NOT NULL,
    Rating INT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    Title NVARCHAR(200),
    Comment NVARCHAR(MAX),
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Reviews_User FOREIGN KEY (UserId) REFERENCES Users(UserId),
    CONSTRAINT FK_Reviews_Service FOREIGN KEY (ServiceId) REFERENCES Services(ServiceId) ON DELETE CASCADE
);
GO

CREATE UNIQUE NONCLUSTERED INDEX UQ_Reviews_User_Service_Active
ON Reviews (UserId, ServiceId)
WHERE IsDeleted = 0;
GO

CREATE TABLE Reports (
    ReportId INT PRIMARY KEY IDENTITY(1,1),
    PostId INT NULL,
    ReporterId INT NOT NULL,
    Reason NVARCHAR(500) NOT NULL,
    Status NVARCHAR(30) NOT NULL CHECK (Status IN ('pending', 'reviewed', 'resolved', 'rejected')) DEFAULT 'pending',
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_Reports_Post FOREIGN KEY (PostId) REFERENCES Posts(PostId),
    CONSTRAINT FK_Reports_User FOREIGN KEY (ReporterId) REFERENCES Users(UserId)
);
GO

CREATE TABLE ItineraryLikes (
    UserId INT NOT NULL,
    ItineraryId INT NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY (UserId, ItineraryId),
    CONSTRAINT FK_ItineraryLikes_User FOREIGN KEY (UserId) REFERENCES Users(UserId),
    CONSTRAINT FK_ItineraryLikes_Itinerary FOREIGN KEY (ItineraryId) REFERENCES Itineraries(ItineraryId) ON DELETE CASCADE
);
GO

CREATE TABLE ReviewLikes (
    UserId INT NOT NULL,
    ReviewId INT NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY (UserId, ReviewId),
    CONSTRAINT FK_ReviewLikes_User FOREIGN KEY (UserId) REFERENCES Users(UserId),
    CONSTRAINT FK_ReviewLikes_Review FOREIGN KEY (ReviewId) REFERENCES Reviews(ReviewId) ON DELETE CASCADE
);
GO

CREATE TABLE Notifications (
    NotificationId BIGINT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    Content NVARCHAR(1000) NOT NULL,
    NotificationType NVARCHAR(50),
    Priority NVARCHAR(20) NOT NULL CHECK (Priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    ExpiryDate DATETIME2 NULL,
    LinkToAction NVARCHAR(500),
    Status NVARCHAR(20) NOT NULL CHECK (Status IN ('new', 'read', 'expired')) DEFAULT 'new',
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Notifications_User FOREIGN KEY (UserId) REFERENCES Users(UserId)
);
GO

CREATE TABLE SystemSettings (
    SettingKey NVARCHAR(100) PRIMARY KEY,
    SettingValue NVARCHAR(500),
    UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE AuditLogs (
    LogId BIGINT PRIMARY KEY IDENTITY(1,1),
    AdminId INT NOT NULL,
    Action NVARCHAR(200) NOT NULL,
    Target NVARCHAR(200) NULL,
    Details NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_AuditLogs_Admin FOREIGN KEY (AdminId) REFERENCES Users(UserId)
);
GO

CREATE TABLE ReportsSummary (
    ReportSummaryId INT PRIMARY KEY IDENTITY(1,1),
    ReportDate DATE NOT NULL,
    TotalUsers INT,
    TotalPosts INT,
    TotalReports INT,
    TotalResolvedReports INT,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
--------------------------------------------------
-------------------FUNCTIONS---------------------
CREATE OR ALTER FUNCTION fn_GenerateBookingCode()
RETURNS NVARCHAR(20)
AS
BEGIN
    DECLARE @DatePart NVARCHAR(8) = FORMAT(GETDATE(), 'yyyyMMdd');
    DECLARE @MaxId INT;
    
    SELECT @MaxId = ISNULL(MAX(BookingId), 0) + 1 FROM Bookings;
    
    RETURN 'BK' + @DatePart + RIGHT('000' + CAST(@MaxId AS NVARCHAR(10)), 4);
END
GO

CREATE OR ALTER FUNCTION fn_Reviews_GetProviderAverageRating(@ProviderId INT)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        @ProviderId AS ProviderId,
        COUNT(DISTINCT r.ReviewId) AS TotalReviews,
        AVG(CAST(r.Rating AS FLOAT)) AS AverageRating,
        COUNT(DISTINCT r.ServiceId) AS ServicesReviewed
    FROM Reviews r
    INNER JOIN Services s ON r.ServiceId = s.ServiceId
    WHERE s.ProviderId = @ProviderId 
        AND r.IsDeleted = 0 
        AND s.IsDeleted = 0
);
GO
-------------------PROCEDURES---------------------
--========================================================
----------------------ADMINS-----------------------------
--========================================================
CREATE OR ALTER PROCEDURE sp_Admin_Login
    @Email NVARCHAR(255),
    @Password NVARCHAR(255),
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @UserId INT, @FullName NVARCHAR(100), @RoleId INT, @StoredHash NVARCHAR(255);

    SELECT @UserId = UserId, @FullName = FullName, @RoleId = RoleId, @StoredHash = PasswordHash
    FROM Users
    WHERE Email = @Email AND RoleId = 1 AND IsActive = 1 AND IsDeleted = 0;

    IF @UserId IS NULL
    BEGIN
        SET @Result = -1; -- Không tìm thấy Admin
        RETURN;
    END

    -- So sánh mật khẩu đã băm
    IF @StoredHash = CONVERT(NVARCHAR(64), HASHBYTES('SHA2_256', @Password), 2)
    BEGIN
        SET @Result = 1; -- Đăng nhập thành công
        SELECT @UserId AS UserId, @FullName AS FullName, @RoleId AS RoleId;
    END
    ELSE
    BEGIN
        SET @Result = 0; -- Sai mật khẩu
    END
END;
GO
--========================================================
----------------------USERS-----------------------------
--========================================================
CREATE OR ALTER PROCEDURE sp_User_Register
    @FullName NVARCHAR(100),
    @Email NVARCHAR(255),
    @Password NVARCHAR(255),
    @RoleId INT = 2,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM Users WHERE Email = @Email AND IsDeleted = 0)
        BEGIN
            SET @Result = -1; -- Email đã tồn tại
            RETURN;
        END

        INSERT INTO Users (FullName, Email, PasswordHash, RoleId, IsActive, CreatedAt)
        VALUES (
            @FullName, 
            @Email, 
            CONVERT(NVARCHAR(64), HASHBYTES('SHA2_256', @Password), 2), 
            @RoleId, 
            1, 
            SYSUTCDATETIME()
        );

        SET @Result = 1; -- Thành công
    END TRY
    BEGIN CATCH
        SET @Result = -99; -- Lỗi hệ thống
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_User_Login
    @Email NVARCHAR(255),
    @Password NVARCHAR(255),
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @UserId INT, @FullName NVARCHAR(100), @RoleId INT, @StoredHash NVARCHAR(255);

    SELECT @UserId = UserId, @FullName = FullName, @RoleId = RoleId, @StoredHash = PasswordHash
    FROM Users
    WHERE Email = @Email AND IsActive = 1 AND IsDeleted = 0;

    IF @UserId IS NULL
    BEGIN
        SET @Result = -1; -- Tài khoản không tồn tại
        RETURN;
    END

    IF @StoredHash = CONVERT(NVARCHAR(64), HASHBYTES('SHA2_256', @Password), 2)
    BEGIN
        SET @Result = 1; -- Thành công
        SELECT @UserId AS UserId, @FullName AS FullName, @RoleId AS RoleId;
    END
    ELSE
    BEGIN
        SET @Result = 0; -- Sai mật khẩu
    END
END;
GO

CREATE OR ALTER PROCEDURE sp_User_CreateOtp
    @Email NVARCHAR(255),
    @Otp NVARCHAR(255),
    @ExpiresAt DATETIME2,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        DECLARE @UserId INT;
        DECLARE @OtpHash NVARCHAR(255);
        
        SET @OtpHash = CONVERT(NVARCHAR(64), HASHBYTES('SHA2_256', @Otp), 2);
        
        SELECT @UserId = UserId
        FROM Users
        WHERE Email = @Email AND IsDeleted = 0;

        IF @UserId IS NULL
        BEGIN
            SET @Result = 1; 
            RETURN;
        END
        
        UPDATE Users
        SET ResetOtpHash = @OtpHash,
            OtpExpiresAt = @ExpiresAt
        WHERE UserId = @UserId;
        
        SET @Result = 1;

    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_User_ResetPasswordByOtp
    @Email NVARCHAR(255),
    @NewPassword NVARCHAR(255),
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM Users WHERE Email = @Email AND IsDeleted = 0)
    BEGIN
        UPDATE Users
        SET PasswordHash = CONVERT(NVARCHAR(64), HASHBYTES('SHA2_256', @NewPassword), 2),
            ResetOtpHash = NULL,
            OtpExpiresAt = NULL,
            UpdatedAt = SYSUTCDATETIME()
        WHERE Email = @Email;
        
        SET @Result = 1;
    END
    ELSE
    BEGIN
        SET @Result = -1;
    END
END;
GO

CREATE OR ALTER PROCEDURE sp_Users_GetById
    @UserId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Users WHERE UserId = @UserId AND IsDeleted = 0)
        BEGIN
            SET @Result = -1;
            RETURN;
        END;

        SELECT 
            UserId             AS Id,
            FullName,
            Email,
            PhoneNumber,
            RoleId,
            IsActive,
            ProfilePictureUrl,
            Bio,
            CreatedAt,
            UpdatedAt,
            LastLoginAt
        FROM Users
        WHERE UserId = @UserId AND IsDeleted = 0;

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_Users_UpdateProfile
    @UserId INT,
    @FullName NVARCHAR(100) = NULL,
    @PhoneNumber NVARCHAR(20) = NULL,
    @ProfilePictureUrl NVARCHAR(500) = NULL,
    @Bio NVARCHAR(1000) = NULL,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        IF @PhoneNumber IS NOT NULL 
           AND EXISTS (
             SELECT 1 
             FROM Users 
             WHERE PhoneNumber = @PhoneNumber 
               AND UserId != @UserId 
               AND IsDeleted = 0
            )
        BEGIN
            SET @Result = -1;
            RETURN;
        END;

        UPDATE Users
        SET
            FullName = ISNULL(@FullName, FullName),
            PhoneNumber = ISNULL(@PhoneNumber, PhoneNumber),
            ProfilePictureUrl = ISNULL(@ProfilePictureUrl, ProfilePictureUrl),
            Bio = ISNULL(@Bio, Bio),
            UpdatedAt = SYSUTCDATETIME()
        WHERE UserId = @UserId AND IsDeleted = 0;


        IF @@ROWCOUNT = 0
            SET @Result = -2;
        ELSE
            SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_Users_ChangePassword
    @UserId INT,
    @OldPassword NVARCHAR(255),
    @NewPassword NVARCHAR(255),
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @CurrentHash NVARCHAR(255);

    SELECT @CurrentHash = PasswordHash FROM Users WHERE UserId = @UserId AND IsDeleted = 0;

    -- Kiểm tra mật khẩu cũ
    IF @CurrentHash <> CONVERT(NVARCHAR(64), HASHBYTES('SHA2_256', @OldPassword), 2)
    BEGIN
        SET @Result = -1; -- Mật khẩu cũ không đúng
        RETURN;
    END

    -- Cập nhật mật khẩu mới
    UPDATE Users
    SET PasswordHash = CONVERT(NVARCHAR(64), HASHBYTES('SHA2_256', @NewPassword), 2),
        UpdatedAt = SYSUTCDATETIME()
    WHERE UserId = @UserId;

    SET @Result = 1;
END;
GO

CREATE OR ALTER PROCEDURE sp_Users_Follow
    @FollowerId INT,
    @FollowingId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        IF @FollowerId = @FollowingId
        BEGIN
            SET @Result = -1;
            RETURN;
        END

        IF EXISTS (SELECT 1 FROM UserFollows WHERE FollowerId = @FollowerId AND FollowingId = @FollowingId)
        BEGIN
            SET @Result = -2;
            RETURN;
        END

        INSERT INTO UserFollows (FollowerId, FollowingId)
        VALUES (@FollowerId, @FollowingId);

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_Users_Unfollow
    @FollowerId INT,
    @FollowingId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        IF @FollowerId = @FollowingId
        BEGIN
            SET @Result = 0; 
            RETURN;
        END

        DELETE FROM UserFollows
        WHERE FollowerId = @FollowerId AND FollowingId = @FollowingId;
        
        IF @@ROWCOUNT > 0
        BEGIN
            SET @Result = 1;
        END
        ELSE
        BEGIN
            SET @Result = -1;
        END
        
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_Users_GetFollowers
    @UserId INT,
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

        SELECT COUNT(*) AS TotalCount
        FROM UserFollows uf
        INNER JOIN Users u ON uf.FollowerId = u.UserId
        WHERE uf.FollowingId = @UserId AND u.IsDeleted = 0;

        SELECT 
            u.UserId,
            u.FullName,
            u.ProfilePictureUrl,
            u.Bio,
            uf.CreatedAt AS FollowedAt,
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM UserFollows 
                    WHERE FollowerId = @UserId AND FollowingId = u.UserId
                ) THEN 1 
                ELSE 0 
            END AS IsFollowingBack
        FROM UserFollows uf
        INNER JOIN Users u ON uf.FollowerId = u.UserId
        WHERE uf.FollowingId = @UserId AND u.IsDeleted = 0
        ORDER BY uf.CreatedAt DESC
        OFFSET @Offset ROWS
        FETCH NEXT @PageSize ROWS ONLY;

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_Users_GetFollowing
    @UserId INT,
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

        SELECT COUNT(*) AS TotalCount
        FROM UserFollows uf
        INNER JOIN Users u ON uf.FollowingId = u.UserId
        WHERE uf.FollowerId = @UserId AND u.IsDeleted = 0;

        SELECT 
            u.UserId,
            u.FullName,
            u.ProfilePictureUrl,
            u.Bio,
            uf.CreatedAt AS FollowedAt,
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM UserFollows 
                    WHERE FollowerId = u.UserId AND FollowingId = @UserId
                ) THEN 1 
                ELSE 0 
            END AS IsFollowingBack
        FROM UserFollows uf
        INNER JOIN Users u ON uf.FollowingId = u.UserId
        WHERE uf.FollowerId = @UserId AND u.IsDeleted = 0
        ORDER BY uf.CreatedAt DESC
        OFFSET @Offset ROWS
        FETCH NEXT @PageSize ROWS ONLY;

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_Users_CheckFollowStatus
    @FollowerId INT,
    @FollowingId INT,
    @IsFollowing BIT OUTPUT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (
            SELECT 1 FROM UserFollows 
            WHERE FollowerId = @FollowerId AND FollowingId = @FollowingId
        )
        BEGIN
            SET @IsFollowing = 1;
        END
        ELSE
        BEGIN
            SET @IsFollowing = 0;
        END

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO
--========================================================
------------------------LOCATIONS-------------------------
--========================================================
CREATE OR ALTER PROCEDURE sp_Locations_GetList
    @PageNumber INT = 1,
    @PageSize INT = 10,
    @Keyword NVARCHAR(200) = NULL,
    @City NVARCHAR(100) = NULL,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
        
        DECLARE @FilterCondition NVARCHAR(MAX) = N'WHERE IsDeleted = 0';
        
        IF @Keyword IS NOT NULL
        BEGIN
            SET @FilterCondition = @FilterCondition + N' AND (Name LIKE ''%'' + @Keyword + ''%'' OR Description LIKE ''%'' + @Keyword + ''%'')';
        END

        IF @City IS NOT NULL
        BEGIN
            SET @FilterCondition = @FilterCondition + N' AND City = @City';
        END

        DECLARE @TotalCountQuery NVARCHAR(MAX) = N'SELECT COUNT(LocationId) AS TotalCount FROM Locations ' + @FilterCondition;
        EXEC sp_executesql @TotalCountQuery, N'@Keyword NVARCHAR(200), @City NVARCHAR(100)', @Keyword, @City;

        DECLARE @ListQuery NVARCHAR(MAX) = N'
             SELECT 
                 LocationId, Name, Address, City, Country, Description, Latitude, Longitude, ImageUrl
             FROM Locations ' + @FilterCondition + N'
             ORDER BY LocationId DESC 
             OFFSET @Offset ROWS 
             FETCH NEXT @PageSize ROWS ONLY;';

        EXEC sp_executesql @ListQuery, N'@Offset INT, @PageSize INT, @Keyword NVARCHAR(200), @City NVARCHAR(100)', @Offset, @PageSize, @Keyword, @City;

        SET @Result = 1;

    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_Locations_GetById
    @LocationId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT 
            LocationId, Name, Address, City, Country, Description, Latitude, Longitude, ImageUrl
        FROM Locations
        WHERE LocationId = @LocationId AND IsDeleted = 0;

        IF @@ROWCOUNT = 0
            SET @Result = -1;
        ELSE
            SET @Result = 1;

    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE sp_Locations_Create
    @Name NVARCHAR(200),
    @Address NVARCHAR(500) = NULL,
    @City NVARCHAR(100) = NULL,
    @Country NVARCHAR(100) = NULL,
    @Description NVARCHAR(MAX) = NULL,
    @Latitude DECIMAL(9, 6) = NULL,
    @Longitude DECIMAL(9, 6) = NULL,
    @ImageUrl NVARCHAR(500) = NULL,
    @NewLocationId INT OUTPUT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM Locations WHERE Name = @Name AND IsDeleted = 0)
        BEGIN
            SET @Result = -1;
            RETURN;
        END

        INSERT INTO Locations (Name, Address, City, Country, Description, Latitude, Longitude, ImageUrl)
        VALUES (@Name, @Address, @City, @Country, @Description, @Latitude, @Longitude, @ImageUrl);

        SET @NewLocationId = SCOPE_IDENTITY();
        SET @Result = 1;

    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE sp_Locations_Update
    @LocationId INT,
    @Name NVARCHAR(200) = NULL,
    @Address NVARCHAR(500) = NULL,
    @City NVARCHAR(100) = NULL,
    @Country NVARCHAR(100) = NULL,
    @Description NVARCHAR(MAX) = NULL,
    @Latitude DECIMAL(9, 6) = NULL,
    @Longitude DECIMAL(9, 6) = NULL,
    @ImageUrl NVARCHAR(500) = NULL,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Locations WHERE LocationId = @LocationId AND IsDeleted = 0)
        BEGIN
            SET @Result = -2;
            RETURN;
        END

        IF @Name IS NOT NULL AND EXISTS (SELECT 1 FROM Locations WHERE Name = @Name AND LocationId != @LocationId AND IsDeleted = 0)
        BEGIN
            SET @Result = -1;
            RETURN;
        END

        UPDATE Locations
        SET 
            Name = ISNULL(@Name, Name),
            Address = ISNULL(@Address, Address),
            City = ISNULL(@City, City),
            Country = ISNULL(@Country, Country),
            Description = ISNULL(@Description, Description),
            Latitude = ISNULL(@Latitude, Latitude),
            Longitude = ISNULL(@Longitude, Longitude),
            ImageUrl = ISNULL(@ImageUrl, ImageUrl)
        WHERE LocationId = @LocationId;

        SET @Result = 1;

    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE sp_Locations_Delete
    @LocationId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE Locations
        SET IsDeleted = 1
        WHERE LocationId = @LocationId AND IsDeleted = 0;

        IF @@ROWCOUNT = 0
        BEGIN
            SET @Result = -1;
            RETURN;
        END

        SET @Result = 1;

    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END
GO
--========================================================
------------------------CATEGORIES-------------------------
--========================================================
CREATE OR ALTER PROCEDURE sp_Categories_GetAll
AS
BEGIN
    SELECT CategoryID, ServiceTypeName, Description 
    FROM ServiceCategories 
    WHERE IsDeleted = 0
    ORDER BY CategoryID DESC;
END;
GO

CREATE OR ALTER PROCEDURE sp_Categories_GetById
    @CategoryId INT
AS
BEGIN
    SELECT CategoryID, ServiceTypeName, Description 
    FROM ServiceCategories 
    WHERE CategoryID = @CategoryId AND IsDeleted = 0;
END;
GO

CREATE OR ALTER PROCEDURE sp_Categories_Create
    @ServiceTypeName NVARCHAR(50),
    @Description NVARCHAR(500),
    @NewId INT OUTPUT,
    @Result INT OUTPUT
AS
BEGIN
    IF EXISTS (SELECT 1 FROM ServiceCategories WHERE ServiceTypeName = @ServiceTypeName AND IsDeleted = 0)
    BEGIN
        SET @Result = -1;
        RETURN;
    END

    INSERT INTO ServiceCategories (ServiceTypeName, Description)
    VALUES (@ServiceTypeName, @Description);

    SET @NewId = SCOPE_IDENTITY();
    SET @Result = 1;
END;
GO

CREATE OR ALTER PROCEDURE sp_Categories_Update
    @CategoryId INT,
    @ServiceTypeName NVARCHAR(50) = NULL,
    @Description NVARCHAR(500) = NULL,
    @Result INT OUTPUT 
AS
BEGIN
    IF NOT EXISTS (SELECT 1 FROM ServiceCategories WHERE CategoryID = @CategoryId AND IsDeleted = 0)
    BEGIN
        SET @Result = 0;
        RETURN;
    END

    IF @ServiceTypeName IS NOT NULL AND EXISTS (SELECT 1 FROM ServiceCategories WHERE ServiceTypeName = @ServiceTypeName AND CategoryID != @CategoryId AND IsDeleted = 0)
    BEGIN
        SET @Result = -1; 
        RETURN;
    END

    UPDATE ServiceCategories
    SET ServiceTypeName = ISNULL(@ServiceTypeName, ServiceTypeName),
        Description = ISNULL(@Description, Description)
    WHERE CategoryID = @CategoryId;

    SET @Result = 1;
END;
GO

CREATE OR ALTER PROCEDURE sp_Categories_Delete
    @CategoryId INT,
    @Result INT OUTPUT
AS
BEGIN
    IF NOT EXISTS (SELECT 1 FROM ServiceCategories WHERE CategoryID = @CategoryId AND IsDeleted = 0)
    BEGIN
        SET @Result = 0;
        RETURN;
    END

    UPDATE ServiceCategories
    SET IsDeleted = 1
    WHERE CategoryID = @CategoryId;

    SET @Result = 1;
END;
GO
--========================================================
------------------------FEATURES-------------------------
--========================================================
CREATE OR ALTER PROCEDURE sp_Features_GetAll
AS
BEGIN
    SELECT FeatureId, Name, Description 
    FROM SpecialFeatures 
    WHERE IsDeleted = 0
    ORDER BY FeatureId ASC;
END;
GO

CREATE OR ALTER PROCEDURE sp_Features_GetById
    @FeatureId INT
AS
BEGIN
    SELECT FeatureId, Name, Description 
    FROM SpecialFeatures 
    WHERE FeatureId = @FeatureId AND IsDeleted = 0;
END;
GO

CREATE OR ALTER PROCEDURE sp_Features_Create
    @Name NVARCHAR(100),
    @Description NVARCHAR(500),
    @NewId INT OUTPUT,
    @Result INT OUTPUT
AS
BEGIN
    IF EXISTS (SELECT 1 FROM SpecialFeatures WHERE Name = @Name AND IsDeleted = 0)
    BEGIN
        SET @Result = -1; 
        RETURN;
    END

    INSERT INTO SpecialFeatures (Name, Description)
    VALUES (@Name, @Description);

    SET @NewId = SCOPE_IDENTITY();
    SET @Result = 1; 
END;
GO

CREATE OR ALTER PROCEDURE sp_Features_Update
    @FeatureId INT,
    @Name NVARCHAR(100) = NULL,
    @Description NVARCHAR(500) = NULL,
    @Result INT OUTPUT
AS
BEGIN
    IF NOT EXISTS (SELECT 1 FROM SpecialFeatures WHERE FeatureId = @FeatureId AND IsDeleted = 0)
    BEGIN
        SET @Result = 0;
        RETURN;
    END

    IF @Name IS NOT NULL AND EXISTS (SELECT 1 FROM SpecialFeatures WHERE Name = @Name AND FeatureId != @FeatureId AND IsDeleted = 0)
    BEGIN
        SET @Result = -1; 
        RETURN;
    END

    UPDATE SpecialFeatures
    SET Name = ISNULL(@Name, Name),
        Description = ISNULL(@Description, Description)
    WHERE FeatureId = @FeatureId;

    SET @Result = 1;
END;
GO

CREATE OR ALTER PROCEDURE sp_Features_Delete
    @FeatureId INT,
    @Result INT OUTPUT
AS
BEGIN
    IF NOT EXISTS (SELECT 1 FROM SpecialFeatures WHERE FeatureId = @FeatureId AND IsDeleted = 0)
    BEGIN
        SET @Result = 0;
        RETURN;
    END

    UPDATE SpecialFeatures
    SET IsDeleted = 1
    WHERE FeatureId = @FeatureId;

    SET @Result = 1;
END;
GO
--========================================================
------------------------PROVIDERS-------------------------
--========================================================
CREATE OR ALTER PROCEDURE sp_Providers_Register
    @OwnerUserId INT,
    @CompanyName NVARCHAR(200),
    @ContactEmail NVARCHAR(255),
    @PhoneNumber NVARCHAR(20),
    @Address NVARCHAR(500),
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ProviderRoleId INT = 3; 

    BEGIN TRANSACTION;

    BEGIN TRY
        IF EXISTS (SELECT 1 FROM ServiceProviders WHERE OwnerUserId = @OwnerUserId AND IsDeleted = 0)
        BEGIN
            SET @Result = -1;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF EXISTS (SELECT 1 FROM ServiceProviders WHERE CompanyName = @CompanyName OR ContactEmail = @ContactEmail)
        BEGIN
            SET @Result = -2;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        INSERT INTO ServiceProviders (OwnerUserId, CompanyName, ContactEmail, PhoneNumber, Address, IsVerified)
        VALUES (@OwnerUserId, @CompanyName, @ContactEmail, @PhoneNumber, @Address, 1);

        UPDATE Users
        SET RoleId = @ProviderRoleId,
            UpdatedAt = SYSUTCDATETIME()
        WHERE UserId = @OwnerUserId;

        COMMIT TRANSACTION;
        SET @Result = 1;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SET @Result = -99;
    END CATCH
END
GO
CREATE OR ALTER PROCEDURE sp_Providers_GetByOwnerId
    @OwnerUserId INT
AS
BEGIN
    SELECT 
        p.ProviderId, p.CompanyName, p.ContactEmail, p.PhoneNumber, p.Address, p.IsVerified, p.CreatedAt,
        u.FullName AS OwnerName, u.Email AS OwnerEmail
    FROM ServiceProviders p
    INNER JOIN Users u ON p.OwnerUserId = u.UserId
    WHERE p.OwnerUserId = @OwnerUserId AND p.IsDeleted = 0;
END;
GO

CREATE OR ALTER PROCEDURE sp_Providers_UpdateProfile
    @ProviderId INT,
    @CompanyName NVARCHAR(200) = NULL,
    @ContactEmail NVARCHAR(255) = NULL,
    @PhoneNumber NVARCHAR(20) = NULL,
    @Address NVARCHAR(500) = NULL,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF @ContactEmail IS NOT NULL AND EXISTS (
        SELECT 1 FROM ServiceProviders 
        WHERE ContactEmail = @ContactEmail AND ProviderId != @ProviderId AND IsDeleted = 0
    )
    BEGIN
        SET @Result = -1;
        RETURN;
    END

    UPDATE ServiceProviders
    SET 
        CompanyName = ISNULL(@CompanyName, CompanyName),
        ContactEmail = ISNULL(@ContactEmail, ContactEmail),
        PhoneNumber = ISNULL(@PhoneNumber, PhoneNumber),
        Address = ISNULL(@Address, Address)
    WHERE ProviderId = @ProviderId AND IsDeleted = 0;
    
    IF @@ROWCOUNT = 0
        SET @Result = 0;
    ELSE
        SET @Result = 1;
END;
GO

CREATE OR ALTER PROCEDURE sp_Providers_Delete
    @ProviderId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @UserRoleId INT = 2;
    
    BEGIN TRANSACTION;

    BEGIN TRY
        DECLARE @OwnerUserId INT;
        SELECT @OwnerUserId = OwnerUserId FROM ServiceProviders WHERE ProviderId = @ProviderId AND IsDeleted = 0;

        IF @OwnerUserId IS NULL
        BEGIN
            SET @Result = -1;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        UPDATE ServiceProviders 
        SET IsDeleted = 1 
        WHERE ProviderId = @ProviderId;

        UPDATE Users 
        SET RoleId = @UserRoleId 
        WHERE UserId = @OwnerUserId;

        COMMIT TRANSACTION;
        SET @Result = 1;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SET @Result = -99;
    END CATCH
END;
GO
--========================================================
------------------------SERVICES-------------------------
--========================================================
CREATE OR ALTER PROCEDURE sp_Services_GetList
    @PageNumber INT = 1,
    @PageSize INT = 10,
    @Keyword NVARCHAR(200) = NULL,
    @LocationId INT = NULL,
    @CategoryID INT = NULL,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    DECLARE @Filter NVARCHAR(MAX) = N'WHERE s.IsDeleted = 0 AND s.Status = ''active''';

    IF @Keyword IS NOT NULL 
        SET @Filter += N' AND (s.Name LIKE ''%'' + @Keyword + ''%'' OR s.Address LIKE ''%'' + @Keyword + ''%'')';
    IF @LocationId IS NOT NULL 
        SET @Filter += N' AND s.LocationId = @LocationId';
    IF @CategoryID IS NOT NULL 
        SET @Filter += N' AND s.CategoryID = @CategoryID';

    DECLARE @Query NVARCHAR(MAX) = N'
        SELECT 
            s.ServiceId, s.Name, s.Description, s.AverageRating, 
            s.Address, s.Latitude, s.Longitude,
            s.CategoryID, c.ServiceTypeName,
            s.LocationId, l.Name AS LocationName,
            s.ProviderId, p.CompanyName,
            si.ImageUrl AS PrimaryImageUrl,
            si.Caption AS PrimaryImageCaption,
            COUNT(*) OVER() AS TotalCount
        FROM Services s
        INNER JOIN ServiceCategories c ON s.CategoryID = c.CategoryID
        INNER JOIN Locations l ON s.LocationId = l.LocationId
        INNER JOIN ServiceProviders p ON s.ProviderId = p.ProviderId
        OUTER APPLY (
            SELECT TOP 1 ImageUrl, Caption
            FROM ServiceImages si
            WHERE si.ServiceId = s.ServiceId AND si.IsDeleted = 0
            ORDER BY si.DisplayOrder ASC, si.CreatedAt ASC, si.ImageId ASC
        ) si
        ' + @Filter + N'
        ORDER BY s.CreatedAt DESC
        OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY';

    EXEC sp_executesql @Query, 
        N'@Keyword NVARCHAR(200), @LocationId INT, @CategoryID INT, @Offset INT, @PageSize INT',
        @Keyword, @LocationId, @CategoryID, @Offset, @PageSize;

    SET @Result = 1;
END;
GO

CREATE OR ALTER PROCEDURE sp_Services_GetById
    @ServiceId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    IF NOT EXISTS (SELECT 1 FROM Services WHERE ServiceId = @ServiceId AND IsDeleted = 0)
    BEGIN
        SET @Result = -1;
        RETURN;
    END

    SELECT 
        s.*,
        c.ServiceTypeName, 
        l.Name AS LocationName, 
        p.CompanyName
    FROM Services s
    JOIN ServiceCategories c ON s.CategoryID = c.CategoryID
    JOIN Locations l ON s.LocationId = l.LocationId
    JOIN ServiceProviders p ON s.ProviderId = p.ProviderId
    WHERE s.ServiceId = @ServiceId;

    SELECT f.FeatureId, f.Name, f.Description
    FROM SpecialFeatures f
    JOIN ServiceFeatures sf ON f.FeatureId = sf.FeatureId
    WHERE sf.ServiceId = @ServiceId;

    SET @Result = 1;
END;
GO
CREATE OR ALTER PROCEDURE sp_Services_GetAllByOwnerUserId
    @OwnerUserId INT,
    @PageNumber INT = 1,
    @PageSize INT = 10,
    @Keyword NVARCHAR(200) = NULL,
    @CategoryID INT = NULL,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ActualProviderId INT;
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

    SELECT @ActualProviderId = ProviderId
    FROM ServiceProviders
    WHERE OwnerUserId = @OwnerUserId AND IsDeleted = 0;

    IF @ActualProviderId IS NULL
    BEGIN
        SELECT 0 AS TotalCount WHERE 1 = 0;
        SELECT 0 AS ServiceId WHERE 1 = 0; 
        SET @Result = -1;
        RETURN;
    END

    DECLARE @Filter NVARCHAR(MAX) = 
        N'WHERE s.IsDeleted = 0 AND s.ProviderId = @ActualProviderId';

    IF @Keyword IS NOT NULL 
        SET @Filter += N' AND (s.Name LIKE ''%'' + @Keyword + ''%'' OR s.Address LIKE ''%'' + @Keyword + ''%'')';
    IF @CategoryID IS NOT NULL 
        SET @Filter += N' AND s.CategoryID = @CategoryID';

    DECLARE @Query NVARCHAR(MAX) = N'
        SELECT 
            s.ServiceId, 
            s.Name, 
            s.Description,      
            s.Status,
            s.AverageRating,
            s.Address,
            s.Latitude,         
            s.Longitude,
            s.CategoryID,
            c.ServiceTypeName,
            s.LocationId,
            COUNT(*) OVER() AS TotalCount
        FROM Services s
        INNER JOIN ServiceCategories c ON s.CategoryID = c.CategoryID
        ' + @Filter + N'
        ORDER BY s.CreatedAt DESC
        OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY';

    EXEC sp_executesql @Query, 
        N'@ActualProviderId INT, @Offset INT, @PageSize INT, @Keyword NVARCHAR(200), @CategoryID INT',
        @ActualProviderId, @Offset, @PageSize, @Keyword, @CategoryID;

    SET @Result = 1;
END;
GO


CREATE OR ALTER PROCEDURE sp_Services_Create
    @OwnerUserId INT, 
    @LocationId INT,
    @CategoryID INT,
    @Name NVARCHAR(200),
    @Description NVARCHAR(MAX),
    @Address NVARCHAR(500),    
    @Latitude DECIMAL(9, 6) = NULL,
    @Longitude DECIMAL(9, 6) = NULL,
    @Status NVARCHAR(20) = 'draft',
    
    @FeatureIds NVARCHAR(MAX) = NULL, 

    @NewServiceId INT OUTPUT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @ActualProviderId INT;
        
        SELECT @ActualProviderId = ProviderId
        FROM ServiceProviders
        WHERE OwnerUserId = @OwnerUserId 
          AND IsVerified = 1
          AND IsDeleted = 0;

        IF @ActualProviderId IS NULL
        BEGIN
            SET @Result = -1;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        INSERT INTO Services (ProviderId, LocationId, Name, Description, CategoryID, Status, Address, Latitude, Longitude, IsDeleted)
        VALUES (@ActualProviderId, @LocationId, @Name, @Description, @CategoryID, @Status, @Address, @Latitude, @Longitude, 0);
        
        SET @NewServiceId = SCOPE_IDENTITY();

        IF @FeatureIds IS NOT NULL
        BEGIN
            INSERT INTO ServiceFeatures (ServiceId, FeatureId)
            SELECT @NewServiceId, value
            FROM OPENJSON(@FeatureIds)
            WHERE TRY_CAST(value AS INT) IS NOT NULL;
        END

        COMMIT TRANSACTION;
        SET @Result = 1;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW; 
    END CATCH
END;
GO
USE Wanderly;
GO


CREATE OR ALTER PROCEDURE sp_Services_Update
    @ServiceId INT,
    @OwnerUserId INT,
    
    @Name NVARCHAR(200) = NULL,
    @Description NVARCHAR(MAX) = NULL,
    @Address NVARCHAR(500) = NULL,
    @Latitude DECIMAL(9, 6) = NULL,
    @Longitude DECIMAL(9, 6) = NULL,
    @Status NVARCHAR(20) = NULL,
    
    @FeatureIds NVARCHAR(MAX) = NULL,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @ActualProviderId INT;

        SELECT @ActualProviderId = ProviderId
        FROM ServiceProviders
        WHERE OwnerUserId = @OwnerUserId
          AND IsDeleted = 0;

        IF NOT EXISTS (SELECT 1 FROM Services WHERE ServiceId = @ServiceId AND ProviderId = @ActualProviderId AND IsDeleted = 0)
        BEGIN
            SET @Result = -1;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        UPDATE Services
        SET Name = ISNULL(@Name, Name),
            Description = ISNULL(@Description, Description),
            Address = ISNULL(@Address, Address),
            Latitude = ISNULL(@Latitude, Latitude),
            Longitude = ISNULL(@Longitude, Longitude),
            Status = ISNULL(@Status, Status)
        WHERE ServiceId = @ServiceId;

        IF @FeatureIds IS NOT NULL
        BEGIN
            DELETE FROM ServiceFeatures WHERE ServiceId = @ServiceId;
            INSERT INTO ServiceFeatures (ServiceId, FeatureId)
            SELECT @ServiceId, value FROM OPENJSON(@FeatureIds) WHERE TRY_CAST(value AS INT) IS NOT NULL;
        END

        COMMIT TRANSACTION;
        SET @Result = 1;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_Services_Delete
    @ServiceId INT,
    @OwnerUserId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ActualProviderId INT;
    
    SELECT @ActualProviderId = ProviderId
    FROM ServiceProviders
    WHERE OwnerUserId = @OwnerUserId AND IsVerified = 1 AND IsDeleted = 0;

    IF NOT EXISTS (
        SELECT 1 
        FROM Services 
        WHERE ServiceId = @ServiceId 
          AND ProviderId = @ActualProviderId
          AND IsDeleted = 0
    )
    BEGIN
        SET @Result = -1;
        RETURN;
    END

    UPDATE Services SET IsDeleted = 1 WHERE ServiceId = @ServiceId;
    SET @Result = 1;
END;
GO
--========================================================
------------------------SERVICEFEATURES-------------------------
--========================================================
CREATE OR ALTER PROCEDURE sp_ServiceFeatures_GetByServiceId
    @ServiceId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT 
            f.FeatureId,
            f.Name,
            f.Description
        FROM ServiceFeatures sf
        INNER JOIN SpecialFeatures f ON sf.FeatureId = f.FeatureId
        WHERE sf.ServiceId = @ServiceId AND f.IsDeleted = 0;

        IF @@ROWCOUNT = 0
            SET @Result = -1;
        ELSE
            SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END
GO
--========================================================
------------------------SERVICEIMAGES-------------------
--========================================================
CREATE OR ALTER PROCEDURE sp_ServiceImages_GetByServiceId
    @ServiceId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        ImageId,
        ServiceId,
        ImageUrl,
        Caption,
        DisplayOrder,
        CreatedAt
    FROM ServiceImages
    WHERE ServiceId = @ServiceId AND IsDeleted = 0
    ORDER BY DisplayOrder ASC, CreatedAt ASC;
END
GO

CREATE OR ALTER PROCEDURE sp_ServiceImages_GetById
    @ImageId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        si.ImageId,
        si.ServiceId,
        si.ImageUrl,
        si.Caption,
        si.DisplayOrder,
        si.CreatedAt,
        s.Name AS ServiceName
    FROM ServiceImages si
    INNER JOIN Services s ON si.ServiceId = s.ServiceId
    WHERE si.ImageId = @ImageId AND si.IsDeleted = 0;
END
GO

CREATE OR ALTER PROCEDURE sp_ServiceImages_Create
    @ServiceId INT,
    @ImageUrl NVARCHAR(500),
    @Caption NVARCHAR(255) = NULL,
    @DisplayOrder INT = NULL,
    @NewImageId INT OUTPUT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    SET @NewImageId = 0;
    
    IF NOT EXISTS (SELECT 1 FROM Services WHERE ServiceId = @ServiceId AND IsDeleted = 0)
    BEGIN
        SET @Result = -1;
        RETURN;
    END
    
    IF @DisplayOrder IS NULL
    BEGIN
        SELECT @DisplayOrder = ISNULL(MAX(DisplayOrder), 0) + 1
        FROM ServiceImages
        WHERE ServiceId = @ServiceId AND IsDeleted = 0;
    END
    
    INSERT INTO ServiceImages (ServiceId, ImageUrl, Caption, DisplayOrder)
    VALUES (@ServiceId, @ImageUrl, @Caption, @DisplayOrder);
    
    SET @NewImageId = SCOPE_IDENTITY();
    SET @Result = 1;
    
    SELECT * FROM ServiceImages WHERE ImageId = @NewImageId;
END
GO

CREATE OR ALTER PROCEDURE sp_ServiceImages_BulkCreate
    @ServiceId INT,
    @Images NVARCHAR(MAX),
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    
    IF NOT EXISTS (SELECT 1 FROM Services WHERE ServiceId = @ServiceId AND IsDeleted = 0)
    BEGIN
        SET @Result = -1;
        RETURN;
    END
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @CurrentMaxOrder INT;
        SELECT @CurrentMaxOrder = ISNULL(MAX(DisplayOrder), 0)
        FROM ServiceImages
        WHERE ServiceId = @ServiceId AND IsDeleted = 0;
        
        INSERT INTO ServiceImages (ServiceId, ImageUrl, Caption, DisplayOrder)
        SELECT 
            @ServiceId,
            JSON_VALUE(value, '$.url'),
            JSON_VALUE(value, '$.caption'),
            @CurrentMaxOrder + ROW_NUMBER() OVER (ORDER BY (SELECT NULL))
        FROM OPENJSON(@Images);
        
        COMMIT TRANSACTION;
        SET @Result = @@ROWCOUNT;
        
        SELECT * FROM ServiceImages 
        WHERE ServiceId = @ServiceId AND IsDeleted = 0
        ORDER BY DisplayOrder ASC;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @Result = -99;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE sp_ServiceImages_Update
    @ImageId INT,
    @Caption NVARCHAR(255) = NULL,
    @DisplayOrder INT = NULL,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    
    IF NOT EXISTS (SELECT 1 FROM ServiceImages WHERE ImageId = @ImageId AND IsDeleted = 0)
    BEGIN
        SET @Result = -1;
        RETURN;
    END
    
    UPDATE ServiceImages
    SET 
        Caption = ISNULL(@Caption, Caption),
        DisplayOrder = ISNULL(@DisplayOrder, DisplayOrder)
    WHERE ImageId = @ImageId AND IsDeleted = 0;
    
    SET @Result = 1;
    
    SELECT * FROM ServiceImages WHERE ImageId = @ImageId;
END
GO

CREATE OR ALTER PROCEDURE sp_ServiceImages_Delete
    @ImageId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    
    IF NOT EXISTS (SELECT 1 FROM ServiceImages WHERE ImageId = @ImageId AND IsDeleted = 0)
    BEGIN
        SET @Result = -1;
        RETURN;
    END
    
    UPDATE ServiceImages SET IsDeleted = 1 WHERE ImageId = @ImageId;
    SET @Result = 1;
END
GO

CREATE OR ALTER PROCEDURE sp_ServiceImages_DeleteByServiceId
    @ServiceId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    
    UPDATE ServiceImages 
    SET IsDeleted = 1 
    WHERE ServiceId = @ServiceId AND IsDeleted = 0;
    
    SET @Result = @@ROWCOUNT;
END
GO

CREATE OR ALTER PROCEDURE sp_ServiceImages_Reorder
    @ServiceId INT,
    @ImageOrders NVARCHAR(MAX),
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        UPDATE si
        SET si.DisplayOrder = CAST(JSON_VALUE(o.value, '$.order') AS INT)
        FROM ServiceImages si
        INNER JOIN OPENJSON(@ImageOrders) o 
            ON si.ImageId = CAST(JSON_VALUE(o.value, '$.imageId') AS INT)
        WHERE si.ServiceId = @ServiceId AND si.IsDeleted = 0;
        
        COMMIT TRANSACTION;
        SET @Result = @@ROWCOUNT;
        
        SELECT * FROM ServiceImages 
        WHERE ServiceId = @ServiceId AND IsDeleted = 0
        ORDER BY DisplayOrder ASC;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @Result = -99;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE sp_ServiceImages_SetPrimary
    @ImageId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    
    DECLARE @ServiceId INT;
    
    SELECT @ServiceId = ServiceId 
    FROM ServiceImages 
    WHERE ImageId = @ImageId AND IsDeleted = 0;
    
    IF @ServiceId IS NULL
    BEGIN
        SET @Result = -1;
        RETURN;
    END
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        UPDATE ServiceImages
        SET DisplayOrder = DisplayOrder + 1
        WHERE ServiceId = @ServiceId AND IsDeleted = 0;
        
        UPDATE ServiceImages
        SET DisplayOrder = 0
        WHERE ImageId = @ImageId;
        
        COMMIT TRANSACTION;
        SET @Result = 1;
        
        SELECT * FROM ServiceImages 
        WHERE ServiceId = @ServiceId AND IsDeleted = 0
        ORDER BY DisplayOrder ASC;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @Result = -99;
        THROW;
    END CATCH
END
GO
--========================================================
------------------------ITINERARYS-------------------
--========================================================
CREATE OR ALTER PROCEDURE sp_Itineraries_GetAllByUser
    @UserId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        ItineraryId, Name, Description, StartDate, EndDate,
        CoverImageUrl, IsPublic, Status, CreatedAt, UpdatedAt
    FROM Itineraries
    WHERE UserId = @UserId AND IsDeleted = 0
    ORDER BY CreatedAt DESC;

    SET @Result = 1;
END;
GO

CREATE OR ALTER PROCEDURE sp_Itineraries_GetById
    @ItineraryId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 
        FROM Itineraries
        WHERE ItineraryId = @ItineraryId AND IsDeleted = 0
    )
    BEGIN
        SET @Result = -1;
        RETURN;
    END

    SELECT *
    FROM Itineraries
    WHERE ItineraryId = @ItineraryId;

    SELECT 
        ItineraryItemId, ItineraryId, LocationId, ServiceId,
        ItemDate, StartTime, EndTime,
        ActivityDescription, ItemOrder,
        IsDeleted, UpdatedAt
    FROM ItineraryItems
    WHERE ItineraryId = @ItineraryId AND IsDeleted = 0
    ORDER BY ItemDate, ItemOrder;

    SET @Result = 1;
END;
GO


CREATE OR ALTER PROCEDURE sp_Itineraries_Create
    @UserId INT,
    @Name NVARCHAR(200),
    @Description NVARCHAR(2000) = NULL,
    @StartDate DATETIME = NULL,
    @EndDate DATETIME = NULL,
    @CoverImageUrl NVARCHAR(500) = NULL,
    @IsPublic BIT = 0,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Itineraries (
        UserId, Name, Description,
        StartDate, EndDate, CoverImageUrl,
        IsPublic, Status, CreatedAt
    )
    VALUES (
        @UserId, @Name, @Description,
        @StartDate, @EndDate, @CoverImageUrl,
        @IsPublic, 'draft', SYSUTCDATETIME()
    );

    SELECT SCOPE_IDENTITY() AS ItineraryId;

    SET @Result = 1;
END;
GO

CREATE OR ALTER PROCEDURE sp_Itineraries_Update
    @ItineraryId INT,
    @Name NVARCHAR(200),
    @Description NVARCHAR(2000),
    @StartDate DATETIME,
    @EndDate DATETIME,
    @CoverImageUrl NVARCHAR(500),
    @IsPublic BIT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 FROM Itineraries 
        WHERE ItineraryId = @ItineraryId AND IsDeleted = 0
    )
    BEGIN
        SET @Result = -1;
        RETURN;
    END

    UPDATE Itineraries
    SET 
        Name = @Name,
        Description = @Description,
        StartDate = @StartDate,
        EndDate = @EndDate,
        CoverImageUrl = @CoverImageUrl,
        IsPublic = @IsPublic,
        UpdatedAt = SYSUTCDATETIME()
    WHERE ItineraryId = @ItineraryId;

    SELECT * FROM Itineraries WHERE ItineraryId = @ItineraryId;

    SET @Result = 1;
END;
GO

CREATE OR ALTER PROCEDURE sp_Itineraries_UpdateStatus
    @ItineraryId INT,
    @Status NVARCHAR(20),
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 FROM Itineraries 
        WHERE ItineraryId = @ItineraryId AND IsDeleted = 0
    )
    BEGIN
        SET @Result = -1;
        RETURN;
    END

    UPDATE Itineraries
    SET 
        Status = @Status,
        UpdatedAt = SYSUTCDATETIME()
    WHERE ItineraryId = @ItineraryId;

    SELECT Status FROM Itineraries WHERE ItineraryId = @ItineraryId;

    SET @Result = 1;
END;
GO

CREATE OR ALTER PROCEDURE sp_Itineraries_Delete
    @ItineraryId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 
        FROM Itineraries 
        WHERE ItineraryId = @ItineraryId AND IsDeleted = 0
    )
    BEGIN
        SET @Result = -1; 
        RETURN;
    END

    UPDATE Itineraries
    SET 
        IsDeleted = 1,
        UpdatedAt = SYSUTCDATETIME()
    WHERE ItineraryId = @ItineraryId;

    UPDATE ItineraryItems
    SET 
        IsDeleted = 1,
        UpdatedAt = SYSUTCDATETIME()
    WHERE ItineraryId = @ItineraryId;

    SET @Result = 1;
END;
GO
--========================================================
------------------------ITINERARYITEMS-------------------
--========================================================
CREATE OR ALTER PROCEDURE sp_ItineraryItems_Create
    @ItineraryId INT,
    @LocationId INT = NULL,
    @ServiceId INT = NULL,
    @ItemDate DATE,
    @StartTime TIME = NULL,
    @EndTime TIME = NULL,
    @ActivityDescription NVARCHAR(1000),
    @ItemOrder INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 
        FROM Itineraries
        WHERE ItineraryId = @ItineraryId AND IsDeleted = 0
    )
    BEGIN
        SET @Result = -1;
        RETURN;
    END

    INSERT INTO ItineraryItems (
        ItineraryId, LocationId, ServiceId,
        ItemDate, StartTime, EndTime,
        ActivityDescription, ItemOrder
    )
    VALUES (
        @ItineraryId, @LocationId, @ServiceId,
        @ItemDate, @StartTime, @EndTime,
        @ActivityDescription, @ItemOrder
    );

    SELECT SCOPE_IDENTITY() AS ItineraryItemId;

    UPDATE Itineraries
    SET Status = 'active'
    WHERE ItineraryId = @ItineraryId AND Status = 'draft';

    SET @Result = 1;
END;
GO

CREATE OR ALTER PROCEDURE sp_ItineraryItems_Update
    @ItemId INT,
    @LocationId INT = NULL,
    @ServiceId INT = NULL,
    @ItemDate DATE,
    @StartTime TIME = NULL,
    @EndTime TIME = NULL,
    @ActivityDescription NVARCHAR(1000),
    @ItemOrder INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 
        FROM ItineraryItems
        WHERE ItineraryItemId = @ItemId AND IsDeleted = 0
    )
    BEGIN
        SET @Result = -1;
        RETURN;
    END

    UPDATE ItineraryItems
    SET
        LocationId = @LocationId,
        ServiceId = @ServiceId,
        ItemDate = @ItemDate,
        StartTime = @StartTime,
        EndTime = @EndTime,
        ActivityDescription = @ActivityDescription,
        ItemOrder = @ItemOrder,
        UpdatedAt = SYSUTCDATETIME()
    WHERE ItineraryItemId = @ItemId;

    SELECT *
    FROM ItineraryItems
    WHERE ItineraryItemId = @ItemId;

    SET @Result = 1;
END;
GO

CREATE OR ALTER PROCEDURE sp_ItineraryItems_Delete
    @ItemId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 
        FROM ItineraryItems
        WHERE ItineraryItemId = @ItemId AND IsDeleted = 0
    )
    BEGIN
        SET @Result = -1;
        RETURN;
    END

    UPDATE ItineraryItems
    SET 
        IsDeleted = 1,
        UpdatedAt = SYSUTCDATETIME()
    WHERE ItineraryItemId = @ItemId;

    SELECT @ItemId AS DeletedItemId;

    SET @Result = 1;
END;
GO
--========================================================
------------------------SERVICEAVAILABILITIES-------------------------
--========================================================
CREATE OR ALTER PROCEDURE sp_ServiceAvailabilities_GetByServiceId
    @ServiceId INT,
    @FromDate DATE = NULL,
    @ToDate DATE = NULL,
    @Status NVARCHAR(20) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 50,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

        IF @FromDate IS NULL SET @FromDate = CAST(GETDATE() AS DATE);

        SELECT COUNT(*) AS TotalCount
        FROM ServiceAvailabilities sa
        WHERE sa.ServiceId = @ServiceId 
          AND sa.IsDeleted = 0
          AND sa.AvailabilityDate >= @FromDate
          AND (@ToDate IS NULL OR sa.AvailabilityDate <= @ToDate)
          AND (@Status IS NULL OR sa.Status = @Status);

        SELECT 
            sa.AvailabilityId,
            sa.ServiceId,
            sa.AvailabilityDate,
            sa.StartTime,
            sa.EndTime,
            sa.Price,
            sa.TotalUnits,
            sa.BookedUnits,
            (sa.TotalUnits - sa.BookedUnits) AS AvailableUnits,
            sa.Status,
            s.Name AS ServiceName,
            s.Description AS ServiceDescription
        FROM ServiceAvailabilities sa
        INNER JOIN Services s ON sa.ServiceId = s.ServiceId
        WHERE sa.ServiceId = @ServiceId 
          AND sa.IsDeleted = 0
          AND sa.AvailabilityDate >= @FromDate
          AND (@ToDate IS NULL OR sa.AvailabilityDate <= @ToDate)
          AND (@Status IS NULL OR sa.Status = @Status)
        ORDER BY sa.AvailabilityDate ASC, sa.StartTime ASC
        OFFSET @Offset ROWS
        FETCH NEXT @PageSize ROWS ONLY;

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_ServiceAvailabilities_GetById
    @AvailabilityId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM ServiceAvailabilities WHERE AvailabilityId = @AvailabilityId AND IsDeleted = 0)
        BEGIN
            SET @Result = -1;
            RETURN;
        END

        SELECT 
            sa.AvailabilityId,
            sa.ServiceId,
            sa.AvailabilityDate,
            sa.StartTime,
            sa.EndTime,
            sa.Price,
            sa.TotalUnits,
            sa.BookedUnits,
            (sa.TotalUnits - sa.BookedUnits) AS AvailableUnits,
            sa.Status,
            s.Name AS ServiceName,
            s.Description AS ServiceDescription,
            s.ProviderId,
            sp.CompanyName AS ProviderName
        FROM ServiceAvailabilities sa
        INNER JOIN Services s ON sa.ServiceId = s.ServiceId
        INNER JOIN ServiceProviders sp ON s.ProviderId = sp.ProviderId
        WHERE sa.AvailabilityId = @AvailabilityId AND sa.IsDeleted = 0;

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_ServiceAvailabilities_Create
    @ServiceId INT,
    @AvailabilityDate DATE,
    @StartTime TIME,
    @EndTime TIME = NULL,
    @Price DECIMAL(18, 2),
    @TotalUnits INT,
    @Status NVARCHAR(20) = 'open',
    @NewAvailabilityId INT OUTPUT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Services WHERE ServiceId = @ServiceId AND IsDeleted = 0)
        BEGIN
            SET @Result = -1;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF EXISTS (
            SELECT 1 FROM ServiceAvailabilities 
            WHERE ServiceId = @ServiceId 
              AND AvailabilityDate = @AvailabilityDate 
              AND StartTime = @StartTime
              AND IsDeleted = 0
        )
        BEGIN
            SET @Result = -2;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        INSERT INTO ServiceAvailabilities (ServiceId, AvailabilityDate, StartTime, EndTime, Price, TotalUnits, Status)
        VALUES (@ServiceId, @AvailabilityDate, @StartTime, @EndTime, @Price, @TotalUnits, @Status);

        SET @NewAvailabilityId = SCOPE_IDENTITY();

        SELECT 
            sa.AvailabilityId,
            sa.ServiceId,
            sa.AvailabilityDate,
            sa.StartTime,
            sa.EndTime,
            sa.Price,
            sa.TotalUnits,
            sa.BookedUnits,
            (sa.TotalUnits - sa.BookedUnits) AS AvailableUnits,
            sa.Status
        FROM ServiceAvailabilities sa
        WHERE sa.AvailabilityId = @NewAvailabilityId;

        COMMIT TRANSACTION;
        SET @Result = 1;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_ServiceAvailabilities_Update
    @AvailabilityId INT,
    @AvailabilityDate DATE = NULL,
    @StartTime TIME = NULL,
    @EndTime TIME = NULL,
    @Price DECIMAL(18, 2) = NULL,
    @TotalUnits INT = NULL,
    @Status NVARCHAR(20) = NULL,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM ServiceAvailabilities WHERE AvailabilityId = @AvailabilityId AND IsDeleted = 0)
        BEGIN
            SET @Result = -1;
            RETURN;
        END

        IF @TotalUnits IS NOT NULL
        BEGIN
            DECLARE @CurrentBooked INT;
            SELECT @CurrentBooked = BookedUnits FROM ServiceAvailabilities WHERE AvailabilityId = @AvailabilityId;
            
            IF @TotalUnits < @CurrentBooked
            BEGIN
                SET @Result = -2;
                RETURN;
            END
        END

        UPDATE ServiceAvailabilities
        SET 
            AvailabilityDate = ISNULL(@AvailabilityDate, AvailabilityDate),
            StartTime = ISNULL(@StartTime, StartTime),
            EndTime = ISNULL(@EndTime, EndTime),
            Price = ISNULL(@Price, Price),
            TotalUnits = ISNULL(@TotalUnits, TotalUnits),
            Status = ISNULL(@Status, Status)
        WHERE AvailabilityId = @AvailabilityId;

        UPDATE ServiceAvailabilities
        SET Status = 'sold_out'
        WHERE AvailabilityId = @AvailabilityId 
          AND TotalUnits = BookedUnits 
          AND Status = 'open';

        SELECT 
            sa.AvailabilityId,
            sa.ServiceId,
            sa.AvailabilityDate,
            sa.StartTime,
            sa.EndTime,
            sa.Price,
            sa.TotalUnits,
            sa.BookedUnits,
            (sa.TotalUnits - sa.BookedUnits) AS AvailableUnits,
            sa.Status
        FROM ServiceAvailabilities sa
        WHERE sa.AvailabilityId = @AvailabilityId;

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_ServiceAvailabilities_Delete
    @AvailabilityId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM ServiceAvailabilities WHERE AvailabilityId = @AvailabilityId AND IsDeleted = 0)
        BEGIN
            SET @Result = -1;
            RETURN;
        END

        DECLARE @BookedUnits INT;
        SELECT @BookedUnits = BookedUnits FROM ServiceAvailabilities WHERE AvailabilityId = @AvailabilityId;
        
        IF @BookedUnits > 0
        BEGIN
            SET @Result = -2;
            RETURN;
        END

        UPDATE ServiceAvailabilities
        SET IsDeleted = 1
        WHERE AvailabilityId = @AvailabilityId;

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_ServiceAvailabilities_Book
    @AvailabilityId INT,
    @UnitsToBook INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @AvailableUnits INT;
        DECLARE @CurrentStatus NVARCHAR(20);

        SELECT 
            @AvailableUnits = (TotalUnits - BookedUnits),
            @CurrentStatus = Status
        FROM ServiceAvailabilities WITH (UPDLOCK)
        WHERE AvailabilityId = @AvailabilityId AND IsDeleted = 0;

        IF @AvailableUnits IS NULL
        BEGIN
            SET @Result = -1;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF @CurrentStatus != 'open'
        BEGIN
            SET @Result = -2;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF @UnitsToBook > @AvailableUnits
        BEGIN
            SET @Result = -3;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        UPDATE ServiceAvailabilities
        SET BookedUnits = BookedUnits + @UnitsToBook
        WHERE AvailabilityId = @AvailabilityId;

        UPDATE ServiceAvailabilities
        SET Status = 'sold_out'
        WHERE AvailabilityId = @AvailabilityId AND TotalUnits = BookedUnits;

        SELECT 
            sa.AvailabilityId,
            sa.ServiceId,
            sa.AvailabilityDate,
            sa.StartTime,
            sa.EndTime,
            sa.Price,
            sa.TotalUnits,
            sa.BookedUnits,
            (sa.TotalUnits - sa.BookedUnits) AS AvailableUnits,
            sa.Status
        FROM ServiceAvailabilities sa
        WHERE sa.AvailabilityId = @AvailabilityId;

        COMMIT TRANSACTION;
        SET @Result = 1;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_ServiceAvailabilities_CancelBooking
    @AvailabilityId INT,
    @UnitsToCancel INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @CurrentBooked INT;

        SELECT @CurrentBooked = BookedUnits
        FROM ServiceAvailabilities WITH (UPDLOCK)
        WHERE AvailabilityId = @AvailabilityId AND IsDeleted = 0;

        IF @CurrentBooked IS NULL
        BEGIN
            SET @Result = -1;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF @UnitsToCancel > @CurrentBooked
        BEGIN
            SET @Result = -2;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        UPDATE ServiceAvailabilities
        SET BookedUnits = BookedUnits - @UnitsToCancel
        WHERE AvailabilityId = @AvailabilityId;

        UPDATE ServiceAvailabilities
        SET Status = 'open'
        WHERE AvailabilityId = @AvailabilityId 
          AND Status = 'sold_out' 
          AND TotalUnits > BookedUnits;

        SELECT 
            sa.AvailabilityId,
            sa.ServiceId,
            sa.AvailabilityDate,
            sa.StartTime,
            sa.EndTime,
            sa.Price,
            sa.TotalUnits,
            sa.BookedUnits,
            (sa.TotalUnits - sa.BookedUnits) AS AvailableUnits,
            sa.Status
        FROM ServiceAvailabilities sa
        WHERE sa.AvailabilityId = @AvailabilityId;

        COMMIT TRANSACTION;
        SET @Result = 1;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_ServiceAvailabilities_Check
    @ServiceId INT,
    @CheckDate DATE,
    @UnitsNeeded INT = 1,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT 
            sa.AvailabilityId,
            sa.ServiceId,
            sa.AvailabilityDate,
            sa.StartTime,
            sa.EndTime,
            sa.Price,
            sa.TotalUnits,
            sa.BookedUnits,
            (sa.TotalUnits - sa.BookedUnits) AS AvailableUnits,
            sa.Status,
            CASE 
                WHEN (sa.TotalUnits - sa.BookedUnits) >= @UnitsNeeded AND sa.Status = 'open' 
                THEN 1 
                ELSE 0 
            END AS CanBook
        FROM ServiceAvailabilities sa
        WHERE sa.ServiceId = @ServiceId 
          AND sa.AvailabilityDate = @CheckDate
          AND sa.IsDeleted = 0
        ORDER BY sa.StartTime ASC;

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_ServiceAvailabilities_BulkCreate
    @ServiceId INT,
    @StartDate DATE,
    @EndDate DATE,
    @StartTime TIME,
    @EndTime TIME = NULL,
    @Price DECIMAL(18, 2),
    @TotalUnits INT,
    @ExcludeWeekends BIT = 0,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Services WHERE ServiceId = @ServiceId AND IsDeleted = 0)
        BEGIN
            SET @Result = -1;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        DECLARE @CurrentDate DATE = @StartDate;
        DECLARE @InsertCount INT = 0;

        WHILE @CurrentDate <= @EndDate
        BEGIN
            IF @ExcludeWeekends = 1 AND DATEPART(WEEKDAY, @CurrentDate) IN (1, 7)
            BEGIN
                SET @CurrentDate = DATEADD(DAY, 1, @CurrentDate);
                CONTINUE;
            END

            IF NOT EXISTS (
                SELECT 1 FROM ServiceAvailabilities 
                WHERE ServiceId = @ServiceId 
                  AND AvailabilityDate = @CurrentDate 
                  AND StartTime = @StartTime
                  AND IsDeleted = 0
            )
            BEGIN
                INSERT INTO ServiceAvailabilities (ServiceId, AvailabilityDate, StartTime, EndTime, Price, TotalUnits, Status)
                VALUES (@ServiceId, @CurrentDate, @StartTime, @EndTime, @Price, @TotalUnits, 'open');
                
                SET @InsertCount = @InsertCount + 1;
            END

            SET @CurrentDate = DATEADD(DAY, 1, @CurrentDate);
        END

        SELECT @InsertCount AS CreatedCount;

        COMMIT TRANSACTION;
        SET @Result = 1;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @Result = -99;
    END CATCH
END;
GO
--========================================================
------------------------SERVICEACCOMMODATIONS-------------
--========================================================
CREATE OR ALTER PROCEDURE sp_ServiceAccommodations_GetByServiceId
    @ServiceId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM ServiceAccommodations WHERE ServiceId = @ServiceId)
        BEGIN
            SET @Result = -1;
            RETURN;
        END

        SELECT 
            sa.ServiceId,
            sa.AccommodationType,
            sa.StarRating,
            sa.Amenities,
            s.Name AS ServiceName,
            s.Description AS ServiceDescription,
            s.Address,
            s.AverageRating,
            s.Status,
            sp.CompanyName AS ProviderName,
            sp.ProviderId
        FROM ServiceAccommodations sa
        INNER JOIN Services s ON sa.ServiceId = s.ServiceId
        INNER JOIN ServiceProviders sp ON s.ProviderId = sp.ProviderId
        WHERE sa.ServiceId = @ServiceId AND s.IsDeleted = 0;

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_ServiceAccommodations_GetAll
    @AccommodationType NVARCHAR(50) = NULL,
    @MinStarRating INT = NULL,
    @MaxStarRating INT = NULL,
    @City NVARCHAR(100) = NULL,
    @SearchKeyword NVARCHAR(200) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

        SELECT COUNT(*) AS TotalCount
        FROM ServiceAccommodations sa
        INNER JOIN Services s ON sa.ServiceId = s.ServiceId
        LEFT JOIN Locations l ON s.LocationId = l.LocationId
        WHERE s.IsDeleted = 0
          AND s.Status = 'active'
          AND (@AccommodationType IS NULL OR sa.AccommodationType = @AccommodationType)
          AND (@MinStarRating IS NULL OR sa.StarRating >= @MinStarRating)
          AND (@MaxStarRating IS NULL OR sa.StarRating <= @MaxStarRating)
          AND (@City IS NULL OR l.City = @City OR s.Address LIKE '%' + @City + '%')
          AND (@SearchKeyword IS NULL OR s.Name LIKE '%' + @SearchKeyword + '%' OR s.Description LIKE '%' + @SearchKeyword + '%');

        SELECT 
            sa.ServiceId,
            sa.AccommodationType,
            sa.StarRating,
            sa.Amenities,
            s.Name AS ServiceName,
            s.Description AS ServiceDescription,
            s.Address,
            s.Latitude,
            s.Longitude,
            s.AverageRating,
            s.Status,
            sp.CompanyName AS ProviderName,
            sp.ProviderId,
            l.City,
            l.Country
        FROM ServiceAccommodations sa
        INNER JOIN Services s ON sa.ServiceId = s.ServiceId
        INNER JOIN ServiceProviders sp ON s.ProviderId = sp.ProviderId
        LEFT JOIN Locations l ON s.LocationId = l.LocationId
        WHERE s.IsDeleted = 0
          AND s.Status = 'active'
          AND (@AccommodationType IS NULL OR sa.AccommodationType = @AccommodationType)
          AND (@MinStarRating IS NULL OR sa.StarRating >= @MinStarRating)
          AND (@MaxStarRating IS NULL OR sa.StarRating <= @MaxStarRating)
          AND (@City IS NULL OR l.City = @City OR s.Address LIKE '%' + @City + '%')
          AND (@SearchKeyword IS NULL OR s.Name LIKE '%' + @SearchKeyword + '%' OR s.Description LIKE '%' + @SearchKeyword + '%')
        ORDER BY sa.StarRating DESC, s.AverageRating DESC
        OFFSET @Offset ROWS
        FETCH NEXT @PageSize ROWS ONLY;

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_ServiceAccommodations_Create
    @ServiceId INT,
    @AccommodationType NVARCHAR(50),
    @StarRating INT = NULL,
    @Amenities NVARCHAR(MAX) = NULL,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Services WHERE ServiceId = @ServiceId AND IsDeleted = 0)
        BEGIN
            SET @Result = -1;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF EXISTS (SELECT 1 FROM ServiceAccommodations WHERE ServiceId = @ServiceId)
        BEGIN
            SET @Result = -2;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF @StarRating IS NOT NULL AND (@StarRating < 1 OR @StarRating > 5)
        BEGIN
            SET @Result = -3;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        INSERT INTO ServiceAccommodations (ServiceId, AccommodationType, StarRating, Amenities)
        VALUES (@ServiceId, @AccommodationType, @StarRating, @Amenities);

        SELECT 
            sa.ServiceId,
            sa.AccommodationType,
            sa.StarRating,
            sa.Amenities,
            s.Name AS ServiceName
        FROM ServiceAccommodations sa
        INNER JOIN Services s ON sa.ServiceId = s.ServiceId
        WHERE sa.ServiceId = @ServiceId;

        COMMIT TRANSACTION;
        SET @Result = 1;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_ServiceAccommodations_Update
    @ServiceId INT,
    @AccommodationType NVARCHAR(50) = NULL,
    @StarRating INT = NULL,
    @Amenities NVARCHAR(MAX) = NULL,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM ServiceAccommodations WHERE ServiceId = @ServiceId)
        BEGIN
            SET @Result = -1;
            RETURN;
        END

        IF @StarRating IS NOT NULL AND (@StarRating < 1 OR @StarRating > 5)
        BEGIN
            SET @Result = -2;
            RETURN;
        END

        UPDATE ServiceAccommodations
        SET 
            AccommodationType = ISNULL(@AccommodationType, AccommodationType),
            StarRating = ISNULL(@StarRating, StarRating),
            Amenities = ISNULL(@Amenities, Amenities)
        WHERE ServiceId = @ServiceId;

        SELECT 
            sa.ServiceId,
            sa.AccommodationType,
            sa.StarRating,
            sa.Amenities,
            s.Name AS ServiceName
        FROM ServiceAccommodations sa
        INNER JOIN Services s ON sa.ServiceId = s.ServiceId
        WHERE sa.ServiceId = @ServiceId;

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_ServiceAccommodations_Delete
    @ServiceId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM ServiceAccommodations WHERE ServiceId = @ServiceId)
        BEGIN
            SET @Result = -1;
            RETURN;
        END

        DELETE FROM ServiceAccommodations
        WHERE ServiceId = @ServiceId;

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_ServiceAccommodations_SearchByAmenities
    @AmenityKeywords NVARCHAR(500),
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

        SELECT COUNT(*) AS TotalCount
        FROM ServiceAccommodations sa
        INNER JOIN Services s ON sa.ServiceId = s.ServiceId
        WHERE s.IsDeleted = 0
          AND s.Status = 'active'
          AND sa.Amenities LIKE '%' + @AmenityKeywords + '%';

        SELECT 
            sa.ServiceId,
            sa.AccommodationType,
            sa.StarRating,
            sa.Amenities,
            s.Name AS ServiceName,
            s.Description AS ServiceDescription,
            s.Address,
            s.AverageRating,
            sp.CompanyName AS ProviderName
        FROM ServiceAccommodations sa
        INNER JOIN Services s ON sa.ServiceId = s.ServiceId
        INNER JOIN ServiceProviders sp ON s.ProviderId = sp.ProviderId
        WHERE s.IsDeleted = 0
          AND s.Status = 'active'
          AND sa.Amenities LIKE '%' + @AmenityKeywords + '%'
        ORDER BY sa.StarRating DESC, s.AverageRating DESC
        OFFSET @Offset ROWS
        FETCH NEXT @PageSize ROWS ONLY;

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_ServiceAccommodations_GetTypes
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT DISTINCT 
            sa.AccommodationType,
            COUNT(*) AS TotalCount
        FROM ServiceAccommodations sa
        INNER JOIN Services s ON sa.ServiceId = s.ServiceId
        WHERE s.IsDeleted = 0 AND s.Status = 'active'
        GROUP BY sa.AccommodationType
        ORDER BY TotalCount DESC;

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_ServiceAccommodations_GetByProvider
    @ProviderId INT,
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

        SELECT COUNT(*) AS TotalCount
        FROM ServiceAccommodations sa
        INNER JOIN Services s ON sa.ServiceId = s.ServiceId
        WHERE s.ProviderId = @ProviderId AND s.IsDeleted = 0;

        SELECT 
            sa.ServiceId,
            sa.AccommodationType,
            sa.StarRating,
            sa.Amenities,
            s.Name AS ServiceName,
            s.Description AS ServiceDescription,
            s.Address,
            s.AverageRating,
            s.Status
        FROM ServiceAccommodations sa
        INNER JOIN Services s ON sa.ServiceId = s.ServiceId
        WHERE s.ProviderId = @ProviderId AND s.IsDeleted = 0
        ORDER BY s.CreatedAt DESC
        OFFSET @Offset ROWS
        FETCH NEXT @PageSize ROWS ONLY;

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO
--========================================================
------------------------POSTS-------------------------
--========================================================
CREATE OR ALTER PROCEDURE sp_Posts_GetList
    @PageNumber INT = 1,
    @PageSize INT = 10,
    @Keyword NVARCHAR(300) = NULL,
    @TagId INT = NULL,
    @CurrentUserId INT = NULL,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
        
        DECLARE @FilterCondition NVARCHAR(MAX) = N'WHERE p.IsDeleted = 0 AND p.Status = ''published''';
        
        IF @Keyword IS NOT NULL
        BEGIN
            SET @FilterCondition = @FilterCondition + N' AND (p.Title LIKE ''%'' + @Keyword + ''%'' OR p.Content LIKE ''%'' + @Keyword + ''%'')';
        END

        IF @TagId IS NOT NULL
        BEGIN
            SET @FilterCondition = @FilterCondition + N' AND EXISTS (SELECT 1 FROM PostTags pt WHERE pt.PostId = p.PostId AND pt.TagId = @TagId)';
        END

        DECLARE @TotalCountQuery NVARCHAR(MAX) = N'SELECT COUNT(p.PostId) AS TotalCount FROM Posts p ' + @FilterCondition;
        EXEC sp_executesql @TotalCountQuery, N'@Keyword NVARCHAR(300), @TagId INT', @Keyword, @TagId;

        DECLARE @ListQuery NVARCHAR(MAX) = N'
            SELECT 
                p.PostId, 
                p.Title, 
                p.Content,
                p.ImageUrl, 
                p.PublishedAt, 
                p.UserId, 
                u.FullName AS AuthorName, 
                u.ProfilePictureUrl AS AuthorAvatar,
                (SELECT COUNT(*) FROM PostLikes pl WHERE pl.PostId = p.PostId) AS LikeCount,
                (SELECT COUNT(*) FROM Comments c WHERE c.PostId = p.PostId AND c.IsDeleted = 0) AS CommentCount,
                CASE 
                    WHEN @CurrentUserId IS NOT NULL AND EXISTS (
                        SELECT 1 FROM PostLikes 
                        WHERE PostId = p.PostId AND UserId = @CurrentUserId
                    ) THEN 1 
                    ELSE 0 
                END AS IsLiked
            FROM Posts p
            INNER JOIN Users u ON p.UserId = u.UserId
            ' + @FilterCondition + N'
            ORDER BY p.PublishedAt DESC 
            OFFSET @Offset ROWS 
            FETCH NEXT @PageSize ROWS ONLY;';

        EXEC sp_executesql @ListQuery, N'@Offset INT, @PageSize INT, @Keyword NVARCHAR(300), @TagId INT, @CurrentUserId INT', @Offset, @PageSize, @Keyword, @TagId, @CurrentUserId;

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_Posts_GetById
    @PostId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Posts WHERE PostId = @PostId AND IsDeleted = 0)
        BEGIN
            SET @Result = -1;
            RETURN;
        END

        SELECT 
            p.PostId, p.Title, p.Content, p.ImageUrl, p.Status, p.PublishedAt, p.UserId,
            u.FullName AS AuthorName, u.ProfilePictureUrl AS AuthorAvatar
        FROM Posts p
        INNER JOIN Users u ON p.UserId = u.UserId
        WHERE p.PostId = @PostId;

        SELECT t.TagId, t.TagName
        FROM Tags t
        INNER JOIN PostTags pt ON t.TagId = pt.TagId
        WHERE pt.PostId = @PostId;

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_Posts_GetByUserId
    @UserId INT,
    @CurrentUserId INT = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 10,
    @IncludeDrafts BIT = 0,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

        SELECT COUNT(*) AS TotalCount
        FROM Posts p
        WHERE p.UserId = @UserId 
          AND p.IsDeleted = 0
          AND (@IncludeDrafts = 1 OR p.Status = 'published');

        SELECT 
            p.PostId,
            p.Title,
            p.Content,
            p.ImageUrl,
            p.Status,
            p.PublishedAt,
            p.CreatedAt,
            p.UpdatedAt,
            p.IsEdited,
            u.FullName AS AuthorName,
            u.ProfilePictureUrl AS AuthorAvatar,
            (SELECT COUNT(*) FROM PostLikes pl WHERE pl.PostId = p.PostId) AS LikeCount,
            (SELECT COUNT(*) FROM Comments c WHERE c.PostId = p.PostId AND c.IsDeleted = 0) AS CommentCount,
            CASE 
                WHEN @CurrentUserId IS NOT NULL AND EXISTS (
                    SELECT 1 FROM PostLikes 
                    WHERE PostId = p.PostId AND UserId = @CurrentUserId
                ) THEN 1 
                ELSE 0 
            END AS IsLiked
        FROM Posts p
        INNER JOIN Users u ON p.UserId = u.UserId
        WHERE p.UserId = @UserId 
          AND p.IsDeleted = 0
          AND (@IncludeDrafts = 1 OR p.Status = 'published')
        ORDER BY 
            CASE WHEN p.Status = 'published' THEN 0 ELSE 1 END,
            p.PublishedAt DESC,
            p.CreatedAt DESC
        OFFSET @Offset ROWS
        FETCH NEXT @PageSize ROWS ONLY;

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_Posts_Create
    @UserId INT,
    @Title NVARCHAR(300),
    @Content NVARCHAR(MAX),
    @ImageUrl NVARCHAR(500) = NULL,
    @Status NVARCHAR(20) = 'draft',
    @TagIds NVARCHAR(MAX) = NULL,
    @NewPostId INT OUTPUT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        INSERT INTO Posts (UserId, Title, Content, ImageUrl, Status, PublishedAt)
        VALUES (@UserId, @Title, @Content, @ImageUrl, @Status, 
                CASE WHEN @Status = 'published' THEN SYSUTCDATETIME() ELSE NULL END);

        SET @NewPostId = SCOPE_IDENTITY();

        IF @TagIds IS NOT NULL
        BEGIN
            INSERT INTO PostTags (PostId, TagId)
            SELECT @NewPostId, value
            FROM OPENJSON(@TagIds)
            WHERE TRY_CAST(value AS INT) IS NOT NULL;
        END

        COMMIT TRANSACTION;
        SET @Result = 1;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_Posts_Update
    @PostId INT,
    @UserId INT,
    @Title NVARCHAR(300) = NULL,
    @Content NVARCHAR(MAX) = NULL,
    @ImageUrl NVARCHAR(500) = NULL,
    @Status NVARCHAR(20) = NULL,
    @TagIds NVARCHAR(MAX) = NULL,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Posts WHERE PostId = @PostId AND UserId = @UserId AND IsDeleted = 0)
        BEGIN
            SET @Result = -1;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        UPDATE Posts
        SET 
            Title = ISNULL(@Title, Title),
            Content = ISNULL(@Content, Content),
            ImageUrl = ISNULL(@ImageUrl, ImageUrl),
            Status = ISNULL(@Status, Status),
            PublishedAt = CASE 
                            WHEN @Status = 'published' AND Status != 'published' THEN SYSUTCDATETIME() 
                            ELSE PublishedAt 
                          END,
            IsEdited = 1,
            UpdatedAt = SYSUTCDATETIME()
        WHERE PostId = @PostId;

        IF @TagIds IS NOT NULL
        BEGIN
            DELETE FROM PostTags WHERE PostId = @PostId;
            
            INSERT INTO PostTags (PostId, TagId)
            SELECT @PostId, value
            FROM OPENJSON(@TagIds)
            WHERE TRY_CAST(value AS INT) IS NOT NULL;
        END

        COMMIT TRANSACTION;
        SET @Result = 1;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_Posts_Delete
    @PostId INT,
    @UserId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Posts WHERE PostId = @PostId AND (UserId = @UserId) AND IsDeleted = 0)
        BEGIN
            SET @Result = -1; 
            RETURN;
        END

        UPDATE Posts SET IsDeleted = 1 WHERE PostId = @PostId;
        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO
--========================================================
------------------------TAGS-------------------------
--========================================================
CREATE OR ALTER PROCEDURE sp_Tags_GetAll
AS
BEGIN
    SELECT TagId, TagName
    FROM Tags 
    WHERE IsDeleted = 0
    ORDER BY TagName ASC;
END;
GO

CREATE OR ALTER PROCEDURE sp_Tags_GetById
    @TagId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TagId, TagName
    FROM Tags 
    WHERE TagId = @TagId AND IsDeleted = 0;
END;
GO

CREATE OR ALTER PROCEDURE sp_Tags_Create
    @TagName NVARCHAR(100),
    @NewId INT OUTPUT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM Tags WHERE TagName = @TagName AND IsDeleted = 0)
    BEGIN
        SET @Result = -1; 
        RETURN;
    END

    INSERT INTO Tags (TagName)
    VALUES (@TagName);

    SET @NewId = SCOPE_IDENTITY();
    SET @Result = 1; 
END;
GO

CREATE OR ALTER PROCEDURE sp_Tags_Update
    @TagId INT,
    @TagName NVARCHAR(100),
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    IF NOT EXISTS (SELECT 1 FROM Tags WHERE TagId = @TagId AND IsDeleted = 0)
    BEGIN
        SET @Result = 0;
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM Tags WHERE TagName = @TagName AND TagId != @TagId AND IsDeleted = 0)
    BEGIN
        SET @Result = -1; 
        RETURN;
    END

    UPDATE Tags
    SET TagName = @TagName
    WHERE TagId = @TagId;

    SET @Result = 1;
END;
GO

CREATE OR ALTER PROCEDURE sp_Tags_Delete
    @TagId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    IF NOT EXISTS (SELECT 1 FROM Tags WHERE TagId = @TagId AND IsDeleted = 0)
    BEGIN
        SET @Result = 0;
        RETURN;
    END

    UPDATE Tags
    SET IsDeleted = 1
    WHERE TagId = @TagId;

    SET @Result = 1;
END;
GO

--========================================================
------------------------COMMENTS-------------------------
--========================================================
CREATE OR ALTER PROCEDURE sp_Comments_GetByPostId
    @PostId INT,
    @CurrentUserId INT = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 50,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

        SELECT COUNT(*) AS TotalCount
        FROM Comments c
        WHERE c.PostId = @PostId AND c.IsDeleted = 0;

        WITH CommentHierarchy AS (
            SELECT 
                c.CommentId,
                c.PostId,
                c.UserId,
                c.ParentCommentId,
                c.Content,
                c.ImageUrl,
                c.CreatedAt,
                c.IsDeleted,
                0 AS Level,
                CAST(c.CommentId AS NVARCHAR(MAX)) AS SortPath
            FROM Comments c
            WHERE c.PostId = @PostId 
              AND c.ParentCommentId IS NULL 
              AND c.IsDeleted = 0

            UNION ALL

            SELECT 
                c.CommentId,
                c.PostId,
                c.UserId,
                c.ParentCommentId,
                c.Content,
                c.ImageUrl,
                c.CreatedAt,
                c.IsDeleted,
                ch.Level + 1 AS Level,
                CAST(ch.SortPath + '.' + CAST(c.CommentId AS NVARCHAR(MAX)) AS NVARCHAR(MAX)) AS SortPath
            FROM Comments c
            INNER JOIN CommentHierarchy ch ON c.ParentCommentId = ch.CommentId
            WHERE c.IsDeleted = 0
        )
        SELECT 
            ch.CommentId,
            ch.PostId,
            ch.UserId,
            ch.ParentCommentId,
            ch.Content,
            ch.ImageUrl,
            ch.CreatedAt,
            ch.Level,
            u.FullName AS AuthorName,
            u.ProfilePictureUrl AS AuthorAvatar,
            (SELECT COUNT(*) FROM CommentLikes cl WHERE cl.CommentId = ch.CommentId) AS LikeCount,
            CASE 
                WHEN @CurrentUserId IS NOT NULL AND EXISTS (
                    SELECT 1 FROM CommentLikes 
                    WHERE CommentId = ch.CommentId AND UserId = @CurrentUserId
                ) THEN 1 
                ELSE 0 
            END AS IsLiked,
            (SELECT COUNT(*) FROM Comments c2 
             WHERE c2.ParentCommentId = ch.CommentId AND c2.IsDeleted = 0) AS ReplyCount
        FROM CommentHierarchy ch
        INNER JOIN Users u ON ch.UserId = u.UserId
        ORDER BY 
            CASE WHEN ch.ParentCommentId IS NULL THEN ch.CommentId ELSE ch.ParentCommentId END,
            ch.SortPath
        OFFSET @Offset ROWS
        FETCH NEXT @PageSize ROWS ONLY;

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_Comments_Create
    @PostId INT,
    @UserId INT,
    @ParentCommentId INT = NULL,
    @Content NVARCHAR(2000),
    @ImageUrl NVARCHAR(500) = NULL,
    @NewCommentId INT OUTPUT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Posts WHERE PostId = @PostId AND IsDeleted = 0)
        BEGIN
            SET @Result = -1;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF @ParentCommentId IS NOT NULL 
           AND NOT EXISTS (SELECT 1 FROM Comments WHERE CommentId = @ParentCommentId AND IsDeleted = 0)
        BEGIN
            SET @Result = -2;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        INSERT INTO Comments (PostId, UserId, ParentCommentId, Content, ImageUrl)
        VALUES (@PostId, @UserId, @ParentCommentId, @Content, @ImageUrl);

        SET @NewCommentId = SCOPE_IDENTITY();

        SELECT 
            c.CommentId,
            c.PostId,
            c.UserId,
            c.ParentCommentId,
            c.Content,
            c.ImageUrl,
            c.CreatedAt,
            u.FullName AS AuthorName,
            u.ProfilePictureUrl AS AuthorAvatar,
            0 AS LikeCount,
            0 AS IsLiked,
            0 AS ReplyCount
        FROM Comments c
        INNER JOIN Users u ON c.UserId = u.UserId
        WHERE c.CommentId = @NewCommentId;

        COMMIT TRANSACTION;
        SET @Result = 1;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_Comments_Update
    @CommentId INT,
    @UserId INT,
    @Content NVARCHAR(2000),
    @ImageUrl NVARCHAR(500) = NULL,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (
            SELECT 1 FROM Comments 
            WHERE CommentId = @CommentId 
              AND UserId = @UserId 
              AND IsDeleted = 0
        )
        BEGIN
            SET @Result = -1;
            RETURN;
        END

        UPDATE Comments
        SET Content = @Content,
            ImageUrl = ISNULL(@ImageUrl, ImageUrl)
        WHERE CommentId = @CommentId;

        SELECT 
            c.CommentId,
            c.PostId,
            c.UserId,
            c.ParentCommentId,
            c.Content,
            c.ImageUrl,
            c.CreatedAt,
            u.FullName AS AuthorName,
            u.ProfilePictureUrl AS AuthorAvatar,
            (SELECT COUNT(*) FROM CommentLikes cl WHERE cl.CommentId = c.CommentId) AS LikeCount,
            (SELECT COUNT(*) FROM Comments c2 WHERE c2.ParentCommentId = c.CommentId AND c2.IsDeleted = 0) AS ReplyCount
        FROM Comments c
        INNER JOIN Users u ON c.UserId = u.UserId
        WHERE c.CommentId = @CommentId;

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_Comments_Delete
    @CommentId INT,
    @UserId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (
            SELECT 1 FROM Comments 
            WHERE CommentId = @CommentId 
              AND UserId = @UserId 
              AND IsDeleted = 0
        )
        BEGIN
            SET @Result = -1;
            RETURN;
        END

        UPDATE Comments
        SET IsDeleted = 1
        WHERE CommentId = @CommentId;

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_Comments_GetReplies
    @CommentId INT,
    @CurrentUserId INT = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

        SELECT COUNT(*) AS TotalCount
        FROM Comments c
        WHERE c.ParentCommentId = @CommentId AND c.IsDeleted = 0;

        SELECT 
            c.CommentId,
            c.PostId,
            c.UserId,
            c.ParentCommentId,
            c.Content,
            c.ImageUrl,
            c.CreatedAt,
            u.FullName AS AuthorName,
            u.ProfilePictureUrl AS AuthorAvatar,
            (SELECT COUNT(*) FROM CommentLikes cl WHERE cl.CommentId = c.CommentId) AS LikeCount,
            CASE 
                WHEN @CurrentUserId IS NOT NULL AND EXISTS (
                    SELECT 1 FROM CommentLikes 
                    WHERE CommentId = c.CommentId AND UserId = @CurrentUserId
                ) THEN 1 
                ELSE 0 
            END AS IsLiked
        FROM Comments c
        INNER JOIN Users u ON c.UserId = u.UserId
        WHERE c.ParentCommentId = @CommentId AND c.IsDeleted = 0
        ORDER BY c.CreatedAt ASC
        OFFSET @Offset ROWS
        FETCH NEXT @PageSize ROWS ONLY;

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO
--========================================================
------------------------POSTLIKES-------------------------
--========================================================
CREATE OR ALTER PROCEDURE sp_PostLikes_Toggle
    @PostId INT,
    @UserId INT,
    @IsLiked BIT OUTPUT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Posts WHERE PostId = @PostId AND IsDeleted = 0)
        BEGIN
            SET @Result = -1;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF EXISTS (SELECT 1 FROM PostLikes WHERE PostId = @PostId AND UserId = @UserId)
        BEGIN
            DELETE FROM PostLikes WHERE PostId = @PostId AND UserId = @UserId;
            SET @IsLiked = 0;
        END
        ELSE
        BEGIN
            INSERT INTO PostLikes (PostId, UserId) VALUES (@PostId, @UserId);
            SET @IsLiked = 1;
        END

        SELECT COUNT(*) AS LikeCount
        FROM PostLikes
        WHERE PostId = @PostId;

        COMMIT TRANSACTION;
        SET @Result = 1;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_PostLikes_GetByPostId
    @PostId INT,
    @PageNumber INT = 1,
    @PageSize INT = 50,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

        SELECT COUNT(*) AS TotalCount
        FROM PostLikes pl
        INNER JOIN Users u ON pl.UserId = u.UserId
        WHERE pl.PostId = @PostId AND u.IsDeleted = 0;

        SELECT 
            u.UserId,
            u.FullName,
            u.ProfilePictureUrl,
            pl.CreatedAt AS LikedAt
        FROM PostLikes pl
        INNER JOIN Users u ON pl.UserId = u.UserId
        WHERE pl.PostId = @PostId AND u.IsDeleted = 0
        ORDER BY pl.CreatedAt DESC
        OFFSET @Offset ROWS
        FETCH NEXT @PageSize ROWS ONLY;

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_PostLikes_CheckUserLiked
    @PostId INT,
    @UserId INT,
    @IsLiked BIT OUTPUT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM PostLikes WHERE PostId = @PostId AND UserId = @UserId)
        BEGIN
            SET @IsLiked = 1;
        END
        ELSE
        BEGIN
            SET @IsLiked = 0;
        END

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_PostLikes_GetCount
    @PostId INT,
    @LikeCount INT OUTPUT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT @LikeCount = COUNT(*)
        FROM PostLikes
        WHERE PostId = @PostId;

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO
--========================================================
------------------------COMMENTLIKES-------------------------
--========================================================
CREATE OR ALTER PROCEDURE sp_CommentLikes_Toggle
    @CommentId INT,
    @UserId INT,
    @IsLiked BIT OUTPUT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Comments WHERE CommentId = @CommentId AND IsDeleted = 0)
        BEGIN
            SET @Result = -1;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF EXISTS (SELECT 1 FROM CommentLikes WHERE CommentId = @CommentId AND UserId = @UserId)
        BEGIN
            DELETE FROM CommentLikes WHERE CommentId = @CommentId AND UserId = @UserId;
            SET @IsLiked = 0;
        END
        ELSE
        BEGIN
            INSERT INTO CommentLikes (CommentId, UserId) VALUES (@CommentId, @UserId);
            SET @IsLiked = 1;
        END

        SELECT COUNT(*) AS LikeCount
        FROM CommentLikes
        WHERE CommentId = @CommentId;

        COMMIT TRANSACTION;
        SET @Result = 1;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_CommentLikes_GetByCommentId
    @CommentId INT,
    @PageNumber INT = 1,
    @PageSize INT = 50,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

        SELECT COUNT(*) AS TotalCount
        FROM CommentLikes cl
        INNER JOIN Users u ON cl.UserId = u.UserId
        WHERE cl.CommentId = @CommentId AND u.IsDeleted = 0;

        SELECT 
            u.UserId,
            u.FullName,
            u.ProfilePictureUrl,
            cl.CreatedAt AS LikedAt
        FROM CommentLikes cl
        INNER JOIN Users u ON cl.UserId = u.UserId
        WHERE cl.CommentId = @CommentId AND u.IsDeleted = 0
        ORDER BY cl.CreatedAt DESC
        OFFSET @Offset ROWS
        FETCH NEXT @PageSize ROWS ONLY;

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_CommentLikes_CheckUserLiked
    @CommentId INT,
    @UserId INT,
    @IsLiked BIT OUTPUT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM CommentLikes WHERE CommentId = @CommentId AND UserId = @UserId)
        BEGIN
            SET @IsLiked = 1;
        END
        ELSE
        BEGIN
            SET @IsLiked = 0;
        END

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_CommentLikes_GetCount
    @CommentId INT,
    @LikeCount INT OUTPUT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT @LikeCount = COUNT(*)
        FROM CommentLikes
        WHERE CommentId = @CommentId;

        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END;
GO
--========================================================
------------------------BOOKINGS-------------------------
--========================================================
CREATE OR ALTER PROCEDURE sp_Bookings_Create
    @UserId INT,
    @PromotionId INT = NULL,
    @NewBookingId INT OUTPUT,
    @NewBookingCode NVARCHAR(20) OUTPUT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    SET @NewBookingId = 0;
    SET @NewBookingCode = '';
    
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Users WHERE UserId = @UserId AND IsDeleted = 0 AND IsActive = 1)
        BEGIN
            SET @Result = -1;
            RETURN;
        END
        
        IF @PromotionId IS NOT NULL
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM Promotions WHERE PromotionId = @PromotionId AND IsDeleted = 0)
            BEGIN
                SET @Result = -2;
                RETURN;
            END
        END
        
        DECLARE @BookingCode NVARCHAR(20);
        SET @BookingCode = dbo.fn_GenerateBookingCode();
        
        WHILE EXISTS (SELECT 1 FROM Bookings WHERE BookingCode = @BookingCode)
        BEGIN
            SET @BookingCode = 'BK' + FORMAT(GETDATE(), 'yyyyMMdd') + RIGHT('000' + CAST(ABS(CHECKSUM(NEWID())) % 10000 AS NVARCHAR(10)), 4);
        END
        
        INSERT INTO Bookings (UserId, BookingCode, Subtotal, DiscountAmount, TotalAmount, PromotionId, Status)
        VALUES (@UserId, @BookingCode, 0, 0, 0, @PromotionId, 'pending');
        
        SET @NewBookingId = SCOPE_IDENTITY();
        SET @NewBookingCode = @BookingCode;
        SET @Result = 1;
        
        SELECT 
            b.BookingId, b.UserId, b.BookingCode, 
            b.Subtotal, b.DiscountAmount, b.TotalAmount,
            b.PromotionId, b.Status, b.CreatedAt,
            u.FullName AS CustomerName, u.Email AS CustomerEmail
        FROM Bookings b
        INNER JOIN Users u ON b.UserId = u.UserId
        WHERE b.BookingId = @NewBookingId;
        
    END TRY
    BEGIN CATCH
        SET @Result = -99;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE sp_Bookings_RecalculateTotal
    @BookingId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Subtotal DECIMAL(18,2), @DiscountAmount DECIMAL(18,2) = 0, @PromotionId INT;
    
    SELECT @Subtotal = ISNULL(SUM(Price * Quantity), 0)
    FROM BookingItems
    WHERE BookingId = @BookingId AND IsDeleted = 0;
    
    SELECT @PromotionId = PromotionId FROM Bookings WHERE BookingId = @BookingId;
    
    IF @PromotionId IS NOT NULL
    BEGIN
        
        SET @DiscountAmount = 0;
    END
    
    UPDATE Bookings
    SET Subtotal = @Subtotal,
        DiscountAmount = @DiscountAmount,
        TotalAmount = @Subtotal - @DiscountAmount
    WHERE BookingId = @BookingId;
END
GO

CREATE OR ALTER PROCEDURE sp_Bookings_GetById
    @BookingId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    
    IF NOT EXISTS (SELECT 1 FROM Bookings WHERE BookingId = @BookingId AND IsDeleted = 0)
    BEGIN
        SET @Result = -1;
        RETURN;
    END
    
    SET @Result = 1;
    
    SELECT 
        b.BookingId, b.UserId, b.BookingCode,
        b.Subtotal, b.DiscountAmount, b.TotalAmount,
        b.PromotionId, b.Status, b.CreatedAt,
        u.FullName AS CustomerName, u.Email AS CustomerEmail, u.PhoneNumber AS CustomerPhone
    FROM Bookings b
    INNER JOIN Users u ON b.UserId = u.UserId
    WHERE b.BookingId = @BookingId AND b.IsDeleted = 0;
    
    SELECT 
        bi.BookingItemId, bi.ServiceAvailabilityId,
        bi.Price, bi.Quantity, (bi.Price * bi.Quantity) AS ItemTotal,
        s.ServiceId, s.Name AS ServiceName, s.Description AS ServiceDescription,
        sc.ServiceTypeName AS CategoryName,
        sa.AvailabilityDate, sa.StartTime, sa.EndTime,
        sp.CompanyName AS ProviderName,
        sp.ContactEmail AS ProviderEmail,
        sp.PhoneNumber AS ProviderPhone,
        sp.Address AS ProviderAddress,
        l.Name AS LocationName, l.City AS LocationCity
    FROM BookingItems bi
    INNER JOIN ServiceAvailabilities sa ON bi.ServiceAvailabilityId = sa.AvailabilityId
    INNER JOIN Services s ON sa.ServiceId = s.ServiceId
    INNER JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID
    INNER JOIN ServiceProviders sp ON s.ProviderId = sp.ProviderId
    LEFT JOIN Locations l ON s.LocationId = l.LocationId
    WHERE bi.BookingId = @BookingId AND bi.IsDeleted = 0;
    
    SELECT 
        t.TransactionId, t.Amount, t.PaymentMethod, t.Currency,
        t.Status, t.TransactionDate,
        pg.GatewayName
    FROM Transactions t
    INNER JOIN PaymentGateways pg ON t.GatewayId = pg.GatewayId
    WHERE t.BookingId = @BookingId AND t.IsDeleted = 0
    ORDER BY t.TransactionDate DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_Bookings_GetByUser
    @UserId INT,
    @Status NVARCHAR(30) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 10,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    
    IF NOT EXISTS (SELECT 1 FROM Users WHERE UserId = @UserId AND IsDeleted = 0)
    BEGIN
        SET @Result = -1;
        RETURN;
    END
    
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    SELECT COUNT(*) AS TotalCount
    FROM Bookings
    WHERE UserId = @UserId AND IsDeleted = 0
        AND (@Status IS NULL OR Status = @Status);
    
    SELECT 
        b.BookingId, b.BookingCode, b.Subtotal, b.DiscountAmount, b.TotalAmount,
        b.Status, b.CreatedAt,
        (SELECT COUNT(*) FROM BookingItems WHERE BookingId = b.BookingId AND IsDeleted = 0) AS ItemCount
    FROM Bookings b
    WHERE b.UserId = @UserId AND b.IsDeleted = 0
        AND (@Status IS NULL OR b.Status = @Status)
    ORDER BY b.CreatedAt DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
    
    SET @Result = 1;
END
GO

CREATE OR ALTER PROCEDURE sp_Bookings_Confirm
    @BookingId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    
    DECLARE @CurrentStatus NVARCHAR(30), @TotalAmount DECIMAL(18,2), @PaidAmount DECIMAL(18,2);
    
    SELECT @CurrentStatus = Status, @TotalAmount = TotalAmount
    FROM Bookings WHERE BookingId = @BookingId AND IsDeleted = 0;
    
    IF @CurrentStatus IS NULL
    BEGIN
        SET @Result = -1;
        RETURN;
    END
    
    IF @CurrentStatus != 'pending'
    BEGIN
        SET @Result = -2;
        RETURN;
    END
    
    SELECT @PaidAmount = ISNULL(SUM(Amount), 0)
    FROM Transactions
    WHERE BookingId = @BookingId AND Status = 'succeeded' AND IsDeleted = 0;
    
    IF @PaidAmount < @TotalAmount
    BEGIN
        SET @Result = -3;
        RETURN;
    END
    
    UPDATE Bookings SET Status = 'confirmed' WHERE BookingId = @BookingId;
    
    SET @Result = 1;
    
    SELECT BookingId, BookingCode, Status FROM Bookings WHERE BookingId = @BookingId;
END
GO

CREATE OR ALTER PROCEDURE sp_Bookings_Cancel
    @BookingId INT,
    @UserId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @CurrentStatus NVARCHAR(30), @BookingUserId INT;
        
        SELECT @CurrentStatus = Status, @BookingUserId = UserId
        FROM Bookings WHERE BookingId = @BookingId AND IsDeleted = 0;
        
        IF @CurrentStatus IS NULL
        BEGIN
            SET @Result = -1;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        IF @BookingUserId != @UserId
        BEGIN
            SET @Result = -2;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        IF @CurrentStatus NOT IN ('pending', 'confirmed')
        BEGIN
            SET @Result = -3;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        DECLARE @EarliestServiceDate DATE;
        DECLARE @HoursUntilService INT;
        
        SELECT @EarliestServiceDate = MIN(sa.AvailabilityDate)
        FROM BookingItems bi
        INNER JOIN ServiceAvailabilities sa ON bi.ServiceAvailabilityId = sa.AvailabilityId
        WHERE bi.BookingId = @BookingId AND bi.IsDeleted = 0;
        
        SET @HoursUntilService = DATEDIFF(HOUR, GETUTCDATE(), @EarliestServiceDate);
        
        IF @HoursUntilService < 24
        BEGIN
            SET @Result = -4;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        DECLARE @AvailabilityId INT, @Quantity INT;
        DECLARE item_cursor CURSOR FOR
            SELECT ServiceAvailabilityId, Quantity
            FROM BookingItems
            WHERE BookingId = @BookingId AND IsDeleted = 0;
        
        OPEN item_cursor;
        FETCH NEXT FROM item_cursor INTO @AvailabilityId, @Quantity;
        
        WHILE @@FETCH_STATUS = 0
        BEGIN
            DECLARE @CancelResult INT;
            EXEC sp_ServiceAvailabilities_CancelBooking
                @AvailabilityId = @AvailabilityId,
                @UnitsToCancel = @Quantity,
                @Result = @CancelResult OUTPUT;
            
            FETCH NEXT FROM item_cursor INTO @AvailabilityId, @Quantity;
        END
        
        CLOSE item_cursor;
        DEALLOCATE item_cursor;
        
        UPDATE Bookings SET Status = 'cancelled' WHERE BookingId = @BookingId;
        
        COMMIT TRANSACTION;
        SET @Result = 1;
        
        SELECT BookingId, BookingCode, Status FROM Bookings WHERE BookingId = @BookingId;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @Result = -99;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE sp_Bookings_Complete
    @BookingId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    
    DECLARE @CurrentStatus NVARCHAR(30);
    SELECT @CurrentStatus = Status FROM Bookings WHERE BookingId = @BookingId AND IsDeleted = 0;
    
    IF @CurrentStatus IS NULL
    BEGIN
        SET @Result = -1;
        RETURN;
    END
    
    IF @CurrentStatus != 'confirmed'
    BEGIN
        SET @Result = -2;
        RETURN;
    END
    
    UPDATE Bookings SET Status = 'completed' WHERE BookingId = @BookingId;
    SET @Result = 1;
    
    SELECT BookingId, BookingCode, Status FROM Bookings WHERE BookingId = @BookingId;
END
GO

CREATE OR ALTER PROCEDURE sp_Bookings_GetStatsByProvider
    @ProviderId INT,
    @FromDate DATE = NULL,
    @ToDate DATE = NULL,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    
    IF NOT EXISTS (SELECT 1 FROM ServiceProviders WHERE ProviderId = @ProviderId AND IsDeleted = 0)
    BEGIN
        SET @Result = -1;
        RETURN;
    END
    
    IF @FromDate IS NULL SET @FromDate = DATEADD(DAY, -30, GETDATE());
    IF @ToDate IS NULL SET @ToDate = GETDATE();
    
    SELECT 
        COUNT(DISTINCT b.BookingId) AS TotalBookings,
        SUM(CASE WHEN b.Status = 'pending' THEN 1 ELSE 0 END) AS PendingBookings,
        SUM(CASE WHEN b.Status = 'confirmed' THEN 1 ELSE 0 END) AS ConfirmedBookings,
        SUM(CASE WHEN b.Status = 'completed' THEN 1 ELSE 0 END) AS CompletedBookings,
        SUM(CASE WHEN b.Status = 'cancelled' THEN 1 ELSE 0 END) AS CancelledBookings,
        SUM(CASE WHEN b.Status IN ('confirmed', 'completed') THEN bi.Price * bi.Quantity ELSE 0 END) AS TotalRevenue,
        SUM(bi.Quantity) AS TotalUnitsBooked
    FROM Bookings b
    INNER JOIN BookingItems bi ON b.BookingId = bi.BookingId AND bi.IsDeleted = 0
    INNER JOIN ServiceAvailabilities sa ON bi.ServiceAvailabilityId = sa.AvailabilityId
    INNER JOIN Services s ON sa.ServiceId = s.ServiceId
    WHERE s.ProviderId = @ProviderId 
        AND b.IsDeleted = 0
        AND b.CreatedAt BETWEEN @FromDate AND DATEADD(DAY, 1, @ToDate);
    
    SELECT 
        s.ServiceId, s.Name AS ServiceName,
        COUNT(DISTINCT b.BookingId) AS BookingCount,
        SUM(CASE WHEN b.Status IN ('confirmed', 'completed') THEN bi.Price * bi.Quantity ELSE 0 END) AS Revenue,
        SUM(bi.Quantity) AS UnitsBooked
    FROM Services s
    LEFT JOIN ServiceAvailabilities sa ON s.ServiceId = sa.ServiceId
    LEFT JOIN BookingItems bi ON sa.AvailabilityId = bi.ServiceAvailabilityId AND bi.IsDeleted = 0
    LEFT JOIN Bookings b ON bi.BookingId = b.BookingId AND b.IsDeleted = 0
        AND b.CreatedAt BETWEEN @FromDate AND DATEADD(DAY, 1, @ToDate)
    WHERE s.ProviderId = @ProviderId AND s.IsDeleted = 0
    GROUP BY s.ServiceId, s.Name
    ORDER BY Revenue DESC;
    
    SET @Result = 1;
END
GO

CREATE OR ALTER PROCEDURE sp_Bookings_GetByProvider
    @ProviderId INT,
    @PageNumber INT = 1,
    @PageSize INT = 10,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    IF NOT EXISTS (SELECT 1 FROM ServiceProviders WHERE ProviderId = @ProviderId AND IsDeleted = 0)
    BEGIN
        SET @Result = -1;
        RETURN;
    END;
    
    SELECT 
        b.BookingId,
        b.BookingCode,
        b.Status,
        b.TotalAmount,
        b.CreatedAt,
        u.FullName AS CustomerName,
        u.Email AS CustomerEmail,
        (SELECT TOP 1 s.Name FROM Services s
         INNER JOIN ServiceAvailabilities sa ON s.ServiceId = sa.ServiceId
         INNER JOIN BookingItems bi ON sa.AvailabilityId = bi.ServiceAvailabilityId
         WHERE bi.BookingId = b.BookingId AND bi.IsDeleted = 0 AND s.ProviderId = @ProviderId
         ORDER BY s.ServiceId) AS ServiceName,
        (SELECT TOP 1 s.ServiceId FROM Services s
         INNER JOIN ServiceAvailabilities sa ON s.ServiceId = sa.ServiceId
         INNER JOIN BookingItems bi ON sa.AvailabilityId = bi.ServiceAvailabilityId
         WHERE bi.BookingId = b.BookingId AND bi.IsDeleted = 0 AND s.ProviderId = @ProviderId
         ORDER BY s.ServiceId) AS ServiceId,
        (SELECT COUNT(*) FROM BookingItems WHERE BookingId = b.BookingId AND IsDeleted = 0) AS ItemCount,
        COUNT(*) OVER() AS TotalCount
    FROM Bookings b
    INNER JOIN Users u ON b.UserId = u.UserId
    WHERE b.IsDeleted = 0
        AND EXISTS (
            SELECT 1 FROM BookingItems bi
            INNER JOIN ServiceAvailabilities sa ON bi.ServiceAvailabilityId = sa.AvailabilityId
            INNER JOIN Services s ON sa.ServiceId = s.ServiceId
            WHERE bi.BookingId = b.BookingId 
                AND bi.IsDeleted = 0 
                AND s.ProviderId = @ProviderId
        )
    ORDER BY b.CreatedAt DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
    
    SET @Result = 1;
END
GO
--========================================================
------------------------BOOKINGITEMS-------------------------
--========================================================
CREATE OR ALTER PROCEDURE sp_BookingItems_Add
    @BookingId INT,
    @ServiceAvailabilityId INT,
    @Quantity INT = 1,
    @NewItemId INT OUTPUT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    SET @NewItemId = 0;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @BookingStatus NVARCHAR(30);
        SELECT @BookingStatus = Status FROM Bookings WHERE BookingId = @BookingId AND IsDeleted = 0;
        
        IF @BookingStatus IS NULL
        BEGIN
            SET @Result = -1;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        IF @BookingStatus != 'pending'
        BEGIN
            SET @Result = -2;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        DECLARE @Price DECIMAL(18,2), @ServiceId INT;
        SELECT @Price = Price, @ServiceId = ServiceId
        FROM ServiceAvailabilities 
        WHERE AvailabilityId = @ServiceAvailabilityId AND IsDeleted = 0;
        
        IF @Price IS NULL
        BEGIN
            SET @Result = -3;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        DECLARE @BookResult INT;
        EXEC sp_ServiceAvailabilities_Book 
            @AvailabilityId = @ServiceAvailabilityId,
            @UnitsToBook = @Quantity,
            @Result = @BookResult OUTPUT;
        
        IF @BookResult = -1
        BEGIN
            SET @Result = -3;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        ELSE IF @BookResult = -2
        BEGIN
            SET @Result = -4;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        ELSE IF @BookResult = -3
        BEGIN
            SET @Result = -5;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        ELSE IF @BookResult != 1
        BEGIN
            SET @Result = -99;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        INSERT INTO BookingItems (BookingId, ServiceAvailabilityId, Price, Quantity)
        VALUES (@BookingId, @ServiceAvailabilityId, @Price, @Quantity);
        
        SET @NewItemId = SCOPE_IDENTITY();
        
        EXEC sp_Bookings_RecalculateTotal @BookingId = @BookingId;
        
        COMMIT TRANSACTION;
        SET @Result = 1;
        
        SELECT 
            bi.BookingItemId, bi.BookingId, bi.ServiceAvailabilityId,
            bi.Price, bi.Quantity, (bi.Price * bi.Quantity) AS ItemTotal,
            s.Name AS ServiceName,
            sa.AvailabilityDate, sa.StartTime, sa.EndTime
        FROM BookingItems bi
        INNER JOIN ServiceAvailabilities sa ON bi.ServiceAvailabilityId = sa.AvailabilityId
        INNER JOIN Services s ON sa.ServiceId = s.ServiceId
        WHERE bi.BookingItemId = @NewItemId;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @Result = -99;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE sp_BookingItems_Remove
    @BookingItemId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @BookingId INT, @AvailabilityId INT, @Quantity INT, @BookingStatus NVARCHAR(30);
        
        SELECT @BookingId = bi.BookingId, @AvailabilityId = bi.ServiceAvailabilityId, @Quantity = bi.Quantity
        FROM BookingItems bi
        WHERE bi.BookingItemId = @BookingItemId AND bi.IsDeleted = 0;
        
        IF @BookingId IS NULL
        BEGIN
            SET @Result = -1;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        SELECT @BookingStatus = Status FROM Bookings WHERE BookingId = @BookingId;
        
        IF @BookingStatus != 'pending'
        BEGIN
            SET @Result = -2;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        DECLARE @CancelResult INT;
        EXEC sp_ServiceAvailabilities_CancelBooking
            @AvailabilityId = @AvailabilityId,
            @UnitsToCancel = @Quantity,
            @Result = @CancelResult OUTPUT;
        
        UPDATE BookingItems SET IsDeleted = 1 WHERE BookingItemId = @BookingItemId;
        
        EXEC sp_Bookings_RecalculateTotal @BookingId = @BookingId;
        
        COMMIT TRANSACTION;
        SET @Result = 1;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @Result = -99;
        THROW;
    END CATCH
END
GO
--========================================================
------------------------TRANSACTIONS-------------------------
--========================================================
CREATE OR ALTER PROCEDURE sp_Transactions_Create
    @BookingId INT,
    @Amount DECIMAL(18,2),
    @PaymentMethod NVARCHAR(50),
    @Currency CHAR(5) = 'VND',
    @GatewayId INT,
    @Status NVARCHAR(30) = 'pending',
    @NewTransactionId INT OUTPUT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    SET @NewTransactionId = 0;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        IF NOT EXISTS (SELECT 1 FROM Bookings WHERE BookingId = @BookingId AND IsDeleted = 0)
        BEGIN
            SET @Result = -1;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        IF NOT EXISTS (SELECT 1 FROM PaymentGateways WHERE GatewayId = @GatewayId AND IsDeleted = 0)
        BEGIN
            SET @Result = -2;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        INSERT INTO Transactions (BookingId, Amount, PaymentMethod, Currency, GatewayId, Status)
        VALUES (@BookingId, @Amount, @PaymentMethod, @Currency, @GatewayId, @Status);
        
        SET @NewTransactionId = SCOPE_IDENTITY();
        
        IF @Status = 'succeeded'
        BEGIN
            UPDATE Bookings 
            SET Status = 'confirmed'
            WHERE BookingId = @BookingId 
              AND Status = 'pending'
              AND IsDeleted = 0;
        END
        
        COMMIT TRANSACTION;
        SET @Result = 1;
        
        SELECT 
            t.TransactionId, t.BookingId, t.Amount, t.PaymentMethod, t.Currency,
            t.Status AS TransactionStatus, t.TransactionDate,
            pg.GatewayName,
            b.Status AS BookingStatus
        FROM Transactions t
        INNER JOIN PaymentGateways pg ON t.GatewayId = pg.GatewayId
        INNER JOIN Bookings b ON t.BookingId = b.BookingId
        WHERE t.TransactionId = @NewTransactionId;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @Result = -99;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE sp_Transactions_UpdateStatus
    @TransactionId INT,
    @NewStatus NVARCHAR(30),
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    
    IF @NewStatus NOT IN ('succeeded', 'failed', 'pending')
    BEGIN
        SET @Result = -1;
        RETURN;
    END
    
    IF NOT EXISTS (SELECT 1 FROM Transactions WHERE TransactionId = @TransactionId AND IsDeleted = 0)
    BEGIN
        SET @Result = -2;
        RETURN;
    END
    
    UPDATE Transactions SET Status = @NewStatus WHERE TransactionId = @TransactionId;
    
    IF @NewStatus = 'succeeded'
    BEGIN
        DECLARE @BookingId INT;
        SELECT @BookingId = BookingId FROM Transactions WHERE TransactionId = @TransactionId;
        
        DECLARE @ConfirmResult INT;
        EXEC sp_Bookings_Confirm @BookingId = @BookingId, @Result = @ConfirmResult OUTPUT;
    END
    
    SET @Result = 1;
    
    SELECT TransactionId, BookingId, Amount, Status FROM Transactions WHERE TransactionId = @TransactionId;
END
GO

CREATE OR ALTER PROCEDURE sp_Transactions_GetByBooking
    @BookingId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 1;
    
    SELECT 
        t.TransactionId, t.Amount, t.PaymentMethod, t.Currency,
        t.Status, t.TransactionDate,
        pg.GatewayName
    FROM Transactions t
    INNER JOIN PaymentGateways pg ON t.GatewayId = pg.GatewayId
    WHERE t.BookingId = @BookingId AND t.IsDeleted = 0
    ORDER BY t.TransactionDate DESC;
END
GO
--========================================================
------------------------REFUNDS-------------------------
--========================================================
CREATE OR ALTER PROCEDURE sp_Refunds_Request
    @BookingId INT,
    @UserId INT,
    @Amount DECIMAL(18,2),
    @Reason NVARCHAR(1000),
    @RefundMethod NVARCHAR(50) = NULL,
    @NewRefundId INT OUTPUT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    SET @NewRefundId = 0;
    
    DECLARE @BookingUserId INT, @BookingStatus NVARCHAR(30);
    SELECT @BookingUserId = UserId, @BookingStatus = Status
    FROM Bookings WHERE BookingId = @BookingId AND IsDeleted = 0;
    
    IF @BookingUserId IS NULL
    BEGIN
        SET @Result = -1;
        RETURN;
    END
    
    IF @BookingUserId != @UserId
    BEGIN
        SET @Result = -2;
        RETURN;
    END

    IF @BookingStatus NOT IN ('cancelled', 'completed', 'confirmed')
    BEGIN
        SET @Result = -3;
        RETURN;
    END
    
    DECLARE @OriginalTransactionId INT;
    SELECT TOP 1 @OriginalTransactionId = TransactionId
    FROM Transactions
    WHERE BookingId = @BookingId AND Status = 'succeeded' AND IsDeleted = 0
    ORDER BY TransactionDate DESC;
    
    -- Tạo refund request
    INSERT INTO Refunds (BookingId, OriginalTransactionId, Amount, Reason, RefundMethod, Status)
    VALUES (@BookingId, @OriginalTransactionId, @Amount, @Reason, @RefundMethod, 'pending');
    
    SET @NewRefundId = SCOPE_IDENTITY();
    SET @Result = 1;
    
    SELECT 
        r.RefundId, r.BookingId, r.Amount, r.Reason, r.RefundMethod,
        r.Status, r.RequestedAt
    FROM Refunds r
    WHERE r.RefundId = @NewRefundId;
END
GO

CREATE OR ALTER PROCEDURE sp_Refunds_Process
    @RefundId INT,
    @AdminUserId INT,
    @NewStatus NVARCHAR(30),
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    
    IF @NewStatus NOT IN ('approved', 'processed', 'rejected')
    BEGIN
        SET @Result = -1;
        RETURN;
    END
    
    DECLARE @AdminRoleId INT;
    SELECT @AdminRoleId = RoleId FROM Users WHERE UserId = @AdminUserId AND IsDeleted = 0;
    
    IF @AdminRoleId != 1
    BEGIN
        SET @Result = -2;
        RETURN;
    END
    
    IF NOT EXISTS (SELECT 1 FROM Refunds WHERE RefundId = @RefundId AND IsDeleted = 0)
    BEGIN
        SET @Result = -3;
        RETURN;
    END
    
    UPDATE Refunds
    SET Status = @NewStatus,
        ProcessedAt = SYSUTCDATETIME(),
        AdminUserId = @AdminUserId
    WHERE RefundId = @RefundId;
    
    SET @Result = 1;
    
    SELECT 
        r.RefundId, r.BookingId, r.Amount, r.Status,
        r.RequestedAt, r.ProcessedAt,
        u.FullName AS ProcessedByAdmin
    FROM Refunds r
    LEFT JOIN Users u ON r.AdminUserId = u.UserId
    WHERE r.RefundId = @RefundId;
END
GO

CREATE OR ALTER PROCEDURE sp_Refunds_GetByBooking
    @BookingId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 1;
    
    SELECT 
        r.RefundId, r.Amount, r.Reason, r.RefundMethod,
        r.Status, r.RequestedAt, r.ProcessedAt,
        u.FullName AS ProcessedByAdmin
    FROM Refunds r
    LEFT JOIN Users u ON r.AdminUserId = u.UserId
    WHERE r.BookingId = @BookingId AND r.IsDeleted = 0
    ORDER BY r.RequestedAt DESC;
END
GO

--========================================================
------------------------REVIEWS-------------------------
--========================================================
CREATE OR ALTER PROCEDURE sp_Reviews_Create
    @UserId INT,
    @ServiceId INT,
    @Rating INT,
    @Title NVARCHAR(200) = NULL,
    @Comment NVARCHAR(MAX) = NULL,
    @NewReviewId INT OUTPUT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Users WHERE UserId = @UserId AND IsDeleted = 0)
        BEGIN
            SET @Result = -1;
            RETURN;
        END
        
        IF NOT EXISTS (SELECT 1 FROM Services WHERE ServiceId = @ServiceId AND IsDeleted = 0)
        BEGIN
            SET @Result = -2;
            RETURN;
        END
        
        IF @Rating < 1 OR @Rating > 5
        BEGIN
            SET @Result = -3;
            RETURN;
        END
        
        IF EXISTS (SELECT 1 FROM Reviews WHERE UserId = @UserId AND ServiceId = @ServiceId AND IsDeleted = 0)
        BEGIN
            SET @Result = -4;
            RETURN;
        END
        
        IF NOT EXISTS (
            SELECT 1 
            FROM Bookings b
            INNER JOIN BookingItems bi ON b.BookingId = bi.BookingId AND bi.IsDeleted = 0
            INNER JOIN ServiceAvailabilities sa ON bi.ServiceAvailabilityId = sa.AvailabilityId
            WHERE b.UserId = @UserId 
                AND sa.ServiceId = @ServiceId
                AND b.IsDeleted = 0
                AND b.Status IN ('confirmed', 'completed')
        )
        BEGIN
            SET @Result = -5; -- User has not booked this service
            RETURN;
        END
        
        INSERT INTO Reviews (UserId, ServiceId, Rating, Title, Comment)
        VALUES (@UserId, @ServiceId, @Rating, @Title, @Comment);
        
        SET @NewReviewId = SCOPE_IDENTITY();
        SET @Result = 1;
    END TRY
    BEGIN CATCH
        SET @Result = -99;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE sp_Reviews_GetById
    @ReviewId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    
    IF NOT EXISTS (SELECT 1 FROM Reviews WHERE ReviewId = @ReviewId AND IsDeleted = 0)
    BEGIN
        SET @Result = -1;
        RETURN;
    END
    
    SET @Result = 1;
    
    SELECT 
        r.ReviewId,
        r.UserId,
        r.ServiceId,
        r.Rating,
        r.Title,
        r.Comment,
        r.CreatedAt,
        u.FullName AS UserName,
        u.Email AS UserEmail,
        s.Name AS ServiceName
    FROM Reviews r
    INNER JOIN Users u ON r.UserId = u.UserId
    INNER JOIN Services s ON r.ServiceId = s.ServiceId
    WHERE r.ReviewId = @ReviewId AND r.IsDeleted = 0;
END
GO

CREATE OR ALTER PROCEDURE sp_Reviews_GetByServiceId
    @ServiceId INT,
    @PageNumber INT = 1,
    @PageSize INT = 10,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    IF NOT EXISTS (SELECT 1 FROM Services WHERE ServiceId = @ServiceId AND IsDeleted = 0)
    BEGIN
        SET @Result = -1;
        RETURN;
    END
    
    SET @Result = 1;
    
    SELECT COUNT(*) AS TotalCount
    FROM Reviews
    WHERE ServiceId = @ServiceId AND IsDeleted = 0;
    
    SELECT 
        r.ReviewId,
        r.UserId,
        r.ServiceId,
        r.Rating,
        r.Title,
        r.Comment,
        r.CreatedAt,
        u.FullName AS UserName,
        u.Email AS UserEmail,
        u.ProfilePictureUrl AS UserAvatar
    FROM Reviews r
    INNER JOIN Users u ON r.UserId = u.UserId
    WHERE r.ServiceId = @ServiceId AND r.IsDeleted = 0
    ORDER BY r.CreatedAt DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

CREATE OR ALTER PROCEDURE sp_Reviews_GetByUserId
    @UserId INT,
    @PageNumber INT = 1,
    @PageSize INT = 10,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    IF NOT EXISTS (SELECT 1 FROM Users WHERE UserId = @UserId AND IsDeleted = 0)
    BEGIN
        SET @Result = -1;
        RETURN;
    END
    
    SET @Result = 1;
    
    -- Get total count
    SELECT COUNT(*) AS TotalCount
    FROM Reviews
    WHERE UserId = @UserId AND IsDeleted = 0;
    SELECT 
        r.ReviewId,
        r.UserId,
        r.ServiceId,
        r.Rating,
        r.Title,
        r.Comment,
        r.CreatedAt,
        s.Name AS ServiceName,
        s.Description AS ServiceDescription
    FROM Reviews r
    INNER JOIN Services s ON r.ServiceId = s.ServiceId
    WHERE r.UserId = @UserId AND r.IsDeleted = 0
    ORDER BY r.CreatedAt DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

CREATE OR ALTER PROCEDURE sp_Reviews_Update
    @ReviewId INT,
    @UserId INT,
    @Rating INT = NULL,
    @Title NVARCHAR(200) = NULL,
    @Comment NVARCHAR(MAX) = NULL,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Reviews WHERE ReviewId = @ReviewId AND UserId = @UserId AND IsDeleted = 0)
        BEGIN
            SET @Result = -1; -- Review not found or not owner
            RETURN;
        END
        
        IF @Rating IS NOT NULL AND (@Rating < 1 OR @Rating > 5)
        BEGIN
            SET @Result = -2; -- Invalid rating
            RETURN;
        END
        
        UPDATE Reviews
        SET 
            Rating = ISNULL(@Rating, Rating),
            Title = ISNULL(@Title, Title),
            Comment = ISNULL(@Comment, Comment)
        WHERE ReviewId = @ReviewId;
        
        SET @Result = 1; -- Success
    END TRY
    BEGIN CATCH
        SET @Result = -99; -- System error
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE sp_Reviews_Delete
    @ReviewId INT,
    @UserId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Reviews WHERE ReviewId = @ReviewId AND UserId = @UserId AND IsDeleted = 0)
        BEGIN
            SET @Result = -1; -- Review not found or not owner
            RETURN;
        END
        
        UPDATE Reviews
        SET IsDeleted = 1
        WHERE ReviewId = @ReviewId;
        
        SET @Result = 1; -- Success
    END TRY
    BEGIN CATCH
        SET @Result = -99; -- System error
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE sp_Reviews_GetServiceStats
    @ServiceId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    
    -- Validate Service exists
    IF NOT EXISTS (SELECT 1 FROM Services WHERE ServiceId = @ServiceId AND IsDeleted = 0)
    BEGIN
        SET @Result = -1; -- Service not found
        RETURN;
    END
    
    SET @Result = 1;
    
    SELECT 
        @ServiceId AS ServiceId,
        COUNT(*) AS TotalReviews,
        AVG(CAST(Rating AS FLOAT)) AS AverageRating,
        SUM(CASE WHEN Rating = 5 THEN 1 ELSE 0 END) AS Rating5,
        SUM(CASE WHEN Rating = 4 THEN 1 ELSE 0 END) AS Rating4,
        SUM(CASE WHEN Rating = 3 THEN 1 ELSE 0 END) AS Rating3,
        SUM(CASE WHEN Rating = 2 THEN 1 ELSE 0 END) AS Rating2,
        SUM(CASE WHEN Rating = 1 THEN 1 ELSE 0 END) AS Rating1
    FROM Reviews
    WHERE ServiceId = @ServiceId AND IsDeleted = 0;
END
GO



CREATE OR ALTER PROCEDURE sp_Reviews_GetProviderAverageRating
    @ProviderId INT,
    @Result INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Result = 0;
    
    IF NOT EXISTS (SELECT 1 FROM ServiceProviders WHERE ProviderId = @ProviderId AND IsDeleted = 0)
    BEGIN
        SET @Result = -1; -- Provider not found
        RETURN;
    END
    
    SET @Result = 1;
    
    SELECT * FROM fn_Reviews_GetProviderAverageRating(@ProviderId);
END
GO
-------------------TRIGGERS---------------------
CREATE TRIGGER trg_Users_UpdateTimestamp
ON Users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE u
    SET UpdatedAt = SYSUTCDATETIME()
    FROM Users AS u
    INNER JOIN inserted AS ins ON u.UserId = ins.UserId;
END;
GO

CREATE OR ALTER TRIGGER trg_Comments_Cascade
ON Comments
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF UPDATE(IsDeleted) AND EXISTS (SELECT 1 FROM inserted WHERE IsDeleted = 1)
    BEGIN
        ;WITH RecursiveDeletes AS (
            SELECT i.CommentId
            FROM inserted i
            INNER JOIN deleted d ON i.CommentId = d.CommentId
            WHERE i.IsDeleted = 1 AND d.IsDeleted = 0

            UNION ALL

            SELECT c.CommentId
            FROM Comments c
            INNER JOIN RecursiveDeletes rd ON c.ParentCommentId = rd.CommentId
            WHERE c.IsDeleted = 0
        )
        UPDATE Comments
        SET IsDeleted = 1
        WHERE CommentId IN (SELECT CommentId FROM RecursiveDeletes)
          AND CommentId NOT IN (SELECT CommentId FROM inserted);
    END
END;
GO

-------------------INSERT DATA---------------------
-- 1. Khởi tạo các Role (Bắt buộc chạy trước)
INSERT INTO Roles (RoleName) VALUES ('Admin'), ('User'), ('Provider');
GO

-- 2. Chèn tài khoản Quản trị viên (Role 1)
INSERT INTO Users (FullName, Email, PasswordHash, RoleId, IsActive)
VALUES (N'Quản trị viên', 'admin@wanderly.com', CONVERT(NVARCHAR(64), HASHBYTES('SHA2_256', '123456'), 2), 1, 1);
GO

-- 3. Chèn tài khoản Người dùng phổ thông (Role 2)
INSERT INTO Users (FullName, Email, PasswordHash, RoleId, IsActive)
VALUES (N'Khách du lịch mẫu', 'member@wanderly.com', CONVERT(NVARCHAR(64), HASHBYTES('SHA2_256', '123456'), 2), 2, 1);
GO

-- 4. Chèn tài khoản Nhà cung cấp (Role 3)
-- Lưu ý: Đối với Role này, hệ thống cần bản ghi trong cả bảng Users và ServiceProviders
DECLARE @ProviderUserId INT;

INSERT INTO Users (FullName, Email, PasswordHash, RoleId, IsActive)
VALUES (N'Đối tác Wanderly', 'partner@wanderly.com', CONVERT(NVARCHAR(64), HASHBYTES('SHA2_256', '123456'), 2), 3, 1);

SET @ProviderUserId = SCOPE_IDENTITY();

INSERT INTO ServiceProviders (OwnerUserId, CompanyName, ContactEmail, IsVerified)
VALUES (@ProviderUserId, N'Wanderly Partner Co.', 'partner@wanderly.com', 1);
GO

INSERT INTO Locations (Name, Address, City, Country, Description, Latitude, Longitude, ImageUrl) VALUES
(N'Vịnh Hạ Long', N'Thành phố Hạ Long', N'Quảng Ninh', N'Việt Nam', N'Di sản thiên nhiên thế giới UNESCO với hàng nghìn đảo đá vôi kỳ vĩ', 20.950147, 107.050432, N'https://wallpaperaccess.com/full/4255298.jpg'),
(N'Tràng An', N'Xã Trường Yên, Hoa Lư', N'Ninh Bình', N'Việt Nam', N'Quần thể danh thắng UNESCO với núi đá vôi, hang động và sông nước', 20.252863, 105.918385, N'R.664a1b08e2ef7d28a29d74245b05190e'),
(N'Phong Nha - Kẻ Bàng', N'Huyện Bố Trạch', N'Quảng Bình', N'Việt Nam', N'Công viên quốc gia nổi tiếng với hệ thống hang động kỳ vĩ, trong đó có Sơn Đoòng', 17.482973, 106.135016, N'du-lich-phong-nha-ke-bang-123-2134.jpg'),
(N'Phố cổ Hội An', N'Trung tâm thành phố Hội An', N'Quảng Nam', N'Việt Nam', N'Đô thị cổ UNESCO với kiến trúc Á – Âu hòa trộn và phố đèn lồng nổi tiếng', 15.876654, 108.326482, N'check-in-pho-co-hoi-an-1.jpg'),
(N'Đà Lạt', N'Trung tâm thành phố Đà Lạt', N'Lâm Đồng', N'Việt Nam', N'Thành phố ngàn hoa, khí hậu mát mẻ, hồ – thung lũng – kiến trúc Pháp lãng mạn', 11.938890, 108.445443, N'review-da-lat-toan-canh-dat-lat-trong-suong-mu-som-mai-1.jpg'),
(N'Sa Pa – Fansipan', N'Thị xã Sa Pa', N'Lào Cai', N'Việt Nam', N'Thị trấn vùng núi với ruộng bậc thang cùng đỉnh Fansipan – nóc nhà Đông Dương', 22.332501, 103.835497, N'sapa-fansipan.jpg'),
(N'Nha Trang – Vịnh Nha Trang', N'Thành phố Nha Trang', N'Khánh Hòa', N'Việt Nam', N'Một trong những vịnh biển đẹp nhất thế giới, nước trong xanh và đảo san hô', 12.210702, 109.230506, N'anh-nha-trang-dep-nhat.jpg'),
(N'Cù Lao Chàm', N'Xã Tân Hiệp', N'Quảng Nam', N'Việt Nam', N'Khu dự trữ sinh quyển thế giới với biển xanh – rạn san hô – hệ sinh thái nguyên sơ', 15.958517, 108.504714, N'review-kinh-nghiem-du-lich-nha-trang-moi-nhat-2019-5.jpg'),
(N'Côn Đảo', N'Huyện Côn Đảo', N'Bà Rịa – Vũng Tàu', N'Việt Nam', N'Đảo hoang sơ, bãi biển đẹp và di tích lịch sử nhà tù Côn Đảo nổi tiếng', 8.702196, 106.611145, N'beautiful-con-dao-island-seen-from-above-15a09c6184ef41b59b21f1ea17a45bda.jpg'),
(N'Đảo Phú Quốc', N'Thành phố Phú Quốc', N'Kiên Giang', N'Việt Nam', N'Đảo ngọc với biển xanh – rừng nguyên sinh và hệ thống resort cao cấp', 10.290915, 103.996951, N'anh-dao-phu-quoc-voi-thuyen-du-lich.jpg'),
(N'Tháp Bà Ponagar', N'2 Tháng 4, Vĩnh Phước', N'Nha Trang', N'Việt Nam', N'Công trình kiến trúc Chăm Pa cổ kính hơn 1000 năm tuổi', 12.265555, 109.195421, N'Hinh-anh-thap-ba-Ponagar-dep-voi-nhieu-gia-tri.jpg'),
(N'Núi Bà Đen – Tây Ninh', N'Xã Thạnh Tân', N'Tây Ninh', N'Việt Nam', N'Ngọn núi cao nhất Đông Nam Bộ, nổi tiếng với cáp treo và quần thể tâm linh', 11.382467, 106.170037, N'Kinh-nghiem-du-lich-Nui-Ba-Den-04.jpg'),
(N'Bán đảo Sơn Trà', N'Sơn Trà', N'Đà Nẵng', N'Việt Nam', N'Viên ngọc xanh của Đà Nẵng với khỉ voọc chà vá chân nâu và rừng nguyên sinh', 16.116166, 108.273361, N'lich-trinh-kham-pha-da-nang-tu-tuc-trong-1-ngay-vo-cung-thu-vi-01-1637084640.jpeg'),
(N'Cầu Vàng – Bà Nà Hills', N'Hòa Phú', N'Đà Nẵng', N'Việt Nam', N'Cây cầu biểu tượng nổi tiếng thế giới với đôi bàn tay khổng lồ nâng đỡ', 15.995180, 107.996133, N'DJI_0004.jpg'),
(N'Hồ Hoàn Kiếm – Tháp Rùa', N'Quận Hoàn Kiếm', N'Hà Nội', N'Việt Nam', N'Biểu tượng Thủ đô với Tháp Rùa, cầu Thê Húc và đền Ngọc Sơn', 21.027863, 105.852264, N'lac-hoan-kiem-a-hanoi-1.jpg'),
(N'Chợ Bến Thành', N'Phường Bến Nghé', N'TP. Hồ Chí Minh', N'Việt Nam', N'Ngôi chợ biểu tượng Sài Gòn với lịch sử hơn 100 năm', 10.772632, 106.697924, N'Cho-Ben-Thanh-2.jpg'),
(N'Nhà thờ Đức Bà Sài Gòn', N'01 Công Xã Paris', N'TP. Hồ Chí Minh', N'Việt Nam', N'Công trình kiến trúc Pháp mang phong cách Roman – Gothic', 10.779815, 106.699019, N'Notre-Dame-Cathedral-4.jpg'),
(N'Hang Múa – Ninh Bình', N'Khê Đầu Hạ', N'Ninh Bình', N'Việt Nam', N'Điểm “sống ảo” nổi tiếng với 486 bậc thang và view toàn cảnh Tam Cốc', 20.228960, 105.935325, N'129b27371f1d642cfccf2eb7b4ab1ad4.jpg'),
(N'Tam Cốc – Bích Động', N'Xã Ninh Hải', N'Ninh Bình', N'Việt Nam', N'“Vịnh Hạ Long trên cạn” với núi non và dòng Ngô Đồng thơ mộng', 20.216334, 105.937465, N'20161213092227-tam-coc-bich-dong-gody (7).jpg'),
(N'Mũi Né – Bàu Trắng', N'Xã Hòa Thắng', N'Bình Thuận', N'Việt Nam', N'Đồi cát trắng rộng lớn và hồ nước trong xanh giữa sa mạc', 11.066942, 108.423936, N'1-4.jpg'),
(N'Hoàng thành Thăng Long', N'19C Hoàng Diệu, Ba Đình', N'Hà Nội', N'Việt Nam', N'Di sản văn hóa thế giới với lịch sử 13 thế kỷ của kinh thành Thăng Long.', 21.035221, 105.840255, N'https://nhandan.vn/special/hoang-thanh-Thang-Long/assets/19wV2w4DSu/ht1-4096x2363.jpg'),
(N'Văn Miếu - Quốc Tử Giám', N'58 Quốc Tử Giám, Đống Đa', N'Hà Nội', N'Việt Nam', N'Trường đại học đầu tiên của Việt Nam, biểu tượng của đạo học và kiến trúc cổ.', 21.029300, 105.836000, N'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVVDdgzoDcaVnr08PdRpaQFiiPIfhiGYOW-g&s'),
(N'Thánh địa Mỹ Sơn', N'Xã Duy Phú, Duy Xuyên', N'Quảng Nam', N'Việt Nam', N'Quần thể đền tháp Chăm Pa cổ nằm trong thung lũng kín đáo.', 15.764872, 108.122506, N'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQv5knvx3p44qaDflBZnBkwKyhzoYJoHRvNCw&s'),
(N'Thành nhà Hồ', N'Xã Vĩnh Long, Vĩnh Lộc', N'Thanh Hóa', N'Việt Nam', N'Tòa thành đá độc đáo duy nhất còn lại ở Đông Nam Á, di sản UNESCO.', 20.076300, 105.603300, N'https://image.sggp.org.vn/1200x630/Uploaded/2025/lcgkcwvo/2023_11_14/1-9587.jpg.webp'),
(N'Gành Đá Đĩa', N'Xã An Ninh Đông, Tuy An', N'Phú Yên', N'Việt Nam', N'Thắng cảnh với các cột đá bazan hình lăng trụ xếp chồng lên nhau tự nhiên.', 13.353955, 109.293750, N'https://statics.vinpearl.com/ganh-da-dia-phu-yen_1751078702.jpg'),
(N'Chợ nổi Cái Răng', N'46 Hai Bà Trưng, Cái Răng', N'Cần Thơ', N'Việt Nam', N'Nét văn hóa sông nước miền Tây đặc trưng với hoạt động buôn bán trên ghe.', 10.005023, 105.745976, N'https://ktmt.vnmediacdn.com/images/2024/07/30/89-1722328315-193a061b64f4c1aa98e5.jpg'),
(N'Đảo Bình Ba', N'Xã Cam Bình, Cam Ranh', N'Khánh Hòa', N'Việt Nam', N'"Đảo Tôm Hùm" với vẻ đẹp hoang sơ và nước biển trong xanh.', 11.840496, 109.229240, N'https://vcdn1-dulich.vnecdn.net/2022/04/08/binhbavnexpressruahayxin-16493-3206-1982-1649406973.jpg?w=1200&h=0&q=100&dpr=1&fit=crop&s=21Ay78ESvpLp2oWvt74PyQ'),
(N'Chùa Hương Nghiêm', N'Bến Cát, Bình Dương', N'Hồ Chí Minh', N'Việt Nam', N'Quần thể văn hóa - tôn giáo Việt Nam với động Hương Tích nổi tiếng.', 11.068539, 106.659171, N'https://m.baotuyenquang.com.vn/media/images/2023/04/img_20230413093544.jpg'),
(N'Vòng móng ngựa Lao Chải', N'Huyện Mù Cang Chải', N'Yên Bái', N'Việt Nam', N'Danh thắng quốc gia với những thửa ruộng bậc thang kỳ vĩ mùa lúa chín.', 21.853714, 104.029290, N'https://vj-prod-website-cms.s3.ap-southeast-1.amazonaws.com/shutterstock2246073829-1701309980693.jpg'),
(N'Vịnh Tà Đùng', N'Xã Đắk Som, Đắk Glong', N'Đắk Nông', N'Việt Nam', N'Được mệnh danh là "Vịnh Hạ Long của Tây Nguyên" với hàng chục đảo nhỏ.', 11.835347, 107.922986, N'https://lacatour.vn/wp-content/uploads/2022/10/ho-ta-dung-1.jpg'),
(N'Động Thiên Đường', N'Xã Sơn Trạch, Bố Trạch', N'Quảng Bình', N'Việt Nam', N'Hang động khô dài nhất châu Á với hệ thống thạch nhũ tráng lệ.', 17.519452, 106.223284, N'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRzjy1A8rZ9F4uiVQmDcNRGROEJIrDFw0tfdQ&s'),
(N'Địa đạo Củ Chi', N'Xã Phú Mỹ Hưng, Củ Chi', N'TP. Hồ Chí Minh', N'Việt Nam', N'Hệ thống phòng thủ trong lòng đất dài hơn 200km nổi tiếng thời chiến.', 11.141586, 106.461599, N'https://dulichconvoi.com/wp-content/uploads/2023/09/lich-su-dia-dao-cu-chi.jpg'),
(N'Tòa Thánh Tây Ninh', N'Phường Long Hoa, Hòa Thành', N'Tây Ninh', N'Việt Nam', N'Công trình kiến trúc tôn giáo độc đáo kết hợp triết lý Đông - Tây của đạo Cao Đài.', 11.303776, 106.132985, N'https://cdn.nhandan.vn/images/1ef398c4e2fb4bf07980a2ded785b3efd80f48eac5c47f218b4b22c7bcf3b65aaeacc308618cef2729d4c7f1b29ce06593e30150b6a64f9ea707465ba17fc04374b466b0f3fa15e0bc83f1a071867329409f7ab2e598c2a4426f2f96c296e876/z5305475159516-73d4c3ab165e4404e80d4c2dc4e6f769-7720.jpg'),
(N'Nhà tù Hỏa Lò', N'1 Hỏa Lò, Hoàn Kiếm', N'Hà Nội', N'Việt Nam', N'Di tích lịch sử được mệnh danh là "Hilton Hanoi", nơi giam giữ phi công Mỹ.', 21.025311, 105.846536, N'https://dulichnewtour.vn/ckfinder/images/Tours/nhatuhoalo/nha-tu-hoa-lo%20(15).jpg'),
(N'Eo Gió', N'Xã Nhơn Lý, Quy Nhơn', N'Bình Định', N'Việt Nam', N'Cung đường đi bộ ven biển với vách đá dựng đứng và gió lồng lộng.', 13.886263, 109.290874, N'https://statics.vinpearl.com/eo-gio-quy-nhon-1_1703490274.jpg'),
(N'Phá Tam Giang', N'Huyện Phong Điền', N'Thừa Thiên Huế', N'Việt Nam', N'Đầm phá lớn nhất Đông Nam Á, nổi tiếng với vẻ đẹp hoàng hôn', 16.621972, 107.495878, N'https://huesmiletravel.com.vn/images/pha-tam-giang01.jpg'),
(N'Biển Lăng Cô', N'Huyện Phú Lộc', N'Thừa Thiên Huế', N'Việt Nam', N'Một trong những vịnh biển đẹp nhất thế giới, cảnh quan núi và biển thơ mộng', 16.242011, 108.084950, N'https://khuvuichoi.com/wp-content/uploads/2020/08/vinh-lang-co-vinh-bien-dep-nhat-the-gioi-hinh1.jpg'),
(N'Biển Mỹ Khê', N'Quận Sơn Trà', N'Đà Nẵng', N'Việt Nam', N'Bãi biển đẹp nổi tiếng thế giới, cát trắng mịn và nước biển xanh ngắt', 16.062025, 108.246723, N'https://d2e5ushqwiltxm.cloudfront.net/wp-content/uploads/sites/72/2025/08/08113653/bien-my-khe-da-nang.jpg'),
(N'Cố đô Huế', N'Thành phố Huế', N'Thừa Thiên Huế', N'Việt Nam', N'Kinh đô cũ của Việt Nam với các di tích lịch sử và kiến trúc độc đáo', 16.462923, 107.586721, N'https://suckhoedoisong.qltns.mediacdn.vn/324455921873985536/2022/6/17/3-165546455992482360081.jpg'),
(N'Vườn quốc gia Bạch Mã', N'Huyện Phú Lộc', N'Thừa Thiên Huế', N'Việt Nam', N'Vườn quốc gia đa dạng sinh học, thác nước và hệ thống đường mòn tự nhiên', 16.216554, 107.893740, N'https://res.klook.com/images/fl_lossy.progressive,q_65/c_fill,w_1295,h_728/w_80,x_15,y_15,g_south_west,l_klook_water/activities/iddtkovsys2vlq9ucw2c/TourNg%C3%A0yTrekkingV%C6%B0%E1%BB%9DnQu%E1%BB%91cGiaB%E1%BA%A1chM%C3%A3.jpg'),
(N'Suối Bản Mòn', N'Huyện Mộc Châu', N'Sơn La', N'Việt Nam', N'Cao nguyên với đồi chè xanh mướt, hoa mận, hoa đào và khí hậu trong lành', 20.843129, 104.625292, N'https://luhanhvietnam.com.vn/du-lich/vnt_upload/news/06_2025/suoi_ban_mon_moc_chau_4.jpg'),
(N'Hà Giang', N'Thành phố Hà Giang', N'Hà Giang', N'Việt Nam', N'Vùng đất địa đầu tổ quốc với núi đá vôi hùng vĩ và ruộng bậc thang', 22.816332, 104.981857, N'https://baotuyenquang.com.vn/file/4028eaa4679b32c401679c0c74382a7e/042023/22_20230419145608.jpg'),
(N'Cao nguyên đá Đồng Văn', N'Huyện Đồng Văn', N'Hà Giang', N'Việt Nam', N'Công viên địa chất toàn cầu UNESCO với những khối núi đá và thung lũng sâu', 23.260570, 105.257916, N'https://reviewvilla.vn/wp-content/uploads/2022/06/Cao-nguyen-da-Dong-Van-1.jpg'),
(N'Thác Bản Giốc', N'Huyện Trùng Khánh', N'Cao Bằng', N'Việt Nam', N'Thác nước tự nhiên lớn thứ tư thế giới nằm trên đường biên giới', 22.854414, 106.724309, N'https://images.baodantoc.vn/uploads/2021/Th%C3%A1ng%207/Ng%C3%A0y_19/Thac%20Ban%20Gioc/10.jpg'),
(N'Hồ Ba Bể', N'Huyện Ba Bể', N'Bắc Kạn', N'Việt Nam', N'Hồ nước ngọt tự nhiên lớn nhất Việt Nam, phong cảnh núi rừng hùng vĩ', 22.449626, 105.610379, N'https://en.baoquocte.vn/stores/news_dataimages/quangdao/042018/09/15/153309_045280891317.jpg'),
(N'Thành Cổ Lạng Sơn', N'Thành phố Lạng Sơn', N'Lạng Sơn', N'Việt Nam', N'Cửa khẩu biên giới, nhiều di tích lịch sử và danh lam thắng cảnh', 21.841363, 106.755241, N'https://bcp.cdnchinhphu.vn/Uploaded/dangthucuc/2021_10_20/langson.jpg'),
(N'Quần đảo Cát Bà', N'Huyện Cát Hải', N'Hải Phòng', N'Việt Nam', N'Đảo lớn nhất trong vịnh Hạ Long, với các bãi biển, hang động và rừng quốc gia', 20.800681, 107.000237, N'https://catbafreedom.com/pic/AboutUs/images/c%C3%A1tb%C3%A0(2).jpg'),
(N'Nhà hát thành phố Hải Phòng', N'Thành phố Hải Phòng', N'Hải Phòng', N'Việt Nam', N'Thành phố cảng với kiến trúc cổ kính và ẩm thực phong phú', 20.860207, 106.673340, N'https://media.mia.vn/uploads/blog-du-lich/nha-hat-lon-hai-phong-bieu-tuong-cua-thanh-pho-cang-1648028696.jpg'),
(N'Tháp Chàm Ninh Thuận', N'Thành phố Phan Rang – Tháp Chàm', N'Ninh Thuận', N'Việt Nam', N'Vùng đất nắng gió với đồi cát, vườn nho và văn hóa Chăm độc đáo', 11.600210, 108.946282, N'https://www.tsttourist.com/vnt_upload/news/04_2023/TSTtourist_thap_po_klong_garai_tuyet_tac_huyen_bi_cua_nguoi_cham_o_ninh_thuan_1.jpg'),
(N'Bãi biển Phan Thiết', N'Thành phố Phan Thiết', N'Bình Thuận', N'Việt Nam', N'Biển xanh, đồi cát bay và các khu nghỉ dưỡng đẳng cấp', 10.932288, 108.131713, N'https://www.vietnamairlines.com/~/media/SEO-images/2025%20SEO/Traffic%20TV/bai-bien-phan-thiet/bai-bien-phan-thiet-2.jpg?la=vi-VN'),
(N'Đảo Lý Sơn', N'Huyện Lý Sơn', N'Quảng Ngãi', N'Việt Nam', N'"Vương quốc tỏi" với phong cảnh hoang sơ, biển xanh và núi lửa đã tắt', 15.390670, 109.124096, N'https://thoidai.com.vn/stores/news_dataimages/trang.chu/072019/24/15/4408_10.jpg'),
(N'Quảng trường Đại Đoàn kết Pleiku', N'Thành phố Pleiku', N'Gia Lai', N'Việt Nam', N'Thành phố trên cao nguyên, với biển hồ T''Nưng và văn hóa Tây Nguyên đặc sắc', 13.988458, 107.990858, N'https://sacotravel.com/wp-content/uploads/2022/11/Quang-truong-Dai-Doan-Ket.jpg'),
(N'Làng cà phê Trung Nguyên Buôn Ma Thuột', N'Thành phố Buôn Ma Thuột', N'Đắk Lắk', N'Việt Nam', N'Thủ phủ cà phê Việt Nam, với những thác nước hùng vĩ và bản làng dân tộc', 12.706875, 108.056540, N'https://trungnguyenlegend.com/wp-content/uploads/2015/02/IMG_5080.jpg'),
(N'Biển Hồ Cốc', N'Xã Bông Trang', N'Bà Rịa – Vũng Tàu', N'Việt Nam', N'Bãi biển hoang sơ, nước trong xanh và rừng tràm nguyên sinh', 10.499794, 107.477488, N'https://ik.imagekit.io/tvlk/blog/2022/09/ho-coc-4-1024x768.jpg?tr=dpr-2,w-675'),
(N'Vườn Quốc Gia Cúc Phương', N'Xã Cúc Phương', N'Ninh Bình', N'Việt Nam', N'Vườn quốc gia lâu đời nhất Việt Nam, đa dạng hệ sinh thái và hang động', 20.316859, 105.608312, N'https://vissaihotel.vn/photo/vuon-quoc-gia-cuc-phuong.png');
GO

INSERT INTO ServiceCategories (ServiceTypeName, Description)
VALUES 
    ('Accommodation', 'Services related to lodging, such as hotels, resorts, or homestays.'),
    ('Transport', 'Services for moving people or goods, such as flights, buses, or private cars.'),
    ('Activity', 'Services related to experiences, tours, sightseeing, or classes.');
GO

INSERT INTO SpecialFeatures (Name, Description) VALUES
('Free Wifi', 'Free high-speed internet access.'),
('Free Parking', 'Safe parking lot available for guests.'),
('Card Payment', 'Accepts credit/ATM card payments.'),
('24/7 Support', 'Staff on duty to provide support day and night.'),
('Swimming Pool', 'Outdoor or indoor pool.'),
('Free Breakfast', 'Includes buffet or a la carte breakfast.'),
('Air Conditioning', 'Room is equipped with air conditioning.'),
('Pets Allowed', 'Pet-friendly, allows dogs and cats.'),
('Gym / Fitness', 'Fully equipped gym/fitness room.'),
('Spa & Massage', 'Relaxation and wellness services.'),
('Sea View', 'Room with a view towards the sea.'),
('Door-to-Door Pickup', 'Shuttle service at the hotel or meeting point.'),
('Reclining Seats', 'Comfortable seating that can be reclined.'),
('Drinks/Water', 'Free bottled water served on the vehicle.'),
('USB Charging Port', 'Phone charging ports available at the seats.'),
('Tour Guide', 'Includes a professional tour guide.'),
('Entrance Tickets', 'Includes entrance tickets to scheduled attractions.'),
('Lunch', 'Includes lunch.'),
('Travel Insurance', 'Guests are covered by insurance throughout the trip.');