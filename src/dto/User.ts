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
  email: string;
  documentId?: string;
  phone?: string;
}