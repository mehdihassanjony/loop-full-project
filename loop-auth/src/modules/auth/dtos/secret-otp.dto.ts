export class SecretOtpDto {
  currentDateTime: Date;
  otpNumber: number;
  validTill: Date;
  user: object;
  createdAt: Date;
  updatedAt: Date;
  id: number;
  verified: boolean;
}
