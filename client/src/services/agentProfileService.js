import axiosPrivate from '../api/axiosPrivate';
import axiosClient from '../api/axiosClient';

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
    const response = await axiosClient.get(`/api/areas/wards/${wardId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ward with ID ${wardId}:`, error);
    return null;
  }
};

export const getDistrictById = async (districtId) => {
  try {
    const response = await axiosClient.get(`/api/areas/districts/${districtId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching district with ID ${districtId}:`, error);
    return null;
  }
};

export const getCityById = async (cityId) => {
  try {
    const response = await axiosClient.get(`/api/areas/cities/${cityId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching city with ID ${cityId}:`, error);
    return null;
  }
};

export const getCategoryById = async (categoryId) => {
  try {
    console.log(`Fetching category with ID: ${categoryId}`);
    const response = await axiosClient.get(`/api/categories/${categoryId}`);
    console.log(`Category response:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching category with ID ${categoryId}:`, error);
    return null;
  }
};
