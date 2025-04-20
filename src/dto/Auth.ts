export interface LoginDTO {
    email: string;
    password: string;
}

export interface AuthResponseDTO {
    token: string;
    refreshToken: string;
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
    };
}