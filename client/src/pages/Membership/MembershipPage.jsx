import React, { useState } from 'react';
import styles from './MembershipPage.module.css';
import { useNavigate } from 'react-router-dom';

const Check = () => <span className={styles.checkIcon}>✔️</span>;
const Cross = () => <span className={styles.crossIcon}>✖️</span>;

const proBenefits = [
  {
    icon: <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#ff9800"/><path d="M8 12.5l2.5 2.5L16 9" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: 'Tiết kiệm chi phí vượt trội',
    desc: 'Giảm đến 86% so với đăng lẻ từng tin, tối ưu ngân sách cho môi giới.'
  },
  {
    icon: <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="10" rx="2" fill="#ff9800"/><path d="M8 11h8M8 15h4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>,
    title: 'Đăng nhiều tin, hiển thị lâu',
    desc: 'Tăng số lượng tin đăng/tháng, thời gian hiển thị dài, tiếp cận nhiều khách hơn.'
  },
  {
    icon: <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ff9800"/><path d="M12 7v5l4 2" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>,
    title: 'Ưu tiên hiển thị, badge uy tín',
    desc: 'Tin Pro được ưu tiên, có badge môi giới uy tín, tăng độ tin cậy.'
  },
  {
    icon: <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="8" fill="#ff9800"/><path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>,
    title: 'Quản lý & hỗ trợ chuyên nghiệp',
    desc: 'Công cụ quản lý tin, hỗ trợ duyệt nhanh, chăm sóc khách hàng tận tâm.'
  },
];



const plans = [
  {
    key: 'basic',
    name: 'Gói Thường',
    icon: <span className={styles.planIcon} style={{background:'#1abc60'}}><svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M3 10.5L12 4l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10.5z" fill="#fff"/><circle cx="8" cy="17" r="2" fill="#1abc60"/><rect x="6" y="15" width="4" height="4" rx="2" fill="#fff"/></svg></span>,
    desc: 'Dành cho người dùng thông thường',
    price: 'Miễn phí',
    priceNote: '',
    save: '',
    features: [
      { label: 'Đăng tối đa 5 tin/tháng', ok: true },
      { label: 'Tin hiển thị 7 ngày', ok: true },
      { label: 'Không có badge môi giới', ok: false },
      { label: 'Không ưu tiên hiển thị', ok: false },
    ],
    button: { label: 'Sử dụng', style: 'basic' },
    highlight: false,
  },
  {
    key: 'pro',
    name: 'Gói Pro',
    icon: <span className={styles.planIcon} style={{background:'#ff9800'}}><svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M3 10.5L12 4l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10.5z" fill="#fff"/><circle cx="12" cy="17" r="2" fill="#ff9800"/><rect x="10" y="15" width="4" height="4" rx="2" fill="#fff"/></svg></span>,
    desc: 'Dành cho môi giới chuyên nghiệp',
    price: '500.000đ',
    priceNote: '',
    save: '',
    features: [
      { label: 'Đăng tối đa 100 tin/tháng', ok: true },
      { label: 'Tin hiển thị 60 ngày', ok: true },
      { label: 'Có badge môi giới uy tín', ok: true },
      { label: 'Ưu tiên hiển thị', ok: true },
    ],
    button: { label: 'Đăng ký gói Pro', style: 'pro' },
    highlight: true,
    badge: 'Khuyên dùng',
  },
];

const heroBullets = [
  {
    icon: <span style={{color:'#ff9800',fontSize:'1.2em',marginRight:6}}>★</span>,
    text: 'Tiết kiệm đến 86% chi phí đăng tin, tối đa hiệu quả đầu tư',
  },
  {
    icon: <span style={{color:'#ff9800',fontSize:'1.2em',marginRight:6}}>★</span>,
    text: 'Tiếp cận hàng nghìn khách hàng tiềm năng mỗi ngày',
  },
  {
    icon: <span style={{color:'#ff9800',fontSize:'1.2em',marginRight:6}}>★</span>,
    text: 'Quản lý tin đăng, khách hàng và hiệu suất kinh doanh dễ dàng',
  },
];

const HeroSection = ({ onContactClick, onBuyClick }) => (
  <section className={styles.hero2Section}>
    <div className={styles.hero2Left}>
      <div className={styles.hero2Badge}>GÓI PRO</div>
      <div className={styles.hero2Title}>
        Đột phá doanh số cùng Gói Pro – Đăng tin BĐS chuyên nghiệp, tối ưu chi phí!
      </div>
      <ul className={styles.hero2Bullets}>
        {heroBullets.map((b,i) => (
          <li key={i}>{b.icon}{b.text}</li>
        ))}
      </ul>
      <div className={styles.hero2BtnRow}>
        <button className={styles.hero2BtnMain} onClick={onBuyClick}>Mua ngay</button>
        <button className={styles.hero2BtnOutline} onClick={onContactClick}>Tôi cần tư vấn</button>
      </div>
    </div>
    <div className={styles.hero2Right}>
      <div className={styles.hero2ImgMain} style={{ position: 'relative' }}>
        <div className={styles.imgBackgroundOverlay}></div>
        <img
          src="https://static.chotot.com/storage/default_images/pty/subscription_landing_page/pty-sub-value.png"
          alt="Gói Pro"
          style={{
            width: '100%',
            height: '100%',
            maxWidth: '500px',
            maxHeight: '500px',
            objectFit: 'contain',
            borderRadius: '32px',
            boxShadow: '0 12px 48px rgba(255,152,0,0.18)',
            position: 'relative',
            zIndex: 1
          }}
        />
      </div>
    </div>
  </section>
);

const ContactForm = () => {
  const [form, setForm] = React.useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    
    setTimeout(() => {
      setSent(true);
      setSubmitting(false);
    }, 1200);
  };

  if (sent) return <div className={styles.contactFormSent}>Cảm ơn bạn đã gửi thông tin! Chúng tôi sẽ liên hệ tư vấn sớm nhất.</div>;

  return (
    <form className={styles.contactForm} onSubmit={handleSubmit}>
      <input name="name" type="text" placeholder="Họ và tên (*)" required value={form.name} onChange={handleChange} />
      <input name="phone" type="text" placeholder="Số điện thoại (*)" required value={form.phone} onChange={handleChange} />
      <input name="email" type="email" placeholder="Email" required value={form.email} onChange={handleChange} />
      <textarea name="message" placeholder="Mô tả thêm về nhu cầu đăng tin và sử dụng dịch vụ..." rows={4} value={form.message} onChange={handleChange} />
      <div className={styles.contactFormNote}>
        Bằng việc gửi thông tin, bạn đồng ý với <a href="#" target="_blank" rel="noopener noreferrer">Chính sách bảo mật</a> của RealHub và cho phép chúng tôi liên hệ tư vấn.
      </div>
      <button type="submit" disabled={submitting}>{submitting ? 'Đang gửi...' : 'Gửi thông tin'}</button>
    </form>
  );
};

const MembershipPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('bank');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    transactionId: '',
    receipt: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const contactRef = React.useRef(null);
  const plansRef = React.useRef(null);
  const navigate = useNavigate();

  const handleShowForm = () => setShowForm(true);
  

  const handleChange = e => {
    const { name, value, files } = e.target;
    setForm(f => ({
      ...f,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    const data = new FormData();
    data.append('name', form.name);
    data.append('phone', form.phone);
    data.append('transactionId', form.transactionId);
    data.append('paymentMethod', selectedMethod);
    data.append('qrImage', currentMethod.qr);
    if (form.receipt) data.append('receipt', form.receipt);
    try {
      await fetch('/api/payment/confirm', {
        method: 'POST',
        body: data,
        credentials: 'include'
      });
      alert('Đã gửi xác nhận thanh toán! Admin sẽ kiểm tra và duyệt.');
      setShowForm(false);
      setForm({ name: '', phone: '', transactionId: '', receipt: null });
    } catch {
      alert('Gửi xác nhận thất bại. Vui lòng thử lại!');
    }
    setSubmitting(false);
  };

  const handleContactClick = () => {
    if (contactRef.current) contactRef.current.scrollIntoView({behavior:'smooth'});
  };
  const handleBuyClick = () => {
    if (plansRef.current) plansRef.current.scrollIntoView({behavior:'smooth'});
  };

  return (
    <div className={styles.darkBg}>
      {/* Section hero mới */}
      <HeroSection onContactClick={handleContactClick} onBuyClick={handleBuyClick} />

      {/* Section lợi ích Pro */}
      <section className={styles.benefitSection}>
        <div className={styles.benefitTitle}>Tại sao nên dùng <span className={styles.heroHighlight}>Gói Pro?</span></div>
        <div className={styles.benefitList}>
          {proBenefits.map((b, i) => (
            <div className={styles.benefitItem} key={i}>
              <div className={styles.benefitIcon}>{b.icon}</div>
              <div>
                <div className={styles.benefitItemTitle}>{b.title}</div>
                <div className={styles.benefitItemDesc}>{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bảng so sánh gói */}
      <div className={styles.pricingTable} ref={plansRef}>
        {plans.map((plan, idx) => (
          <div
            key={plan.key}
            className={
              styles.planCard +
              (plan.highlight ? ' ' + styles.planCardHighlight : '')
            }
          >
            {plan.badge && <div className={styles.planBadge}>{plan.badge}</div>}
            <div className={styles.planHeader}>
              {plan.icon}
              <div>
                <div className={styles.planName}>{plan.name}</div>
                <div className={styles.planDesc}>{plan.desc}</div>
              </div>
            </div>
            <div className={styles.planPriceSection}>
              <span className={styles.planPrice}>{plan.price}</span>
              <span className={styles.planPriceNote}>{plan.priceNote}</span>
            </div>
            {plan.save && <div className={styles.planSave}>{plan.save}</div>}
            <div className={styles.planBtnWrap}>
              <button
                className={styles['planBtn' + (plan.highlight ? 'Pro' : plan.key.charAt(0).toUpperCase() + plan.key.slice(1))]}
                onClick={() => navigate('/checkout')}
              >
                {plan.button.label}
              </button>
            </div>
            <ul className={styles.planFeatures}>
              {plan.features.map((f, i) => (
                <li key={i} className={f.ok ? styles.featureOk : styles.featureNo}>
                  {f.ok ? <Check /> : <Cross />} {f.label}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Section liên hệ mới */}
      <section className={styles.contactSectionForm} ref={contactRef}>
        <div className={styles.contactFormLeft}>
          <div className={styles.contactFormBg} />
          <div className={styles.contactFormLeftContent}>
            <div className={styles.contactFormTitle}>Bạn cần tư vấn thêm về Gói Pro?</div>
            <div className={styles.contactFormHotline}>Cần tư vấn thêm?<br />
              Nhấn để gọi Hotline <a href="tel:0123456789" className={styles.contactFormHotlineLink}>0123456789</a><br />
              <span className={styles.contactFormTime}>(Giờ làm việc: 9:00 – 18:00 T2-T6)</span>
            </div>
          </div>
        </div>
        <div className={styles.contactFormRight}>
          <ContactForm />
        </div>
      </section>


    </div>
  );
};

export default MembershipPage;