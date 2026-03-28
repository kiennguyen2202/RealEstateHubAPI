import { useState, useMemo, useEffect } from 'react';
import './MortgageCalculator.css';

const MortgageCalculator = ({ propertyPrice = 0 }) => {
  const [homePrice, setHomePrice] = useState(propertyPrice / 1000000000 || 2.3); // Tỷ VND
  const [loanPercent, setLoanPercent] = useState(80); // %
  const [loanYears, setLoanYears] = useState(20); // năm
  const [interestRate, setInterestRate] = useState(8); // %/năm
  const [paymentMethod, setPaymentMethod] = useState('decreasing'); // decreasing | fixed
  const [hoveredSegment, setHoveredSegment] = useState(null); // 'downpayment' | 'principal' | 'interest'
  const [animationProgress, setAnimationProgress] = useState(0);

  // Animation effect
  useEffect(() => {
    setAnimationProgress(0);
    const timer = setTimeout(() => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 2;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
        }
        setAnimationProgress(progress);
      }, 10);
      return () => clearInterval(interval);
    }, 100);
    return () => clearTimeout(timer);
  }, [homePrice, loanPercent, loanYears, interestRate, paymentMethod]);

  // Tính toán khoản vay
  const calculations = useMemo(() => {
    const totalPrice = homePrice * 1000000000; // VND
    const downPayment = totalPrice * (1 - loanPercent / 100);
    const loanAmount = totalPrice * (loanPercent / 100);
    const monthlyRate = interestRate / 100 / 12;
    const totalMonths = loanYears * 12;

    let schedule = [];
    let totalInterest = 0;
    let firstMonthPayment = 0;

    if (paymentMethod === 'decreasing') {
      // Dư nợ giảm dần - gốc cố định, lãi giảm dần
      const monthlyPrincipal = loanAmount / totalMonths;
      let remainingBalance = loanAmount;

      for (let i = 1; i <= totalMonths; i++) {
        const interest = remainingBalance * monthlyRate;
        const totalPayment = monthlyPrincipal + interest;
        
        schedule.push({
          month: i,
          openingBalance: remainingBalance,
          interest: interest,
          principal: monthlyPrincipal,
          closingBalance: remainingBalance - monthlyPrincipal,
          totalPayment: totalPayment
        });

        totalInterest += interest;
        remainingBalance -= monthlyPrincipal;
        if (i === 1) firstMonthPayment = totalPayment;
      }
    } else {
      // Thanh toán đều hàng tháng (PMT)
      const pmt = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                  (Math.pow(1 + monthlyRate, totalMonths) - 1);
      let remainingBalance = loanAmount;

      for (let i = 1; i <= totalMonths; i++) {
        const interest = remainingBalance * monthlyRate;
        const principal = pmt - interest;
        
        schedule.push({
          month: i,
          openingBalance: remainingBalance,
          interest: interest,
          principal: principal,
          closingBalance: Math.max(0, remainingBalance - principal),
          totalPayment: pmt
        });

        totalInterest += interest;
        remainingBalance -= principal;
        if (i === 1) firstMonthPayment = pmt;
      }
    }

    return {
      totalPrice,
      downPayment,
      loanAmount,
      totalInterest,
      totalPayment: loanAmount + totalInterest,
      firstMonthPayment,
      schedule
    };
  }, [homePrice, loanPercent, loanYears, interestRate, paymentMethod]);

  // Format số tiền
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(Math.round(amount));
  };

  const formatBillion = (amount) => {
    return (amount / 1000000000).toFixed(2);
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ['Kỳ thanh toán', 'Dư nợ đầu kỳ', 'Lãi thanh toán', 'Gốc thanh toán', 'Dư nợ cuối kỳ', 'Tổng thanh toán'];
    const rows = calculations.schedule.map(row => [
      row.month,
      Math.round(row.openingBalance),
      Math.round(row.interest),
      Math.round(row.principal),
      Math.round(row.closingBalance),
      Math.round(row.totalPayment)
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vay_mua_nha_${homePrice}ty_${loanPercent}%_${loanYears}nam_${interestRate}%.csv`;
    link.click();
  };

  // Export PDF (simple HTML to print)
  const exportPDF = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bảng thanh toán khoản vay</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1a1a2e; }
          .summary { margin-bottom: 20px; }
          .summary p { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background: #1a1a2e; color: white; }
          tr:nth-child(even) { background: #f9f9f9; }
        </style>
      </head>
      <body>
        <h1>Bảng thanh toán khoản vay mua nhà</h1>
        <div class="summary">
          <p><strong>Giá trị nhà:</strong> ${formatMoney(calculations.totalPrice)} VNĐ</p>
          <p><strong>Số tiền vay:</strong> ${formatMoney(calculations.loanAmount)} VNĐ</p>
          <p><strong>Thời hạn:</strong> ${loanYears} năm (${loanYears * 12} tháng)</p>
          <p><strong>Lãi suất:</strong> ${interestRate}%/năm</p>
          <p><strong>Tổng lãi phải trả:</strong> ${formatMoney(calculations.totalInterest)} VNĐ</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Kỳ</th>
              <th>Dư nợ đầu kỳ</th>
              <th>Lãi thanh toán</th>
              <th>Gốc thanh toán</th>
              <th>Dư nợ cuối kỳ</th>
              <th>Tổng thanh toán</th>
            </tr>
          </thead>
          <tbody>
            ${calculations.schedule.map(row => `
              <tr>
                <td>${row.month}</td>
                <td>${formatMoney(row.openingBalance)}</td>
                <td>${formatMoney(row.interest)}</td>
                <td>${formatMoney(row.principal)}</td>
                <td>${formatMoney(row.closingBalance)}</td>
                <td>${formatMoney(row.totalPayment)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Tính phần trăm cho biểu đồ tròn (bao gồm cả tiền trả trước)
  const totalAmount = calculations.totalPrice + calculations.totalInterest;
  const downPaymentPercent = (calculations.downPayment / totalAmount) * 100;
  const principalPercent = (calculations.loanAmount / totalAmount) * 100;
  const interestPercent = (calculations.totalInterest / totalAmount) * 100;

  // Tính góc cho từng segment (theo chiều kim đồng hồ từ 12h)
  const radius = 40;
  const strokeWidth = 20;
  const center = 50;
  
  // Tính góc bắt đầu và kết thúc cho mỗi segment
  const downPaymentAngle = (downPaymentPercent / 100) * 360 * (animationProgress / 100);
  const principalAngle = (principalPercent / 100) * 360 * (animationProgress / 100);
  const interestAngle = (interestPercent / 100) * 360 * (animationProgress / 100);

  // Helper function để tạo arc path
  const createArcPath = (startAngle, endAngle, r) => {
    if (endAngle - startAngle <= 0) return '';
    
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    const x1 = center + r * Math.cos(startRad);
    const y1 = center + r * Math.sin(startRad);
    const x2 = center + r * Math.cos(endRad);
    const y2 = center + r * Math.sin(endRad);
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // Tính góc cho mỗi segment
  const downPaymentStart = 0;
  const downPaymentEnd = downPaymentAngle;
  const principalStart = downPaymentEnd;
  const principalEnd = principalStart + principalAngle;
  const interestStart = principalEnd;
  const interestEnd = interestStart + interestAngle;

  // Tooltip data
  const getTooltipData = () => {
    if (!hoveredSegment) return null;
    switch (hoveredSegment) {
      case 'downpayment':
        return { label: 'Cần trả trước', value: calculations.downPayment, percent: downPaymentPercent, color: '#22d3ee' };
      case 'principal':
        return { label: 'Gốc cần trả', value: calculations.loanAmount, percent: principalPercent, color: '#3b82f6' };
      case 'interest':
        return { label: 'Lãi cần trả', value: calculations.totalInterest, percent: interestPercent, color: '#ec4899' };
      default:
        return null;
    }
  };

  const tooltipData = getTooltipData();

  return (
    <div className="mortgage-calculator">
      <h3>Tính vay mua nhà</h3>
      
      <div className="mortgage-content">
        {/* Left - Inputs */}
        <div className="mortgage-inputs">
          {/* Giá trị nhà */}
          <div className="input-group">
            <label>Giá trị nhà đất (tỷ VNĐ)</label>
            <div className="slider-input">
              <input
                type="range"
                min="0.5"
                max="50"
                step="0.1"
                value={homePrice}
                onChange={(e) => setHomePrice(parseFloat(e.target.value))}
              />
              <div className="input-value">
                <input
                  type="number"
                  value={homePrice}
                  onChange={(e) => setHomePrice(parseFloat(e.target.value) || 0)}
                  step="0.1"
                />
                <span>tỷ</span>
              </div>
            </div>
          </div>

          {/* Tỷ lệ vay */}
          <div className="input-group">
            <label>Tỷ lệ vay (%)</label>
            <div className="slider-input">
              <input
                type="range"
                min="10"
                max="90"
                step="1"
                value={loanPercent}
                onChange={(e) => setLoanPercent(parseInt(e.target.value))}
              />
              <div className="input-value">
                <input
                  type="number"
                  value={loanPercent}
                  onChange={(e) => setLoanPercent(parseInt(e.target.value) || 0)}
                />
                <span>%</span>
              </div>
            </div>
          </div>

          {/* Thời hạn vay */}
          <div className="input-group">
            <label>Thời hạn vay (năm)</label>
            <div className="slider-input">
              <input
                type="range"
                min="1"
                max="35"
                step="1"
                value={loanYears}
                onChange={(e) => setLoanYears(parseInt(e.target.value))}
              />
              <div className="input-value">
                <input
                  type="number"
                  value={loanYears}
                  onChange={(e) => setLoanYears(parseInt(e.target.value) || 1)}
                />
                <span>năm</span>
              </div>
            </div>
          </div>

          {/* Lãi suất */}
          <div className="input-group">
            <label>Lãi suất %/năm</label>
            <div className="slider-input">
              <input
                type="range"
                min="1"
                max="20"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(parseFloat(e.target.value))}
              />
              <div className="input-value">
                <input
                  type="number"
                  value={interestRate}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                  step="0.1"
                />
                <span>%</span>
              </div>
            </div>
          </div>

          {/* Phương thức thanh toán */}
          <div className="payment-method">
            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="decreasing"
                checked={paymentMethod === 'decreasing'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>Thanh toán theo dư nợ giảm dần</span>
            </label>
            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="fixed"
                checked={paymentMethod === 'fixed'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>Thanh toán đều hàng tháng</span>
            </label>
          </div>
        </div>

        {/* Right - Results */}
        <div className="mortgage-results">
          <h4>Kết quả</h4>
          
          {/* Donut Chart */}
          <div className="donut-chart-container">
            <div className="donut-chart">
              <svg viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#222"
                  strokeWidth="20"
                />
                {/* Cần trả trước - Cyan */}
                {downPaymentEnd > downPaymentStart && (
                  <path
                    className={`donut-segment ${hoveredSegment === 'downpayment' ? 'hovered' : ''}`}
                    d={createArcPath(downPaymentStart, downPaymentEnd, radius)}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth={hoveredSegment === 'downpayment' ? 24 : strokeWidth}
                    strokeLinecap="butt"
                    onMouseEnter={() => setHoveredSegment('downpayment')}
                    onMouseLeave={() => setHoveredSegment(null)}
                    style={{ cursor: 'pointer', transition: 'stroke-width 0.2s, filter 0.2s' }}
                  />
                )}
                {/* Gốc cần trả - Blue */}
                {principalEnd > principalStart && (
                  <path
                    className={`donut-segment ${hoveredSegment === 'principal' ? 'hovered' : ''}`}
                    d={createArcPath(principalStart, principalEnd, radius)}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth={hoveredSegment === 'principal' ? 24 : strokeWidth}
                    strokeLinecap="butt"
                    onMouseEnter={() => setHoveredSegment('principal')}
                    onMouseLeave={() => setHoveredSegment(null)}
                    style={{ cursor: 'pointer', transition: 'stroke-width 0.2s, filter 0.2s' }}
                  />
                )}
                {/* Lãi cần trả - Pink */}
                {interestEnd > interestStart && (
                  <path
                    className={`donut-segment ${hoveredSegment === 'interest' ? 'hovered' : ''}`}
                    d={createArcPath(interestStart, interestEnd, radius)}
                    fill="none"
                    stroke="#ec4899"
                    strokeWidth={hoveredSegment === 'interest' ? 24 : strokeWidth}
                    strokeLinecap="butt"
                    onMouseEnter={() => setHoveredSegment('interest')}
                    onMouseLeave={() => setHoveredSegment(null)}
                    style={{ cursor: 'pointer', transition: 'stroke-width 0.2s, filter 0.2s' }}
                  />
                )}
              </svg>
              <div className="donut-center">
                <span className="donut-value">{formatBillion(totalAmount)}</span>
                <span className="donut-label">tỷ</span>
              </div>
              
              {/* Tooltip */}
              {tooltipData && (
                <div className="donut-tooltip" style={{ borderColor: tooltipData.color }}>
                  <div className="tooltip-label">{tooltipData.label}</div>
                  <div className="tooltip-percent" style={{ color: tooltipData.color }}>
                    {tooltipData.percent.toFixed(1)}%
                  </div>
                  <div className="tooltip-value">{formatMoney(tooltipData.value)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="result-summary">
            <div className="result-item">
              <span className="result-label">Cần trả trước:</span>
              <span className="result-value cyan">{formatMoney(calculations.downPayment)}</span>
            </div>
            <div className="result-item">
              <span className="result-label">Gốc cần trả:</span>
              <span className="result-value blue">{formatMoney(calculations.loanAmount)}</span>
            </div>
            <div className="result-item">
              <span className="result-label">Lãi cần trả:</span>
              <span className="result-value pink">{formatMoney(calculations.totalInterest)}</span>
            </div>
          </div>

          {/* Monthly Payment */}
          <div className="monthly-payment">
            <span className="monthly-label">Thanh toán tháng đầu:</span>
            <span className="monthly-value">{formatMoney(calculations.firstMonthPayment)}</span>
          </div>

          {/* Export Buttons */}
          <div className="export-buttons">
            <button className="export-btn csv" onClick={exportCSV}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Tải bảng thanh toán (CSV)
            </button>
            <button className="export-btn pdf" onClick={exportPDF}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              Tải bảng thanh toán (PDF)
            </button>
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default MortgageCalculator;
