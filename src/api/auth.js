import axiosInstance from "./axiosConfig";

export const login = async (credentials) => {
  const res = await axiosInstance.post("/token/", credentials);
  const { access, refresh } = res.data;
  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);
  return res.data;
};

export const logout = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
};

export const refresh = async () => {
  const refreshToken = localStorage.getItem("refresh");
  if (!refreshToken) return null;
  const res = await axiosInstance.post("/token/refresh/", { 
    refresh: refreshToken 
  });
  localStorage.setItem("access", res.data.access);
  return res.data;
};