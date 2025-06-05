import React, { useState } from 'react';

const SearchForm = ({ onSearch }) => {
  const [filters, setFilters] = useState({
    categoryId: "",
    minPrice: "",
    maxPrice: "",
    minArea: "",
    maxArea: "",
    city: "",
    district: "",
    ward: "",
    status: ""
  });

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(filters);
  };

  return (
    <form onSubmit={handleSubmit} className="search-form space-y-4 p-4 bg-white rounded shadow">
      <div className="grid grid-cols-2 gap-4">
        <input name="categoryId" placeholder="Loại bất động sản" onChange={handleChange} />
        <select name="status" onChange={handleChange}>
          <option value="">Tất cả</option>
          <option value="ForSale">Cần bán</option>
          <option value="ForRent">Cho thuê</option>
        </select>
        <input type="number" name="minPrice" placeholder="Giá từ" onChange={handleChange} />
        <input type="number" name="maxPrice" placeholder="Giá đến" onChange={handleChange} />
        <input type="number" name="minArea" placeholder="Diện tích từ" onChange={handleChange} />
        <input type="number" name="maxArea" placeholder="Diện tích đến" onChange={handleChange} />
        <input name="city" placeholder="Thành phố" onChange={handleChange} />
        <input name="district" placeholder="Quận" onChange={handleChange} />
      </div>
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Tìm kiếm</button>
    </form>
  );
};

export default SearchForm;
