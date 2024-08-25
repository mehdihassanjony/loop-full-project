import { TeamEnum } from './enums';

export class ResponseDto {
  code: number;
  success: boolean;
  message: string;
  data: any;
}

export class UserTokenPayloadDto {
  id: number;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  isEnabled: boolean;
  isVerified: boolean;
  isPasswordSet: boolean;
  role: string;
  profilePicture: string;
  lastLogin: Date;

  team?: TeamEnum;
  gender: string;
  createdAt: Date;
}
