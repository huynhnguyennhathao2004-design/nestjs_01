param(
  [Parameter(Mandatory = $true)]
  [string]$Token,

  [string]$BaseUrl =
    "http://localhost:3000"
)

$ErrorActionPreference = "Stop"

$headers = @{
  Authorization =
    "Bearer $Token"

  Accept =
    "application/json"
}

function Write-TestStep {
  param(
    [string]$Message
  )

  Write-Host ""
  Write-Host "=================================================="
  Write-Host $Message -ForegroundColor Cyan
  Write-Host "=================================================="
}

function Assert-True {
  param(
    [bool]$Condition,
    [string]$Message
  )

  if (-not $Condition) {
    throw "FAILED: $Message"
  }

  Write-Host "PASS: $Message" `
    -ForegroundColor Green
}

function Invoke-AdminApi {
  param(
    [Parameter(Mandatory = $true)]
    [ValidateSet(
      "GET",
      "POST",
      "PATCH",
      "DELETE"
    )]
    [string]$Method,

    [Parameter(Mandatory = $true)]
    [string]$Path,

    [object]$Body = $null
  )

  $parameters = @{
    Method =
      $Method

    Uri =
      "$BaseUrl$Path"

    Headers =
      $headers
  }

  if ($null -ne $Body) {
    $parameters.ContentType =
      "application/json"

    $parameters.Body =
      $Body |
      ConvertTo-Json -Depth 20
  }

  return Invoke-RestMethod @parameters
}

$destinationId = $null

try {
  Write-TestStep `
    "1. Kiểm tra dữ liệu cho form"

  $formOptions =
    Invoke-AdminApi `
      -Method GET `
      -Path "/api/admin/destinations/form-options"

  Assert-True `
    -Condition (
      $null -ne $formOptions.data
    ) `
    -Message "API form-options trả về dữ liệu."

  $province =
    $formOptions.data.regions |
    ForEach-Object {
      $_.provinces
    } |
    Select-Object -First 1

  $category =
    $formOptions.data.categories |
    Select-Object -First 1

  Assert-True `
    -Condition (
      $null -ne $province
    ) `
    -Message "Tìm thấy tỉnh hoặc thành phố."

  Assert-True `
    -Condition (
      $null -ne $category
    ) `
    -Message "Tìm thấy danh mục hoạt động."

$suffix = [Guid]::NewGuid().ToString("N").Substring(0, 8)

  Write-TestStep `
    "2. Tạo địa điểm thử nghiệm"

  $createDestinationBody = @{
    name =
      "Địa điểm kiểm thử $suffix"

    slug =
      "dia-diem-kiem-thu-$suffix"

    provinceId =
      $province.id

    primaryCategoryId =
      $category.id

    categoryIds =
      @(
        $category.id
      )

    shortDescription =
      "Địa điểm được tạo tự động để kiểm thử hệ thống quản trị."

    description =
      "Đây là nội dung kiểm thử tự động cho chức năng quản lý địa điểm du lịch."

    bestTravelTime =
      "Quanh năm"

    mapQuery =
      "Việt Nam"

    latitude =
      10.7769

    longitude =
      106.7009

    metaTitle =
      "Địa điểm kiểm thử $suffix"

    metaDescription =
      "Nội dung SEO kiểm thử."
  }

  $createdDestination =
    Invoke-AdminApi `
      -Method POST `
      -Path "/api/admin/destinations" `
      -Body $createDestinationBody

  $destinationId =
    $createdDestination.data.id

  Assert-True `
    -Condition (
      -not [string]::IsNullOrWhiteSpace(
        $destinationId
      )
    ) `
    -Message "Tạo địa điểm và nhận được UUID."

  Assert-True `
    -Condition (
      $createdDestination.data.status -eq
      "DRAFT"
    ) `
    -Message "Địa điểm mới ở trạng thái DRAFT."

  Write-Host `
    "Destination ID: $destinationId" `
    -ForegroundColor Yellow

  Write-TestStep `
  "3. Cập nhật thông tin địa điểm"

$expectedUpdatedName =
  "Địa điểm kiểm thử đã cập nhật $suffix"

$expectedUpdatedDescription =
  "Nội dung giới thiệu đã được cập nhật bằng bài kiểm thử tự động."

$updatedDestination =
  Invoke-AdminApi `
    -Method PATCH `
    -Path "/api/admin/destinations/$destinationId" `
    -Body @{
      name =
        $expectedUpdatedName

      shortDescription =
        "Mô tả ngắn đã được cập nhật."

      description =
        $expectedUpdatedDescription
    }

Write-Host ""
Write-Host "Phản hồi API cập nhật:" `
  -ForegroundColor DarkCyan

$updatedDestination |
  ConvertTo-Json -Depth 20 |
  Write-Host

$updatedData =
  $updatedDestination.data

# Hỗ trợ trường hợp response bị bọc thêm
# một lớp data bởi interceptor.
if (
  $null -ne $updatedData -and
  $null -ne $updatedData.data
) {
  $updatedData =
    $updatedData.data
}

$actualUpdatedName =
  [string]$updatedData.name

$actualUpdatedDescription =
  [string]$updatedData.description

Write-Host ""
Write-Host "Tên mong đợi: $expectedUpdatedName"
Write-Host "Tên thực tế  : $actualUpdatedName"

Assert-True `
  -Condition (
    $actualUpdatedName -eq
    $expectedUpdatedName
  ) `
  -Message "Cập nhật tên địa điểm thành công."

Assert-True `
  -Condition (
    $actualUpdatedDescription -eq
    $expectedUpdatedDescription
  ) `
  -Message "Cập nhật nội dung địa điểm thành công."
  Write-TestStep `
    "4. Thêm hình ảnh"

  $createdImage =
    Invoke-AdminApi `
      -Method POST `
      -Path "/api/admin/destinations/$destinationId/images" `
      -Body @{
        url =
          "/assets/images/bg-vietnam.jpg"

        altText =
          "Ảnh kiểm thử địa điểm"

        imageType =
          "COVER"

        sortOrder =
          0

        isActive =
          $true
      }

  $imageId =
    $createdImage.data.id

  Assert-True `
    -Condition (
      -not [string]::IsNullOrWhiteSpace(
        $imageId
      )
    ) `
    -Message "Thêm hình ảnh thành công."

  $updatedImage =
    Invoke-AdminApi `
      -Method PATCH `
      -Path "/api/admin/destinations/$destinationId/images/$imageId" `
      -Body @{
        altText =
          "Ảnh kiểm thử đã cập nhật"

        sortOrder =
          1
      }

  Assert-True `
    -Condition (
      $updatedImage.data.altText -eq
      "Ảnh kiểm thử đã cập nhật"
    ) `
    -Message "Cập nhật hình ảnh thành công."

  Write-TestStep `
    "5. Thêm đặc điểm nổi bật"

  $createdFeature =
    Invoke-AdminApi `
      -Method POST `
      -Path "/api/admin/destinations/$destinationId/features" `
      -Body @{
        title =
          "Đặc điểm kiểm thử"

        content =
          "Nội dung đặc điểm được tạo bởi bài kiểm thử tự động."

        icon =
          "✨"

        sortOrder =
          0
      }

  $featureId =
    $createdFeature.data.id

  Assert-True `
    -Condition (
      -not [string]::IsNullOrWhiteSpace(
        $featureId
      )
    ) `
    -Message "Thêm đặc điểm nổi bật thành công."

  $updatedFeature =
    Invoke-AdminApi `
      -Method PATCH `
      -Path "/api/admin/destinations/$destinationId/features/$featureId" `
      -Body @{
        title =
          "Đặc điểm kiểm thử đã cập nhật"

        sortOrder =
          1
      }

  Assert-True `
    -Condition (
      $updatedFeature.data.title -like
      "*đã cập nhật*"
    ) `
    -Message "Cập nhật đặc điểm thành công."

  Write-TestStep `
    "6. Thêm điểm khám phá"

  $createdAttraction =
    Invoke-AdminApi `
      -Method POST `
      -Path "/api/admin/destinations/$destinationId/attractions" `
      -Body @{
        name =
          "Điểm khám phá kiểm thử"

        description =
          "Mô tả điểm khám phá kiểm thử."

        address =
          "Việt Nam"

        mapQuery =
          "Việt Nam"

        latitude =
          10.7769

        longitude =
          106.7009

        imageUrl =
          "/assets/images/bg-vietnam.jpg"

        imageAlt =
          "Ảnh điểm khám phá kiểm thử"

        sortOrder =
          0

        isActive =
          $true
      }

  $attractionId =
    $createdAttraction.data.id

  Assert-True `
    -Condition (
      -not [string]::IsNullOrWhiteSpace(
        $attractionId
      )
    ) `
    -Message "Thêm điểm khám phá thành công."

  $updatedAttraction =
    Invoke-AdminApi `
      -Method PATCH `
      -Path "/api/admin/destinations/$destinationId/attractions/$attractionId" `
      -Body @{
        name =
          "Điểm khám phá đã cập nhật"

        sortOrder =
          1
      }

  Assert-True `
    -Condition (
      $updatedAttraction.data.name -like
      "*đã cập nhật*"
    ) `
    -Message "Cập nhật điểm khám phá thành công."

  Write-TestStep `
    "7. Thêm món ăn gợi ý"

  $createdFood =
    Invoke-AdminApi `
      -Method POST `
      -Path "/api/admin/destinations/$destinationId/foods" `
      -Body @{
        name =
          "Món ăn kiểm thử"

        description =
          "Mô tả món ăn kiểm thử."

        imageUrl =
          "/assets/images/bg-vietnam.jpg"

        imageAlt =
          "Ảnh món ăn kiểm thử"

        priceMin =
          30000

        priceMax =
          60000

        priceNote =
          "Giá tham khảo"

        suggestedArea =
          "Khu vực trung tâm"

        sortOrder =
          0

        isActive =
          $true
      }

  $foodId =
    $createdFood.data.id

  Assert-True `
    -Condition (
      -not [string]::IsNullOrWhiteSpace(
        $foodId
      )
    ) `
    -Message "Thêm món ăn thành công."

  $updatedFood =
    Invoke-AdminApi `
      -Method PATCH `
      -Path "/api/admin/destinations/$destinationId/foods/$foodId" `
      -Body @{
        name =
          "Món ăn kiểm thử đã cập nhật"

        priceMin =
          40000

        priceMax =
          80000

        sortOrder =
          1
      }

  Assert-True `
    -Condition (
      $updatedFood.data.priceMin -eq
      40000
    ) `
    -Message "Cập nhật món ăn thành công."

  Write-TestStep `
    "8. Kiểm tra API chi tiết"

  $detail =
    Invoke-AdminApi `
      -Method GET `
      -Path "/api/admin/destinations/$destinationId"

  Assert-True `
    -Condition (
      $detail.data.images.Count -ge 1
    ) `
    -Message "API chi tiết trả về hình ảnh."

  Assert-True `
    -Condition (
      $detail.data.features.Count -ge 1
    ) `
    -Message "API chi tiết trả về đặc điểm."

  Assert-True `
    -Condition (
      $detail.data.attractions.Count -ge 1
    ) `
    -Message "API chi tiết trả về điểm khám phá."

  Assert-True `
    -Condition (
      $detail.data.foods.Count -ge 1
    ) `
    -Message "API chi tiết trả về món ăn."

  Write-TestStep `
    "9. Kiểm tra xuất bản và nổi bật"

  $published =
    Invoke-AdminApi `
      -Method PATCH `
      -Path "/api/admin/destinations/$destinationId/status" `
      -Body @{
        status =
          "PUBLISHED"
      }

  Assert-True `
    -Condition (
      $published.data.status -eq
      "PUBLISHED"
    ) `
    -Message "Xuất bản địa điểm thành công."

  $featured =
    Invoke-AdminApi `
      -Method PATCH `
      -Path "/api/admin/destinations/$destinationId/featured" `
      -Body @{
        isFeatured =
          $true
      }

  Assert-True `
    -Condition (
      $featured.data.isFeatured -eq
      $true
    ) `
    -Message "Đánh dấu nổi bật thành công."

  $hidden =
    Invoke-AdminApi `
      -Method PATCH `
      -Path "/api/admin/destinations/$destinationId/status" `
      -Body @{
        status =
          "HIDDEN"
      }

  Assert-True `
    -Condition (
      $hidden.data.status -eq
      "HIDDEN"
    ) `
    -Message "Ẩn địa điểm thành công."

  Assert-True `
    -Condition (
      $hidden.data.isFeatured -eq
      $false
    ) `
    -Message "Địa điểm bị ẩn tự động bỏ nổi bật."

  Write-TestStep `
    "10. Kiểm tra xóa mềm và khôi phục"

  $softDeleted =
    Invoke-AdminApi `
      -Method DELETE `
      -Path "/api/admin/destinations/$destinationId"

  Assert-True `
    -Condition (
      $null -ne
      $softDeleted.data.deletedAt
    ) `
    -Message "Địa điểm được chuyển vào thùng rác."

  $restored =
    Invoke-AdminApi `
      -Method PATCH `
      -Path "/api/admin/destinations/$destinationId/restore"

  Assert-True `
    -Condition (
      $null -eq
      $restored.data.deletedAt
    ) `
    -Message "Khôi phục địa điểm thành công."

  Assert-True `
    -Condition (
      $restored.data.status -eq
      "DRAFT"
    ) `
    -Message "Địa điểm khôi phục về DRAFT."

  Write-TestStep `
    "11. Xóa dữ liệu con"

  Invoke-AdminApi `
    -Method DELETE `
    -Path "/api/admin/destinations/$destinationId/images/$imageId" |
    Out-Null

  Invoke-AdminApi `
    -Method DELETE `
    -Path "/api/admin/destinations/$destinationId/features/$featureId" |
    Out-Null

  Invoke-AdminApi `
    -Method DELETE `
    -Path "/api/admin/destinations/$destinationId/attractions/$attractionId" |
    Out-Null

  Invoke-AdminApi `
    -Method DELETE `
    -Path "/api/admin/destinations/$destinationId/foods/$foodId" |
    Out-Null

  Write-Host `
    "PASS: Xóa dữ liệu con thành công." `
    -ForegroundColor Green

  Write-TestStep `
    "12. Xóa vĩnh viễn địa điểm thử nghiệm"

  Invoke-AdminApi `
    -Method DELETE `
    -Path "/api/admin/destinations/$destinationId" |
    Out-Null

  $hardDeleted =
    Invoke-AdminApi `
      -Method DELETE `
      -Path "/api/admin/destinations/$destinationId/permanent"

  Assert-True `
    -Condition (
      $hardDeleted.data.id -eq
      $destinationId
    ) `
    -Message "Xóa vĩnh viễn địa điểm thành công."

  $destinationId = $null

  Write-Host ""
  Write-Host "TOÀN BỘ KIỂM THỬ ĐÃ THÀNH CÔNG." `
    -ForegroundColor Green
} catch {
  Write-Host ""
  Write-Host "TEST FAILED:" `
    -ForegroundColor Red

  Write-Host $_.Exception.Message `
    -ForegroundColor Red

  throw
} finally {
  if ($destinationId) {
    Write-Host ""

    Write-Warning `
      "Trying to clean up test destination: $destinationId"

    try {
      $existing =
        Invoke-AdminApi `
          -Method GET `
          -Path "/api/admin/destinations/$destinationId"

      if (
        $null -eq
        $existing.data.deletedAt
      ) {
        Invoke-AdminApi `
          -Method DELETE `
          -Path "/api/admin/destinations/$destinationId" |
          Out-Null
      }

      Invoke-AdminApi `
        -Method DELETE `
        -Path "/api/admin/destinations/$destinationId/permanent" |
        Out-Null

      Write-Host `
        "Test data cleanup completed." `
        -ForegroundColor Yellow
    } catch {
      Write-Warning `
        "Could not clean up test data automatically. Destination ID: $destinationId"
    }
  }
}