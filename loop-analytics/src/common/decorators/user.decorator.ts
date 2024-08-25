import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Expose } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export enum UserRole {
  ADMIN = 'admin',
  PRO = 'pro',
  KAM = 'kam',
  SHIPPER = 'shipper',
  SHIPPER_AGENT = 'shipper_agent',
  CLUSTER_HEAD = 'cluster_head',
  GM = 'gm',
  VENDOR = 'vendor',
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
  gender: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  role: string;

  @IsString()
  @IsDate()
  createdAt: Date;

  @IsString()
  @IsNotEmpty()
  @Expose()
  profilePicture: string;

  @IsNumber()
  @IsNotEmpty()
  @Expose()
  companyId?: number;
}
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as UserType;
  },
);
