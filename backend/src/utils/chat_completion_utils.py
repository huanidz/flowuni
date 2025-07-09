from datetime import datetime, timedelta


def get_current_time(timezone: int) -> str:
    """
    Lấy thời gian hiện tại theo múi giờ cụ thể và trả về dưới dạng chuỗi cụ thể: Thứ X ngày dd tháng mm năm yyyy, hh giờ mm phút ss giây.

    :param timezone: Múi giờ (số nguyên, ví dụ: 7 cho UTC+7).
    :return: Chuỗi thời gian cụ thể.
    """
    # Lấy thời gian hiện tại UTC
    now_utc = datetime.utcnow()

    # Điều chỉnh theo múi giờ
    now_local = now_utc + timedelta(hours=timezone)

    # Định dạng thời gian cụ thể
    days_of_week = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"]
    day_of_week = days_of_week[now_local.weekday()]
    formatted_time = (
        f"{day_of_week} ngày {now_local.day} tháng {now_local.month} năm {now_local.year}, "
        f"{now_local.hour} giờ {now_local.minute} phút {now_local.second} giây (giờ Việt Nam)"
    )

    return formatted_time
