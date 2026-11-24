# DSTExspectamusSolver
Trình giải đố cho Don't Starve Together Exspectamus

<div align="center">

| [English](README.md) | **Tiếng Việt**
| --- | --- |

</div>

Bài đăng gốc bilibili: https://www.bilibili.com/opus/1183236002302394400

Tác giả: [Krayers](https://space.bilibili.com/177173532)

Mã giải đố tự động đầy đủ: [script.js](script.js)

# Hướng dẫn sử dụng

## Trên PC

1. Đăng nhập vào tài khoản Klei của bạn tại https://accounts.klei.com.
2. Truy cập https://exspectamus.dontstarvetogether.com.
3. Nhấn F12 để mở Bảng điều khiển dành cho Nhà phát triển (Developer Console).
4. Sao chép và dán [**ĐOẠN MÃ**](#đoạn-mã) bên dưới vào ô nhập lệnh trong bảng điều khiển, sau đó nhấn Enter (**↵**).

## Dành cho người dùng điện thoại

> [!IMPORTANT]
> ### **⚠️ Lưu ý dành cho người dùng điện thoại**
>
> 1. Việc thực thi mã Javascript:
>
> Hãy đảm bảo thêm `javascript:` vào ngay đầu đoạn mã đã sao chép trong thanh địa chỉ. Nếu không, trình duyệt có thể hiểu đoạn mã là nội dung tìm kiếm thay vì thực thi nó trên trang hiện tại.
>
> Đôi khi, ngay cả khi đã thêm `javascript:`, trình duyệt vẫn có thể tìm kiếm đoạn mã thay vì thực thi nó. Đây là hành vi không nhất quán của trình duyệt và có thể khác nhau tùy theo trình duyệt bạn đang sử dụng.
>
> Bạn cũng có thể lưu đoạn mã dưới dạng dấu trang chứa mã JavaScript (bookmarklet) và chạy nó từ danh sách dấu trang. Tuy nhiên, cách này cũng có những hạn chế tương tự như khi nhập mã trực tiếp vào thanh địa chỉ.
>
> Nếu trình duyệt tìm kiếm đoạn mã thay vì thực thi, chỉ cần quay lại trang Exspectamus và thử lại.
>
> **Hãy kiên nhẫn và đừng vội bỏ cuộc!** Có thể bạn sẽ phải thử vài lần trước khi thực hiện thành công.
>
> 2. **<ins>Giữ màn hình của thiết bị luôn bật tránh ngắt quãng quá giải tự động</ins>**

Trình duyệt trên điện thoại không có sẵn Bảng điều khiển dành cho Nhà phát triển, vì vậy bạn cần sử dụng một cách khác để thực hiện.

1. Đăng nhập vào tài khoản Klei của bạn tại https://accounts.klei.com.
2. Truy cập https://exspectamus.dontstarvetogether.com.
3. Sao chép [**ĐOẠN MÃ**](#đoạn-mã) bên dưới và dán vào thanh địa chỉ. Thêm `javascript:` vào đầu đoạn mã vừa dán, sau đó nhấn Enter (**↵**) hoặc nút Go (**→**).

#### Theo dõi tiến trình tự động giải đố

Nếu bạn cần một "bảng điều khiển (console)" để theo dõi tiến trình giải đố, bạn có thể sử dụng Eruda.

1. Đăng nhập vào tài khoản Klei của bạn tại https://accounts.klei.com.
2. Truy cập https://exspectamus.dontstarvetogether.com.
3. Sao chép [**Mã Eruda**](#mã-eruda) và dán vào thanh địa chỉ. Thêm `javascript:` vào đầu đoạn mã vừa dán, sau đó nhấn Enter (**↵**) hoặc nút Go (**→**).
4. Nhấn vào biểu tượng Eruda (hình bánh răng màu xám) ở góc dưới bên phải để mở bảng điều khiển của Eruda.
5. Sao chép [**ĐOẠN MÃ**](#đoạn-mã) và dán vào ô nhập lệnh trong bảng điều khiển (được đánh dấu bằng ký hiệu **>** màu xanh dương), sau đó nhấn Enter (**↵**).

### Mã Eruda

```javascript
(async function(){let r=await fetch("//cdn.jsdelivr.net/npm/eruda");if(r.ok){(new Function(await r.text()))();eruda.init();}})();
```

# ĐOẠN MÃ

(Nút sao chép nằm ở bên phải)
```javascript
(async function(){let r=await fetch("//raw.githubusercontent.com/SITUVNgcd/DSTExspectamusSolver/main/script.js");if(r.ok){(new Function(await r.text()))();auto();}})();
```

