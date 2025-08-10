import axiosPrivate from '../api/axiosPrivate';

export const getAgentProfileById = async (id) => {
  try {
    const response = await axiosPrivate.get(`/api/agent-profile/${id}`); 
    return response.data;
  } catch (error) {
    console.error(`Error fetching agent profile with ID ${id}:`, error);
    throw error;
  }
};

export const getWardById = async (wardId) => {
  try {
    const response = await axiosPrivate.get(`/api/areas/wards/${wardId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ward with ID ${wardId}:`, error);
    return null;
  }
};

export const getDistrictById = async (districtId) => {
  try {
    const response = await axiosPrivate.get(`/api/areas/districts/${districtId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching district with ID ${districtId}:`, error);
    return null;
  }
};

export const getCityById = async (cityId) => {
  try {
    const response = await axiosPrivate.get(`/api/areas/cities/${cityId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching city with ID ${cityId}:`, error);
    return null;
  }
};

export const getCategoryById = async (categoryId) => {
  try {
    const response = await axiosPrivate.get(`/api/categories/${categoryId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching category with ID ${categoryId}:`, error);
    return null;
  }
};