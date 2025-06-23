import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './HeroBanner.css';

const slides = [
  {
    image: '/1000_F_509365220_oNhwwiKfwkIkY8mgkSIWRNnbzzs4H1P8.jpg',
    highlight: 'Nền tảng kết nối',
    title: 'Tìm nhà dễ dàng, an tâm giao dịch',
    desc: 'Khám phá hàng ngàn bất động sản uy tín, hỗ trợ tận tâm từ A-Z.',
    time: 'Hỗ trợ 24/7',
    date: 'Đăng tin miễn phí',
  },
  {
    image: '/1000_F_650048974_qV9nvGZxunByUDb5QRTvgSn5E8Gpwa5V.jpg',
    title: 'Dự án nổi bật',
    desc: 'Khám phá các dự án bất động sản hot nhất hiện nay!',
    highlight: 'Dự án mới',    
    date: 'Hàng ngày',
  },
  {
    image: '/1000_F_1246140281_CF8itI5p8oQZxYNYilWV2gTsU5mFKco0.jpg',
    highlight: 'Đăng tin nhanh chóng',
    title: 'Bán & cho thuê bất động sản chỉ với 1 click',
    desc: 'Tiếp cận hàng ngàn khách hàng tiềm năng mỗi ngày, thao tác đơn giản, hiệu quả tối đa.',
    time: 'Đăng tin mọi lúc',
    date: 'Duyệt tin nhanh',
  },
  {
    image: '/1000_F_1417735323_n7QsL3ht0qJWAixYnqTOy55HG4N0IfZ0.jpg',
    title: 'Mua bán & cho thuê dễ dàng',
    desc: 'Đăng tin miễn phí, tiếp cận hàng ngàn khách hàng!',
    highlight: 'Đăng tin ngay',
    time: '24/7',
    date: 'Hỗ trợ liên tục',
  },
];

const HeroBanner = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 700,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3500,
    arrows: true,
    pauseOnHover: true,
  };

  return (
    <div className="hero-banner">
      <Slider {...settings}>
        {slides.map((slide, idx) => (
          <div className="hero-slide hero-slide-bg" key={idx}>
            <img className="hero-slide-img-bg" src={slide.image} alt={slide.title} />
            <div className="hero-slide-overlay" />
            <div className="hero-slide-content-overlay">
              <div className="hero-slide-highlight">{slide.highlight}</div>
              <h2 className="hero-slide-title">{slide.title}</h2>
              <p className="hero-slide-desc">{slide.desc}</p>
              <div className="hero-slide-info">
                {slide.time && <span className="hero-slide-time">{slide.time}</span>}
                {slide.date && <span className="hero-slide-date">{slide.date}</span>}
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default HeroBanner; 