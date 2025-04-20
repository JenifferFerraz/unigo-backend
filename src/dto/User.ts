
export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  cpf: string;
  role?: 'student' | 'professor' | 'admin';
  termsAccepted: boolean;
  avatar?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  studentProfile?: {
      studentId: string;
      phone: string;
      courseId?: number;
  };
}

export interface UserResponseDTO {
    id: number;
    name: string;
    cpf: string;
    email: string;
    avatar?: string;
    role: 'student' | 'professor' | 'admin';
    documentId?: string;
    isEmailVerified: boolean;
    isDeleted: boolean;
    phone?: string;
    createdAt: Date;
    updatedAt: Date;
    termsAccepted: boolean;

}