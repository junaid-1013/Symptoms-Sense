import axiosInstance from "@/lib/axiosInstance";
import { GoogleAuthApiProps, LoginApiProps, RegisterApiProps } from "@/types";
import { GoogleAuthApiUrl, GoogleAuthUrlApiUrl, LoginApiUrl, LogoutApiUrl, MeApiUrl, RefreshApiUrl, RegisterApiUrl } from "./URLs";

export const LoginApi = async ({ email, password }: LoginApiProps) => {
    const response = await axiosInstance.post(
        `${LoginApiUrl}`,
        {
            email: email,
            password: password,
        }
    );
    return response;
};
export const RegisterApi = async ({ email, password, name, phone }: RegisterApiProps) => {
    const response = await axiosInstance.post(
        `${RegisterApiUrl}`,
        {
            email: email,
            password: password,
            name: name,
            phone: phone,
        },
    );
    return response;
};
export const LogoutApi = async (refreshToken: string) => {
    const response = await axiosInstance.post(`${LogoutApiUrl}`, {
        refresh_token: refreshToken
    });
    return response;
};
export const MeApi = async (accessToken: string) => {
    const response = await axiosInstance.get(`${MeApiUrl}`, {
        params: { token: accessToken },
    });
    return response;
};
export const RefreshTokenApi = async (refreshToken: string) => {
    const response = await axiosInstance.post(`${RefreshApiUrl}`, {
        refresh_token: refreshToken,
    });
    return response;
};
export const GetGoogleAuthUrlApi = async () => {
    const response = await axiosInstance.get(`${GoogleAuthUrlApiUrl}`);
    return response;
};
export const GoogleAuthApi = async ({ code }: GoogleAuthApiProps) => {
    const response = await axiosInstance.post(
        `${GoogleAuthApiUrl}`, { code },
        {
            headers: {
                "X-Platform": "web",
            },
        }
    );
    return response;
};