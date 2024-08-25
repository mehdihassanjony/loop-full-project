import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsDefined,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { USERROLE } from '../../../common/constants';
import * as googleLib from 'google-libphonenumber';
const normalizer = require('normalize-email');

const phoneUtil = googleLib.PhoneNumberUtil.getInstance();
const PNF = googleLib.PhoneNumberFormat;

export class UserLoginDto {
  @IsNotEmpty({ message: 'Must define phoneOrEmail in body' })
  @IsDefined({ message: 'phoneOrEmail must not be null' })
  @IsString({ message: 'Must provide phoneOrEmail in string' })
  @Transform((data) => {
    if (isNaN(data.value)) {
      if (!data.value.includes('@'))
        throw new BadRequestException('Enter a valid Email');
      return normalizer(data.value);
    }
    let formattedNumber;
    let number = phoneUtil.parseAndKeepRawInput(
      data.value,
      data.value.startsWith('+') ? '' : 'BD',
    );
    let valid = phoneUtil.isValidNumber(number);
    if (valid) {
      formattedNumber = phoneUtil.format(number, PNF.E164);
    } else {
      throw new BadRequestException('Not a valid phone number');
    }
    return formattedNumber;
  })
  phoneOrEmail: string;

  @IsNotEmpty({ message: 'Must define password in body' })
  @IsDefined({ message: 'Password must not be null' })
  @IsString({ message: 'Must provide password in string' })
  password: string;

  @IsOptional()
  @IsString({
    each: true,
    message: 'Each item in allowedUserRoles must be a strings',
  })
  @Transform((data) => {
    data.value.forEach((element) => {
      if (!USERROLE.includes(element)) {
        throw new BadRequestException('Invalid allowedUserRoles');
      }
    });
    return data.value;
  })
  allowedUserRoles: string[];
}

export class UserVerifyOtpDto {
  @IsNotEmpty({ message: 'Must define phoneOrEmail in body' })
  @IsDefined({ message: 'phoneOrEmail must not be null' })
  @IsString({ message: 'Must provide phoneOrEmail in string' })
  @Transform((data) => {
    if (isNaN(data.value)) {
      if (!data.value.includes('@'))
        throw new BadRequestException('Enter a valid Email');
      return normalizer(data.value);
    }
    let formattedNumber;
    let number = phoneUtil.parseAndKeepRawInput(
      data.value,
      data.value.startsWith('+') ? '' : 'BD',
    );
    let valid = phoneUtil.isValidNumber(number);
    if (valid) {
      formattedNumber = phoneUtil.format(number, PNF.E164);
    } else {
      throw new BadRequestException('Not a valid phone number');
    }
    return formattedNumber;
  })
  phoneOrEmail: string;

  @IsNotEmpty({ message: 'Must define otpNumber in body' })
  @IsDefined({ message: 'otpNumber must not be null' })
  @IsNumber()
  otpNumber: number;
}

export class ForgetPasswordDto {
  @IsNotEmpty({ message: 'Must define phoneOrEmail in body' })
  @IsDefined({ message: 'phoneOrEmail must not be null' })
  @IsString({ message: 'Must provide phoneOrEmail in string' })
  @Transform((data) => {
    if (isNaN(data.value)) {
      if (!data.value.includes('@'))
        throw new BadRequestException('Enter a valid Email');
      return normalizer(data.value);
    }
    let formattedNumber;
    let number = phoneUtil.parseAndKeepRawInput(
      data.value,
      data.value.startsWith('+') ? '' : 'BD',
    );
    let valid = phoneUtil.isValidNumber(number);
    if (valid) {
      formattedNumber = phoneUtil.format(number, PNF.E164);
    } else {
      throw new BadRequestException('Not a valid phone number');
    }
    return formattedNumber;
  })
  phoneOrEmail: string;

  @IsOptional()
  @IsString({
    each: true,
    message: 'Each item in allowedUserRoles must be a strings',
  })
  @Transform((data) => {
    data.value.forEach((element) => {
      if (!USERROLE.includes(element)) {
        throw new BadRequestException('Invalid allowedUserRoles');
      }
    });
    return data.value;
  })
  allowedUserRoles: string[];
}

export class UpdateUserDto {
  @IsOptional()
  @IsNotEmpty({ message: 'Must define fullName in body' })
  @IsString({ message: 'Must provide Full name in string' })
  fullName: string;

  @IsOptional({ message: 'Email is optional' })
  @IsNotEmpty({ message: 'Must define email in body' })
  @IsString({ message: 'Must provide valid email' })
  @IsEmail()
  @Transform((data) => {
    if (data.value) {
      return normalizer(data.value);
    }
    return data.value;
  })
  email: string;

  @IsOptional({ message: 'Date of birth is optional' })
  @IsNotEmpty({ message: 'Must define dob in body' })
  @IsDate({ message: 'Date of birth must be a iso date if provided' })
  dob: Date;

  @IsOptional({ message: 'Nid is optional' })
  @IsNotEmpty({ message: 'Must define nid in body' })
  @IsString()
  nid: string;
}

export class UpdateUserCrmDto {
  @IsOptional()
  @IsNotEmpty({ message: 'Must define fullName in body' })
  @IsString({ message: 'Must provide Full name in string' })
  fullName: string;

  @IsOptional({ message: 'Email is optional' })
  @IsNotEmpty({ message: 'Must define email in body' })
  @IsString({ message: 'Must provide valid email' })
  @IsEmail()
  @Transform((data) => {
    if (data.value) {
      return normalizer(data.value);
    }
    return data.value;
  })
  email: string;

  @IsOptional({ message: 'Date of birth is optional' })
  @IsNotEmpty({ message: 'Must define dob in body' })
  @IsDate({ message: 'Date of birth must be a iso date if provided' })
  dob: Date;

  @IsOptional({ message: 'Nid is optional' })
  @IsNotEmpty({ message: 'Must define nid in body' })
  @IsString()
  nid: string;

  @IsOptional({ message: 'tin is optional' })
  @IsString({ message: 'tin must be string' })
  @IsNotEmpty({ message: 'Must define tin in body' })
  tin: string;

  @IsOptional({ message: 'isEnabled is optional' })
  @IsBoolean({ message: 'isEnabled must be a boolean value' })
  isEnabled: boolean;

  @IsOptional({ message: 'isVerified is optional' })
  @IsBoolean({ message: 'isVerified must be a boolean' })
  isVerified: boolean;
}

export class ChangePasswordDto {
  @IsDefined({ message: 'Must define password' })
  @IsNotEmpty({ message: 'password shouldn`t be empty' })
  @IsString({ message: 'password must be a string' })
  @MinLength(6, { message: 'password must be minumum 6 letters long' })
  password: string;

  @IsDefined({ message: 'Must define confirmPassword' })
  @IsNotEmpty({ message: 'confirmPassword shouldn`t be empty' })
  @IsString({ message: 'confirmPassword must be a string' })
  @MinLength(6, { message: 'confirm password must be minumum 6 letters long' })
  confirmPassword: string;
}

export class RefreshTokenDto {
  @IsDefined({ message: 'Must define refreshToken' })
  @IsNotEmpty({ message: 'refreshToken shouldn`t be empty' })
  @IsString({ message: 'refreshToken must be a string' })
  refreshToken: string;
}

export class LogoutDto {
  @IsDefined({ message: 'Must define accessToken' })
  @IsNotEmpty({ message: 'accessToken shouldn`t be empty' })
  @IsString({ message: 'accessToken must be a string' })
  accessToken: string;

  @IsDefined({ message: 'Must define refreshToken' })
  @IsNotEmpty({ message: 'refreshToken shouldn`t be empty' })
  @IsString({ message: 'refreshToken must be a string' })
  refreshToken: string;

  // @IsNotEmpty({ message: 'Must define pushToken in body' })
  // @IsDefined({ message: 'pushToken must not be null' })
  // @IsString({ message: 'Must provide pushToken in string' })
  // pushToken: string;
}

export class AddShipperDto {
  @IsNotEmpty({ message: 'Must define fullName in body' })
  @IsDefined({ message: 'Full name must not be null' })
  @IsString({ message: 'Must provide Full name in string' })
  fullName: string;

  @IsNotEmpty({ message: 'Must define phone in body' })
  @IsDefined({ message: 'Phone must not be null' })
  @IsString({ message: 'Must provide phone in string' })
  @Transform((data) => {
    if (isNaN(data.value)) {
      if (!data.value.includes('@'))
        throw new BadRequestException('Enter a valid Email');
      return data.value;
    }
    let formattedNumber;
    let number = phoneUtil.parseAndKeepRawInput(
      data.value,
      data.value.startsWith('+') ? '' : 'BD',
    );
    let valid = phoneUtil.isValidNumber(number);
    if (valid) {
      formattedNumber = phoneUtil.format(number, PNF.E164);
    } else {
      throw new BadRequestException('Not a valid phone number');
    }
    return formattedNumber;
  })
  phone: string;

  @IsOptional({ message: 'Email is optional' })
  @IsNotEmpty({ message: 'Must define email in body' })
  @IsString({ message: 'Must provide valid email' })
  @IsEmail()
  @Transform((data) => {
    if (data.value) {
      return normalizer(data.value);
    }
    return data.value;
  })
  email: string;

  @IsDefined({ message: 'role must be defined' })
  @IsNotEmpty({ message: 'role must not be empty' })
  @IsString({ message: 'role must be string' })
  @IsEnum(['shipper', 'shipper_agent'], {
    message: 'role not valid! must be on of => shipper or shipper_agent',
  })
  role: string;

  @IsOptional()
  // @IsDefined({ message: 'reference must be defined' })
  // @IsNotEmpty({ message: 'reference must not be empty' })
  @IsNumber()
  reference: number;
}
