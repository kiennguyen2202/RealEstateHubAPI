import React, { useState } from 'react';
import styles from './CheckoutPage.module.css';
import { Modal } from 'antd';
import axiosPrivate from '../../api/axiosPrivate';
import MessageProvider from '../../components/MessageProvider';

const paymentMethods = [
  {
    key: 'bank',
    name: 'Chuyển khoản ngân hàng',
    icon: 'https://static.chotot.com/storage/payment_dashboard/bank_transfer_icon.svg',
    desc: 'Chuyển khoản qua Vietcombank, an toàn & tiện lợi',
    info: (
      <div>
        <div><b>Ngân hàng:</b> Vietcombank</div>
        <div><b>Số tài khoản:</b> 0123456789</div>
        <div><b>Chủ tài khoản:</b> Công ty ABC</div>
        <div><b>Nội dung:</b> SĐT + Họ tên + Pro</div>
      </div>
    ),
    qr: './public/download.png',
  },
  {
    key: 'momo',
    name: 'Ví MoMo',
    icon: 'https://static.chotot.com/storage/CT_WEB_PAYMENT_DASHBOARD/assets/icons/momo.svg',
    desc: 'Thanh toán nhanh qua MoMo, nhận ưu đãi hấp dẫn',
    info: (
      <div>
        <div><b>SĐT:</b> 0901234567</div>
        <div><b>Tên:</b> Công ty ABC</div>
      </div>
    ),
    qr: './public/download (1).png',
  },
  {
    key: 'zalo',
    name: 'Ví Zalo Pay',
    icon: 'https://static.chotot.com/storage/CT_WEB_PAYMENT_DASHBOARD/assets/icons/zalo-pay.svg',
    desc: 'Thanh toán qua ZaloPay, tiện lợi, bảo mật',
    info: (
      <div>
        <img src="/momo-qr.png" alt="QR MoMo" style={{ width: 160, marginBottom: 8 }} />
        <div><b>SĐT:</b> 0901234567</div>
        <div><b>Tên:</b> Công ty ABC</div>
      </div>
    ),
    qr: './public/download (2).png',
  },
];

const CheckoutPage = () => {
  const [selectedMethod, setSelectedMethod] = useState('bank');
  const [form, setForm] = useState({ name: '', phone: '', email: '', receipt: null });
  const [submitting, setSubmitting] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);
  const { showMessage, contextHolder } = MessageProvider();

  // Lấy userId từ localStorage (hoặc context nếu có)
  const userId = localStorage.getItem('userId') || '';

  const currentMethod = paymentMethods.find(m => m.key === selectedMethod);

  const handleChange = e => {
    const { name, value, files } = e.target;
    setForm(f => ({ ...f, [name]: files ? files[0] : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    const data = new FormData();
    
    data.append('name', form.name);
    data.append('phone', form.phone);
    data.append('email', form.email);
    data.append('paymentMethod', currentMethod.name);
    if (form.receipt) data.append('receipt', form.receipt);

    try {
      await axiosPrivate.post('/api/payment/confirm', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showMessage.success('Đã gửi xác nhận thanh toán! Admin sẽ kiểm tra và duyệt.');
      setForm({ name: '', phone: '', email: '', receipt: null });
    } catch (err) {
      console.error('Gửi xác nhận thất bại:', err);
      showMessage.error('Gửi xác nhận thất bại. Vui lòng thử lại!');
    }
    setSubmitting(false);
  };

  return (
    <div className={styles.checkoutBg}>
      {contextHolder}
      <div className={styles.checkoutGrid}>
        <div className={styles.methodList}>
          {paymentMethods.map(method => (
            <label
              key={method.key}
              className={
                styles.methodItem +
                (selectedMethod === method.key ? ' ' + styles.methodItemSelected : '')
              }
            >
              <input
                type="radio"
                name="paymentMethod"
                checked={selectedMethod === method.key}
                onChange={() => setSelectedMethod(method.key)}
              />
              <img src={method.icon} alt={method.name} className={styles.methodIcon} />
              <div className={styles.methodInfo}>
                <div className={styles.methodName}>{method.name}</div>
                {method.desc && <div className={styles.methodDesc}>{method.desc}</div>}
              </div>
            </label>
          ))}
        </div>
        <div className={styles.methodDetail}>
          <div className={styles.checkoutHeader}>Thanh toán Gói Pro</div>
          <div className={styles.checkoutInfo}>
            {currentMethod.info}
            <img src={currentMethod.qr} alt="QR" className={styles.qrImg} />
          </div>
          <form className={styles.checkoutForm} onSubmit={handleSubmit}>
            <input name="name" placeholder="Họ tên" required value={form.name} onChange={handleChange} />
            <input name="phone" placeholder="Số điện thoại" required value={form.phone} onChange={handleChange} />
            <input name="email" placeholder="Email" required value={form.email} onChange={handleChange} />
            <input name="receipt" type="file" accept="image/*" onChange={handleChange} />
            <button type="submit" disabled={submitting}>{submitting ? 'Đang gửi...' : 'Xác nhận thanh toán'}</button>
          </form>
          <div className={styles.checkoutFooter}>
            Hotline hỗ trợ: <a href="tel:0123456789">0123456789</a>
          </div>
        </div>
      </div>
      <Modal open={!!previewImg} footer={null} onCancel={() => setPreviewImg(null)} centered>
        <img src={previewImg} alt="receipt-large" style={{ width: '100%' }} />
      </Modal>
    </div>
  );
};

export default CheckoutPage; 