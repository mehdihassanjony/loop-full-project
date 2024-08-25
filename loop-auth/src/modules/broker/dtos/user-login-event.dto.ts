import { IsString } from 'class-validator';

export class UserLoginEventDto {
  @IsString()
  userId: string;
}
