import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export enum UserRole {
  VENDOR = 'vendor',
  ADMIN = 'admin',
}
export class UserType {
  @IsString()
  @IsNotEmpty()
  @Expose()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @Expose()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  phone: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  role: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  profilePicture: string;
}

export class SupplierUserType extends UserType {
  @IsString()
  @IsNotEmpty()
  @Expose()
  companyName: string;
}

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as UserType;
  },
);
