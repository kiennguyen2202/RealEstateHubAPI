import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import axiosClient from '../../api/axiosClient';
import './PriceChart.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PriceChart = ({ 
  cityId, 
  districtId, 
  categoryId, 
  transactionType = 0,
  currentPrice,
  areaSize,
  title = "Lịch sử giá bán"
}) => {
  const [chartData, setChartData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('1year'); // 1year, 2year, 5year
  const [activeTab, setActiveTab] = useState(transactionType === 0 ? 'sale' : 'rent');

  useEffect(() => {
    fetchPriceHistory();
  }, [cityId, districtId, categoryId, activeTab, timeRange]);

  const fetchPriceHistory = async () => {
    try {
      setLoading(true);
      const months = timeRange === '1year' ? 12 : timeRange === '2year' ? 24 : 60;
      const txType = activeTab === 'sale' ? 0 : 1;
      
      const response = await axiosClient.get('/api/pricehistory/market-stats', {
        params: {
          cityId,
          districtId,
          categoryId,
          transactionType: txType,
          months
        }
      });

      const { history, summary: summaryData } = response.data;
      setSummary(summaryData);

      if (history && history.length > 0) {
        setChartData({
          labels: history.map(h => h.month),
          datasets: [
            {
              label: 'Giá cao nhất',
              data: history.map(h => h.highestPrice),
              borderColor: '#9ca3af',
              backgroundColor: 'transparent',
              borderWidth: 1.5,
              borderDash: [6, 4],
              pointRadius: 0,
              tension: 0.3
            },
            {
              label: 'Giá phổ biến nhất',
              data: history.map(h => h.averagePrice),
              borderColor: '#22c55e',
              backgroundColor: 'transparent',
              borderWidth: 2.5,
              pointRadius: 0,
              pointHoverRadius: 6,
              pointHoverBackgroundColor: '#22c55e',
              pointHoverBorderColor: '#fff',
              pointHoverBorderWidth: 2,
              fill: false,
              tension: 0.3
            },
            {
              label: 'Giá thấp nhất',
              data: history.map(h => h.lowestPrice),
              borderColor: '#60a5fa',
              backgroundColor: 'transparent',
              borderWidth: 1.5,
              borderDash: [6, 4],
              pointRadius: 0,
              tension: 0.3
            }
          ]
        });
      } else {
        setChartData(null);
      }
    } catch (error) {
      console.error('Error fetching price history:', error);
      setChartData(null);
    } finally {
      setLoading(false);
    }
  };

  // Tính giá tin đang xem (triệu/m²)
  const getCurrentPricePerM2 = () => {
    if (!currentPrice || !areaSize || areaSize <= 0) return null;
    return parseFloat((currentPrice / areaSize).toFixed(2));
  };

  // Tạo chart data với điểm đỏ giá tin đang xem
  const getChartDataWithCurrentPrice = () => {
    if (!chartData) return null;
    
    const currentPricePerM2 = getCurrentPricePerM2();
    if (!currentPricePerM2) return chartData;

    const dataLength = chartData.labels.length;
    
    // Tạo mảng data với chỉ 1 điểm ở cuối
    const currentPriceData = chartData.labels.map((_, index) => 
      index === dataLength - 1 ? currentPricePerM2 : null
    );

    return {
      ...chartData,
      datasets: [
        ...chartData.datasets,
        {
          label: 'Giá tin đang xem',
          data: currentPriceData,
          borderColor: 'transparent',
          backgroundColor: '#ef4444',
          borderWidth: 0,
          pointRadius: 8,
          pointHoverRadius: 10,
          pointBackgroundColor: '#ef4444',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          showLine: false, // Không vẽ đường, chỉ vẽ điểm
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(30, 30, 30, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#444',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        cornerRadius: 4,
        callbacks: {
          label: function(context) {
            if (context.parsed.y === null) return null;
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)} tr/m²`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false, // Không hiện grid dọc
          drawBorder: false
        },
        ticks: {
          color: '#9ca3af',
          font: { size: 11 },
          padding: 8
        },
        border: {
          display: false
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.15)',
          drawBorder: false,
          lineWidth: 1
        },
        ticks: {
          color: '#9ca3af',
          font: { size: 11 },
          padding: 12,
          callback: function(value) {
            return value.toFixed(0);
          }
        },
        border: {
          display: false,
          dash: [4, 4]
        }
      }
    },
    elements: {
      line: {
        borderCapStyle: 'round'
      }
    },
    hover: {
      mode: 'index',
      intersect: false
    }
  };

  // Custom plugin để vẽ grid ngang nét đứt và đường dọc ở đầu
  const customGridPlugin = {
    id: 'customGrid',
    beforeDatasetsDraw: (chart) => {
      const ctx = chart.ctx;
      const yAxis = chart.scales.y;
      const xAxis = chart.scales.x;
      
      ctx.save();
      
      // Vẽ đường dọc ở đầu (trục Y)
      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.moveTo(xAxis.left, yAxis.top);
      ctx.lineTo(xAxis.left, yAxis.bottom);
      ctx.stroke();
      
      // Vẽ các đường ngang nét đứt
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      
      const tickCount = yAxis.ticks.length;
      for (let i = 0; i < tickCount; i++) {
        const y = yAxis.getPixelForTick(i);
        ctx.beginPath();
        ctx.moveTo(xAxis.left, y);
        ctx.lineTo(xAxis.right, y);
        ctx.stroke();
      }
      
      ctx.restore();
    }
  };

  // Plugin để vẽ đường dọc khi hover
  const verticalLinePlugin = {
    id: 'verticalLine',
    afterDraw: (chart) => {
      if (chart.tooltip?._active?.length) {
        const ctx = chart.ctx;
        const activePoint = chart.tooltip._active[0];
        const x = activePoint.element.x;
        const topY = chart.scales.y.top;
        const bottomY = chart.scales.y.bottom;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, topY);
        ctx.lineTo(x, bottomY);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 3; i++) {
      stars.push(
        <span key={i} className={`star ${i < rating ? 'filled' : ''}`}>★</span>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="price-chart-container">
        <div className="price-chart-loading">
          <div className="spinner"></div>
          <span>Đang tải dữ liệu giá...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="price-chart-container">
      <div className="price-chart-header">
        <h3>{title}</h3>
        <div className="price-chart-tabs">
          <button 
            className={`tab-btn ${activeTab === 'sale' ? 'active' : ''}`}
            onClick={() => setActiveTab('sale')}
          >
            Mua bán
          </button>
          <button 
            className={`tab-btn ${activeTab === 'rent' ? 'active' : ''}`}
            onClick={() => setActiveTab('rent')}
          >
            Cho thuê
          </button>
        </div>
        <div className="time-range-tabs">
          <button 
            className={`range-btn ${timeRange === '1year' ? 'active' : ''}`}
            onClick={() => setTimeRange('1year')}
          >
            1 năm
          </button>
          <button 
            className={`range-btn ${timeRange === '2year' ? 'active' : ''}`}
            onClick={() => setTimeRange('2year')}
          >
            2 năm
          </button>
          <button 
            className={`range-btn ${timeRange === '5year' ? 'active' : ''}`}
            onClick={() => setTimeRange('5year')}
          >
            5 năm
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="price-summary">
          <div className="summary-item">
            <div className="summary-value">{summary.currentAverage?.toFixed(1) || '0'} <span>tr/m²</span></div>
            <div className="summary-label">Giá bán phổ biến nhất</div>
            <div className="summary-date">T{new Date().getMonth() + 1}/{new Date().getFullYear() % 100}</div>
          </div>
          <div className="summary-item">
            <div className={`summary-value ${summary.priceChange >= 0 ? 'positive' : 'negative'}`}>
              {summary.priceChange >= 0 ? '↑' : '↓'} {Math.abs(summary.priceChange)}%
            </div>
            <div className="summary-label">Giá bán đã {summary.priceChange >= 0 ? 'tăng' : 'giảm'} trong 1 năm qua</div>
          </div>
          <div className="summary-item">
            <div className="summary-stars">{renderStars(summary.rating || 2)}</div>
            <div className="summary-label">
              Giá phổ biến T{new Date().getMonth() + 1}/{new Date().getFullYear() % 100} là 
              {summary.rating === 3 ? ' cao nhất' : summary.rating === 2 ? ' trung bình' : ' thấp nhất'} trong {timeRange === '1year' ? '1' : timeRange === '2year' ? '2' : '5'} năm qua
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="price-chart-wrapper">
        {chartData ? (
          <Line 
            data={getChartDataWithCurrentPrice()} 
            options={{
              ...chartOptions,
              scales: {
                ...chartOptions.scales,
                y: {
                  ...chartOptions.scales.y,
                  grid: {
                    display: false // Tắt grid mặc định, dùng plugin vẽ
                  }
                }
              }
            }} 
            plugins={[customGridPlugin, verticalLinePlugin]}
          />
        ) : (
          <div className="no-data">
            <span>📊</span>
            <p>Chưa có đủ dữ liệu để hiển thị biểu đồ</p>
          </div>
        )}
      </div>

      {/* Current Post Price Indicator */}
      {getCurrentPricePerM2() && chartData && (
        <div className="current-price-indicator">
          <span className="indicator-dot"></span>
          <span>Giá tin đang xem: ~{getCurrentPricePerM2().toFixed(2)} tr/m²</span>
        </div>
      )}

      {/* Legend */}
      <div className="price-chart-legend">
        <div className="legend-item">
          <span className="legend-line dashed gray"></span>
          <span>Giá cao nhất</span>
        </div>
        <div className="legend-item">
          <span className="legend-line solid green"></span>
          <span>Giá phổ biến nhất</span>
        </div>
        <div className="legend-item">
          <span className="legend-line dashed orange"></span>
          <span>Giá thấp nhất</span>
        </div>
        {getCurrentPricePerM2() && (
          <div className="legend-item">
            <span className="legend-dot red"></span>
            <span>Giá tin đang xem</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceChart;
